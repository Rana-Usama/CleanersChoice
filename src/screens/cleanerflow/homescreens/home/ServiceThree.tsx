import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../../constants/Themes';
import RemovePackageModal from '../../../../components/RemovePackageModal';
import PackageCard from '../../../../components/servicePackages/PackageCard';
import PackageForm from '../../../../components/servicePackages/PackageForm';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import * as Progress from 'react-native-progress';

const {width} = Dimensions.get('window');
// Packages are optional. A cleaner can publish a service with 0-3 packages.
const MAX_PACKAGES = 3;

/** Shared layout animation so cards glide when the list changes. */
const LAYOUT = LinearTransition.duration(220);

const PACKAGE_TIPS = [
  'Packages are optional — you can publish with 0 to 3',
  'Say exactly what’s included so customers can compare',
  'Price for the scope of work, e.g. rooms or hours',
];

type Package = {
  id: number;
  details: string;
  price: string;
};

type DraftErrors = {
  details?: string;
  price?: string;
};

const ServiceThree: React.FC = ({navigation}: any) => {
  // Confirmed/added packages (0 to MAX_PACKAGES). Starts empty - packages are optional.
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);

  // Draft fields for the package currently being composed.
  const [draftDetails, setDraftDetails] = useState('');
  const [draftPrice, setDraftPrice] = useState('');
  const [draftErrors, setDraftErrors] = useState<DraftErrors>({});

  const hasServiceDetails = useSelector(
    (state: any) => !!state?.profile?.hasServiceDetails,
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [packageToRemove, setPackageToRemove] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Edit mode: the draft form doubles as the editor for an existing package.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  // Add mode: the "new package" form is collapsed until the cleaner asks for it.
  const [composerOpen, setComposerOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Hide the sticky footer while typing so the form keeps the space.
  useEffect(() => {
    const isIOS = Platform.OS === 'ios';
    const show = Keyboard.addListener(
      isIOS ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(
      isIOS ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  /** Clears the draft and closes whichever form (add or edit) is open. */
  const resetDraft = () => {
    setDraftDetails('');
    setDraftPrice('');
    setDraftErrors({});
    setEditingId(null);
    setComposerOpen(false);
  };

  const openComposer = () => {
    if (packages.length >= MAX_PACKAGES || editingId !== null) return;
    setDraftDetails('');
    setDraftPrice('');
    setDraftErrors({});
    setComposerOpen(true);
    setTimeout(
      () => scrollViewRef.current?.scrollToEnd({animated: true}),
      250,
    );
  };

  const onChangeDraftDetails = (text: string) => {
    setDraftDetails(text);
    setDraftErrors(prev => ({...prev, details: undefined}));
  };

  const onChangeDraftPrice = (text: string) => {
    setDraftPrice(text.replace(/[^0-9]/g, ''));
    setDraftErrors(prev => ({...prev, price: undefined}));
  };

  /**
   * Stable list keys. Ids are re-indexed 1..n on delete, so keying by id would
   * animate the WRONG card out. Content (+ occurrence, for duplicates) stays
   * attached to the right card.
   */
  const keyForPackage = (pkg: Package, index: number) => {
    const occurrence = packages
      .slice(0, index)
      .filter(p => p.details === pkg.details && p.price === pkg.price).length;
    return `${pkg.details}::${pkg.price}::${occurrence}`;
  };

  /**
   * Shared validation for add + edit. Returns the trimmed values, or null
   * after surfacing the error. An entirely empty form is a silent no-op when
   * adding (existing behaviour) but an error when editing.
   */
  const validateDraft = (
    mode: 'add' | 'edit',
  ): {details: string; price: string} | null => {
    const details = draftDetails.trim();
    const price = draftPrice.trim();

    if (!details && !price) {
      if (mode === 'edit') {
        setDraftErrors({
          details: 'Description is required',
          price: 'Price is required',
        });
      }
      return null;
    }

    if (details && !price) {
      setDraftErrors({price: 'Price is required'});
      Toast.show({
        type: 'error',
        text1: 'Missing Price',
        text2: 'Package price is required.',
      });
      return null;
    }

    if (price && !details) {
      setDraftErrors({details: 'Description is required'});
      Toast.show({
        type: 'error',
        text1: 'Missing Description',
        text2: 'Package description is required.',
      });
      return null;
    }

    return {details, price};
  };

  // Add package - only allowed when both description and price are provided.
  const handleAddPackage = () => {
    const draft = validateDraft('add');
    if (!draft) return;

    if (packages.length >= MAX_PACKAGES) {
      Toast.show({
        type: 'error',
        text1: 'Package Limit Reached',
        text2: `You can add up to ${MAX_PACKAGES} packages.`,
      });
      return;
    }

    setPackages(prev => [...prev, {id: prev.length + 1, ...draft}]);
    resetDraft();
  };

  // Load a package into the form for editing.
  const startEditPackage = (pkg: Package) => {
    setEditingId(pkg.id);
    setDraftDetails(String(pkg.details ?? ''));
    setDraftPrice(String(pkg.price ?? '').replace(/[^0-9]/g, ''));
    setDraftErrors({});
    setComposerOpen(false);
  };

  /**
   * Save an edited package. Persisted straight away (like delete), because the
   * cleaner is editing a package customers can already see. Firestore is
   * written first so a failed save leaves the form filled in for a retry.
   */
  const handleSaveEdit = async () => {
    if (editingId === null || editSaving) return;
    const draft = validateDraft('edit');
    if (!draft) return;

    const current = packages.find(pkg => pkg.id === editingId);
    if (!current) {
      resetDraft();
      return;
    }
    if (
      String(current.details) === draft.details &&
      String(current.price) === draft.price
    ) {
      resetDraft(); // Nothing changed.
      return;
    }

    const updated = packages.map(pkg =>
      pkg.id === editingId ? {...pkg, ...draft} : pkg,
    );

    const user = auth().currentUser;
    if (!user) return;
    setEditSaving(true);
    try {
      await firestore()
        .collection('CleanerServices')
        .doc(user.uid)
        .set({packages: updated, updatedAt: new Date()}, {merge: true});
      setPackages(updated);
      resetDraft();
      Toast.show({
        type: 'success',
        text1: 'Package Updated',
        text2: 'Your changes have been saved',
      });
    } catch (error) {
      console.log('[ServiceThree] package update failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not save your changes. Please try again.',
      });
    } finally {
      setEditSaving(false);
    }
  };

  // Remove Package
  const removePackage = (id: number) => {
    setPackageToRemove(id);
    setModalVisible(true);
  };

  // Upload data to firestore. Packages are optional - a service publishes
  // successfully with 0, 1, 2, or 3 packages.
  const savePackagesToFirestore = async () => {
    const user = auth().currentUser;
    if (!user) return;

    // Don't silently drop an unsaved package edit or a half-written package.
    if (editingId !== null) {
      Toast.show({
        type: 'info',
        text1: 'Unsaved changes',
        text2: 'Save or cancel your package edit first.',
      });
      return;
    }
    if (composerOpen) {
      if (draftDetails.trim() || draftPrice.trim()) {
        Toast.show({
          type: 'info',
          text1: 'Unsaved package',
          text2: 'Add or cancel the package you’re writing first.',
        });
        return;
      }
      setComposerOpen(false);
    }

    try {
      setLoading(true);
      const serviceRef = firestore()
        .collection('CleanerServices')
        .doc(user.uid);

      const doc = await serviceRef.get();
      if (doc.exists) {
        await serviceRef.update({
          packages,
          updatedAt: new Date(),
        });
      } else {
        await serviceRef.set({packages});
      }

      Toast.show({
        type: 'success',
        text1: packages.length ? 'Packages Saved' : 'Service Published',
        text2: packages.length
          ? 'Your service packages have been updated'
          : 'Your service has been published without packages',
      });

      navigation.navigate('CongratulationsScreen');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: 'An error occurred while uploading. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceData();
  }, []);

  const fetchServiceData = async () => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      const serviceRef = firestore()
        .collection('CleanerServices')
        .doc(user.uid);
      const doc = await serviceRef.get();
      if (doc.exists) {
        const data = doc.data();
        setPackages(Array.isArray(data?.packages) ? data.packages : []);
      }
    } catch (error) {}
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent={true}
      />

      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <MaterialIcons
              name="keyboard-backspace"
              size={RFPercentage(2.8)}
              color={Colors.white}
            />
          </TouchableOpacity>

          <Text style={styles.headerText}>Service Packages</Text>

          <View style={styles.headerRightSpacer} />
        </View>

        <View style={styles.headerDivider} />

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Step 3 of 3</Text>
            <Text style={styles.progressPercent}>100%</Text>
          </View>
          <Progress.Bar
            progress={1}
            width={width - 80}
            height={6}
            color={Colors.white}
            unfilledColor={Colors.whiteOverlay30}
            borderWidth={0}
            borderRadius={10}
            style={styles.progressBar}
          />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          automaticallyAdjustContentInsets={true}
          contentInsetAdjustmentBehavior="automatic">
          {/* Intro + capacity */}
          <View style={styles.intro}>
            {/* <Text style={styles.introTitle}>Your packages</Text> */}
            <Text style={styles.introSubtitle}>
              Optional. Offer up to {MAX_PACKAGES} packages so customers can
              compare options and prices.
            </Text>
            <View style={styles.capacityRow}>
              <View style={styles.capacityTrack}>
                {Array.from({length: MAX_PACKAGES}).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.capacitySegment,
                      i < packages.length && styles.capacitySegmentFilled,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.capacityText}>
                {packages.length} of {MAX_PACKAGES} added
              </Text>
            </View>
          </View>

          {/* Tips (collapsible) */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{expanded: tipsOpen}}
            activeOpacity={0.85}
            onPress={() => setTipsOpen(open => !open)}
            style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <View style={styles.tipsIcon}>
                <Feather name="zap" size={13} color={Colors.amberDarkText} />
              </View>
              <Text style={styles.tipsTitle}>Tips for great packages</Text>
              <Feather
                name={tipsOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.amberDarkText}
              />
            </View>
            {tipsOpen && (
              <Animated.View
                entering={FadeIn.duration(180)}
                style={styles.tipsBody}>
                {PACKAGE_TIPS.map(tip => (
                  <View key={tip} style={styles.tipRow}>
                    <View style={styles.tipDot} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </TouchableOpacity>

          {/* Packages */}
          <Animated.View layout={LAYOUT} style={styles.list}>
            {packages.map((pkg, index) => (
              <Animated.View
                key={keyForPackage(pkg, index)}
                entering={FadeInDown.duration(220)}
                exiting={FadeOut.duration(150)}
                layout={LAYOUT}
                style={styles.listItem}>
                {editingId === pkg.id ? (
                  <PackageForm
                    title={`Edit package ${index + 1}`}
                    details={draftDetails}
                    price={draftPrice}
                    errors={draftErrors}
                    submitLabel="Save changes"
                    saving={editSaving}
                    onChangeDetails={onChangeDraftDetails}
                    onChangePrice={onChangeDraftPrice}
                    onCancel={resetDraft}
                    onSubmit={handleSaveEdit}
                  />
                ) : (
                  <PackageCard
                    index={index}
                    details={String(pkg.details ?? '')}
                    price={pkg.price}
                    // One form at a time keeps the draft state unambiguous.
                    disabled={editSaving || editingId !== null || composerOpen}
                    onEdit={() => startEditPackage(pkg)}
                    onRemove={() => removePackage(pkg.id)}
                  />
                )}
              </Animated.View>
            ))}

            {composerOpen ? (
              <Animated.View
                key="composer"
                entering={FadeInDown.duration(220)}
                exiting={FadeOut.duration(150)}
                layout={LAYOUT}
                style={styles.listItem}>
                <PackageForm
                  title={`New package ${packages.length + 1}`}
                  details={draftDetails}
                  price={draftPrice}
                  errors={draftErrors}
                  submitLabel="Add package"
                  autoFocus
                  onChangeDetails={onChangeDraftDetails}
                  onChangePrice={onChangeDraftPrice}
                  onCancel={resetDraft}
                  onSubmit={handleAddPackage}
                />
              </Animated.View>
            ) : packages.length === 0 ? (
              <Animated.View
                key="empty"
                entering={FadeIn.duration(220)}
                layout={LAYOUT}
                style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Feather name="package" size={26} color={Colors.gradient1} />
                </View>
                <Text style={styles.emptyTitle}>No packages yet</Text>
                <Text style={styles.emptyText}>
                  Packages help customers choose faster. They're optional — you
                  can publish your service without them.
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.85}
                  onPress={openComposer}
                  style={styles.emptyButton}>
                  <LinearGradient
                    colors={[Colors.gradient1, Colors.gradient2]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.emptyButtonGradient}>
                    <Feather name="plus" size={17} color={Colors.white} />
                    <Text style={styles.emptyButtonText}>
                      Add your first package
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ) : packages.length < MAX_PACKAGES ? (
              <Animated.View key="add" layout={LAYOUT}>
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.75}
                  disabled={editingId !== null}
                  onPress={openComposer}
                  style={[
                    styles.addButton,
                    editingId !== null && styles.addButtonDisabled,
                  ]}>
                  <View style={styles.addIcon}>
                    <Feather name="plus" size={18} color={Colors.gradient1} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.addTitle}>Add another package</Text>
                    <Text style={styles.addSubtitle}>
                      {MAX_PACKAGES - packages.length} slot
                      {MAX_PACKAGES - packages.length === 1 ? '' : 's'} left
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={Colors.slate400}
                  />
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View
                key="limit"
                entering={FadeIn.duration(220)}
                layout={LAYOUT}
                style={styles.limitNote}>
                <Feather name="check-circle" size={15} color={Colors.success} />
                <Text style={styles.limitText}>
                  You've added the maximum of {MAX_PACKAGES} packages
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Sticky footer — hidden while typing so the form keeps the space */}
        {!keyboardVisible && (
          <View
            style={[
              styles.footer,
              {paddingBottom: Math.max(insets.bottom, 12) + 4},
            ]}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={savePackagesToFirestore}
              disabled={loading || editSaving}
              activeOpacity={0.85}
              style={styles.continueButton}>
              <LinearGradient
                colors={[Colors.gradient1, Colors.gradient2]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.continueGradient}>
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Text style={styles.continueText} numberOfLines={1}>
                      {hasServiceDetails ? 'Update Packages' : 'Complete Setup'}
                    </Text>
                    <AntDesign
                      name="check"
                      size={RFPercentage(2.1)}
                      color={Colors.white}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.footerNote}>
              {packages.length > 0
                ? `${packages.length} package${
                    packages.length > 1 ? 's' : ''
                  } will show on your profile`
                : 'You can publish without packages'}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      <RemovePackageModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setPackageToRemove(null);
        }}
        onConfirm={async () => {
          if (packageToRemove) {
            // Ids are re-indexed below, so an in-progress edit would point at
            // the wrong package afterwards — drop it.
            if (editingId !== null) resetDraft();
            try {
              // Step 1: Remove from screen
              const updated = packages.filter(
                pkg => pkg.id !== packageToRemove,
              );
              const reIndexed = updated.map((pkg, index) => ({
                ...pkg,
                id: index + 1,
              }));
              setPackages(reIndexed);

              // Step 2: Save to Firebase
              const user = auth().currentUser;
              if (user) {
                await firestore()
                  .collection('CleanerServices')
                  .doc(user.uid)
                  .update({
                    packages: reIndexed,
                    updatedAt: new Date(),
                  });

                Toast.show({
                  type: 'success',
                  text1: 'Package Removed',
                  text2: 'Package has been removed',
                });
              }
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to remove package',
              });
            }
          }
          setModalVisible(false);
          setPackageToRemove(null);
        }}
        packageNumber={packageToRemove || undefined}
      />
    </View>
  );
};

export default ServiceThree;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? RFPercentage(8) : RFPercentage(6),
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    // elevation: 8,
  },
  headerContent: {
    width: '90%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Platform.OS === 'ios' ? RFPercentage(8) : RFPercentage(10),
    marginTop: RFPercentage(0.6),
    paddingBottom: RFPercentage(1.8),
  },
  backButton: {
    width: RFPercentage(4.8),
    height: RFPercentage(4.8),
    borderRadius: RFPercentage(2.4),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerText: {
    fontSize: RFPercentage(2.3),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
    textAlign: 'center',
  },
  headerRightSpacer: {
    width: RFPercentage(4.8),
    height: RFPercentage(4.8),
  },
  headerDivider: {
    width: '90%',
    alignSelf: 'center',
    height: RFPercentage(0.12),
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressSection: {
    marginTop: RFPercentage(1.5),
    paddingHorizontal: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
    color: Colors.white,
    opacity: 0.9,
  },
  progressPercent: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
    color: Colors.white,
  },
  progressBar: {
    marginTop: 4,
    alignSelf: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
  },
  intro: {
    marginBottom: 16,
  },
  introTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.3),
    color: Colors.slate900,
  },
  introSubtitle: {
    marginTop: 4,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    lineHeight: RFPercentage(2.4),
    color: Colors.slate500,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 12,
  },
  capacityTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  capacitySegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gray200,
  },
  capacitySegmentFilled: {
    backgroundColor: Colors.gradient1,
  },
  capacityText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.45),
    color: Colors.slate500,
  },
  tipsCard: {
    backgroundColor: Colors.amberBg50,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipsIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.amberBg100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsTitle: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
    color: Colors.amberDarkText,
  },
  tipsBody: {
    marginTop: 10,
    gap: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingLeft: 8,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 8,
    backgroundColor: Colors.amber500,
  },
  tipText: {
    flex: 1,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    lineHeight: RFPercentage(2.2),
    color: Colors.amberDarkText,
  },
  list: {
    gap: 14,
  },
  listItem: {},
  emptyCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryBlueOverlay10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.95),
    color: Colors.slate900,
  },
  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.55),
    lineHeight: RFPercentage(2.3),
    color: Colors.slate500,
  },
  emptyButton: {
    marginTop: 20,
    height: 48,
    alignSelf: 'stretch',
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.white,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.slate300,
    backgroundColor: Colors.white,
  },
  addButtonDisabled: {
    opacity: 0.45,
  },
  addIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryBlueOverlay10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.gradient1,
  },
  addSubtitle: {
    marginTop: 1,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.slate500,
  },
  limitNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.successBg,
  },
  limitText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.successText,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  continueButton: {
    height: 46,
    borderRadius: 100,
    overflow: 'hidden',
  },
  continueGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.85),
    color: Colors.white,
  },
  footerNote: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.slate500,
  },
});
