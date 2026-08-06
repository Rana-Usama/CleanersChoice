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
  Animated as RNAnimated,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../../constants/Themes';
import RemovePackageModal from '../../../../components/RemovePackageModal';
import DescriptionField from '../../../../components/DescriptionField';
import InputField from '../../../../components/InputField';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {FadeInUp, ZoomIn} from 'react-native-reanimated';
import * as Progress from 'react-native-progress';
import Octicons from 'react-native-vector-icons/Octicons';

const {width} = Dimensions.get('window');
// Packages are optional. A cleaner can publish a service with 0-3 packages.
const MAX_PACKAGES = 3;

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

  const profileCompletion = useSelector(
    (state: any) => state?.profile?.profileCompletion,
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [packageToRemove, setPackageToRemove] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Add package - only allowed when both description and price are provided.
  const handleAddPackage = () => {
    const details = draftDetails.trim();
    const price = draftPrice.trim();

    if (!details && !price) {
      // Nothing entered - nothing to validate or add.
      return;
    }

    if (details && !price) {
      setDraftErrors({price: 'Price is required'});
      Toast.show({
        type: 'error',
        text1: 'Missing Price',
        text2: 'Package price is required.',
      });
      return;
    }

    if (price && !details) {
      setDraftErrors({details: 'Description is required'});
      Toast.show({
        type: 'error',
        text1: 'Missing Description',
        text2: 'Package description is required.',
      });
      return;
    }

    if (packages.length >= MAX_PACKAGES) {
      Toast.show({
        type: 'error',
        text1: 'Package Limit Reached',
        text2: `You can add up to ${MAX_PACKAGES} packages.`,
      });
      return;
    }

    setPackages(prev => [...prev, {id: prev.length + 1, details, price}]);
    setDraftDetails('');
    setDraftPrice('');
    setDraftErrors({});
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
          {/* Completion Card */}
          <Animated.View>
            <View style={styles.completionCard}>
              <LinearGradient
                colors={[Colors.greenBg50, Colors.greenBg100]}
                style={styles.completionGradient}>
                <View style={styles.completionContent}>
                  <View style={styles.completionIconContainer}>
                    <Octicons name="package" size={24} color={Colors.green500} />
                  </View>
                  <View style={styles.completionTextContainer}>
                    <Text style={styles.completionTitle}>Package Progress</Text>
                    <Text style={styles.completionSubtitle}>
                      {packages.length === 0
                        ? 'Optional — add up to 3 packages'
                        : `${packages.length}/${MAX_PACKAGES} package${
                            packages.length > 1 ? 's' : ''
                          } added`}
                    </Text>
                  </View>
                  <View style={styles.progressCircle}>
                    <Progress.Circle
                      progress={packages.length / MAX_PACKAGES}
                      size={50}
                      thickness={4}
                      color={Colors.green500}
                      unfilledColor={Colors.gray200}
                      borderWidth={0}>
                      <Text style={styles.progressCircleText}>
                        {packages.length}/{MAX_PACKAGES}
                      </Text>
                    </Progress.Circle>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Instructions Card */}
          <Animated.View>
            <View style={styles.instructionsCard}>
              <View style={styles.instructionsHeader}>
                <FontAwesome name="lightbulb-o" size={20} color={Colors.amber500} />
                <Text style={styles.instructionsTitle}>Pricing Tips</Text>
              </View>
              <View style={styles.instructionsContent}>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>
                    Packages are optional — you can publish your service with
                    0 to 3 packages
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>
                    Give each package a clear description of what's included
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>
                    Set competitive pricing based on the scope of work
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Packages Container */}
          <View style={styles.packagesContainer}>
            <Text style={styles.packagesTitle}>Service Packages (Optional)</Text>
            <Text style={styles.packagesSubtitle}>
              Add up to {MAX_PACKAGES} packages, or skip this step entirely
            </Text>

            {/* Confirmed / added packages */}
            {packages.map((pkg, index) => (
              <Animated.View
                entering={FadeInUp}
                key={pkg.id}
                style={styles.packageCardWrapper}>
                <View style={styles.packageHeader}>
                  <LinearGradient
                    colors={[Colors.indigoBg50, Colors.blueBg75]}
                    style={styles.packageHeaderGradient}>
                    <View style={styles.packageHeaderContent}>
                      <View style={styles.packageNumberContainer}>
                        <Text style={styles.packageNumber}>{index + 1}</Text>
                      </View>
                      <View style={styles.packageTitleContainer}>
                        <Text style={styles.packageTitle} numberOfLines={1}>
                          {pkg.details}
                        </Text>
                        <Text style={styles.packagePricePreview}>
                          ${pkg.price}
                        </Text>
                      </View>
                      <View style={styles.packageActions}>
                        <TouchableOpacity
                          onPress={() => removePackage(pkg.id)}
                          style={styles.removeButton}>
                          <AntDesign
                            name="delete"
                            size={16}
                            color={Colors.red500}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>
            ))}

            {/* Add-package draft form, shown until the limit is reached */}
            {packages.length < MAX_PACKAGES ? (
              <Animated.View
                entering={FadeInUp.delay(200)}
                style={styles.draftCard}>
                <LinearGradient
                  colors={[Colors.white, Colors.blueBg50]}
                  style={styles.draftCardGradient}>
                  <Text style={styles.draftCardTitle}>
                    New Package {packages.length + 1}
                  </Text>

                  {/* Package Details */}
                  <View style={styles.inputSection}>
                    <View style={styles.inputLabelContainer}>
                      <Text style={styles.inputLabel}>Package Details</Text>
                      <Text style={styles.charCount}>
                        {draftDetails.length}/120
                      </Text>
                    </View>
                    <DescriptionField
                      placeholder="Describe what's included in this package..."
                      count={false}
                      value={draftDetails}
                      maxLength={120}
                      onChangeText={text => {
                        setDraftDetails(text);
                        setDraftErrors(prev => ({...prev, details: undefined}));
                      }}
                      style={styles.descriptionField}
                      textInput={{fontSize: RFPercentage(1.5)}}
                    />
                    {draftErrors.details && (
                      <View style={styles.errorContainer}>
                        <MaterialIcons
                          name="error-outline"
                          size={16}
                          color={Colors.red500}
                        />
                        <Text style={styles.errorText}>
                          {draftErrors.details}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Price Input */}
                  <View style={styles.inputSection}>
                    <View style={styles.inputLabelContainer}>
                      <Text style={styles.inputLabel}>Starting Price</Text>
                    </View>
                    <View style={styles.priceInputContainer}>
                      <View style={styles.priceSymbol}>
                        <Text style={styles.priceSymbolText}>$</Text>
                      </View>
                      <InputField
                        placeholder="e.g. 25"
                        customStyle={styles.priceInput}
                        value={draftPrice}
                        onChangeText={text => {
                          setDraftPrice(text.replace(/[^0-9]/g, ''));
                          setDraftErrors(prev => ({...prev, price: undefined}));
                        }}
                        type={'numeric'}
                      />
                    </View>
                    {draftErrors.price && (
                      <View style={styles.errorContainer}>
                        <MaterialIcons
                          name="error-outline"
                          size={16}
                          color={Colors.red500}
                        />
                        <Text style={styles.errorText}>
                          {draftErrors.price}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={handleAddPackage}
                    style={styles.addPackageButton}
                    activeOpacity={0.8}>
                    <LinearGradient
                      colors={[Colors.white, Colors.blueBg50]}
                      style={styles.addPackageGradient}>
                      <View style={styles.addPackageContent}>
                        <View style={styles.addIconContainer}>
                          <AntDesign
                            name="plus"
                            size={20}
                            color={Colors.gradient1}
                          />
                        </View>
                        <Text style={styles.addPackageText}>Add Package</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            ) : (
              <View style={styles.limitInfo}>
                <MaterialIcons
                  name="check-circle"
                  size={16}
                  color={Colors.green500}
                />
                <Text style={styles.limitInfoText}>
                  Maximum of {MAX_PACKAGES} packages added
                </Text>
              </View>
            )}
          </View>

          {/* Continue Button */}
          <Animated.View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={savePackagesToFirestore}
              disabled={loading}
              activeOpacity={0.8}>
              <LinearGradient
                colors={[Colors.gradient1, Colors.gradient2]}
                style={styles.buttonGradient}>
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Text style={styles.buttonText} numberOfLines={1}>
                      {profileCompletion === '100'
                        ? 'Update Packages'
                        : 'Complete Setup'}
                    </Text>
                    <AntDesign
                      name="check"
                      size={RFPercentage(2.2)}
                      color={Colors.white}
                      style={styles.buttonIcon}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.requirementsText}>
              {packages.length > 0
                ? `${packages.length} package${
                    packages.length > 1 ? 's' : ''
                  } added — packages are optional`
                : 'No packages added — you can publish without packages'}
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <RemovePackageModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setPackageToRemove(null);
        }}
        onConfirm={async () => {
          if (packageToRemove) {
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
    backgroundColor: Colors.white,
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
    // flexGrow: 1,
    // paddingBottom: RFPercentage(10),
  },
  completionCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 4,
  },
  completionGradient: {
    padding: 20,
    borderRadius: 16,
  },
  completionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.greenOverlay10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  completionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
    color: Colors.gray800,
    marginBottom: 4,
  },
  completionSubtitle: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.placeholderColor,
  },
  progressCircle: {
    marginLeft: 16,
    alignItems: 'center',
  },
  progressCircleText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.green500,
    textAlign: 'center',
    marginTop: 2,
  },
  instructionsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.amberBg50,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionsTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.amberDarkText,
    marginLeft: 8,
  },
  instructionsContent: {
    marginLeft: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.amber500,
    marginTop: 8,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.amberDarkText,
    lineHeight: 20,
  },
  packagesContainer: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  packagesTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.1),
    color: Colors.gray800,
    marginBottom: 6,
  },
  packagesSubtitle: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    color: Colors.placeholderColor,
    marginBottom: 20,
  },
  packageCardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lavenderBorder,
    // elevation: 3,
  },
  packageHeader: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  packageHeaderGradient: {
    padding: 18,
  },
  packageHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.grayBlueOverlay10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageNumber: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.gradient1,
  },
  packageTitleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  packageTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.grayBlueDark,
  },
  packagePricePreview: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.gradient1,
    marginTop: 2,
  },
  packageActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.redOverlay10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  draftCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  draftCardGradient: {
    padding: 20,
  },
  draftCardTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    color: Colors.gray800,
    marginBottom: 16,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.gray700,
  },
  charCount: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.gray400,
  },
  descriptionField: {
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.gray700,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceSymbol: {
    width: 50,
    height: 50,
    backgroundColor: Colors.gray50,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceSymbolText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
    color: Colors.gray700,
  },
  priceInput: {
    width: '60%',
    height: 50,
    backgroundColor: Colors.gray50,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 1,
    borderColor: Colors.gray200,
    paddingLeft: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  errorText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.red500,
    marginLeft: 6,
  },
  addPackageButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    height: 55,
  },
  addPackageGradient: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray200,
    borderStyle: 'dashed',
    height: 55,
    justifyContent: 'center',
  },
  addPackageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 12,
    backgroundColor: Colors.indigoOverlay10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addPackageText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.gradient1,
  },
  limitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  limitInfoText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.placeholderColor,
    marginLeft: 6,
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
  },
  continueButton: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: Colors.gradient1,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    // elevation: 8,
    width: '100%',
    alignSelf: 'center',
    height: RFPercentage(5.6),
  },
  buttonGradient: {
    borderRadius: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  buttonText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    color: Colors.white,
    marginRight: 10,
  },
  buttonIcon: {
    marginTop: 2,
  },
  requirementsText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.placeholderColor,
    textAlign: 'center',
    marginTop: 12,
  },
});
