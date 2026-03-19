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
import HeaderBack from '../../../../components/HeaderBack';
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
const MAX_PACKAGES = 4;

type PackageError = {
  price?: string;
  details?: string;
};

type PackageErrors = {
  [key: number]: PackageError;
};

const ServiceThree: React.FC = ({navigation}: any) => {
  const [packages, setPackages] = useState([{id: 1, details: '', price: ''}]);
  const [loading, setLoading] = useState(false);
  const [expandedPackage, setExpandedPackage] = useState<number | null>(null);
  const profileCompletion = useSelector(
    (state: any) => state?.profile?.profileCompletion,
  );
  const [errors, setErrors] = useState<PackageErrors>({});

  const [modalVisible, setModalVisible] = useState(false);
  const [packageToRemove, setPackageToRemove] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  // Add package
  const addPackage = () => {
    if (packages.length < MAX_PACKAGES) {
      setPackages([
        ...packages,
        {id: packages.length + 1, details: '', price: ''},
      ]);
      setExpandedPackage(packages.length + 1);
    }
  };

  // Remove Package
  const removePackage = (id: number) => {
    if (id === 1) return;

    setPackageToRemove(id);
    setModalVisible(true);
  };

  // Input Field function
  const handleInputChange = (id: any, field: any, value: any) => {
    const cleanValue = field === 'price' ? value.replace(/[^0-9]/g, '') : value;

    setPackages(prevPackages =>
      prevPackages.map(pkg =>
        pkg.id === id ? {...pkg, [field]: cleanValue} : pkg,
      ),
    );

    // Validation
    if (field === 'price') {
      const minPrice = 25 * id;
      const priceNum = parseFloat(cleanValue);
      setErrors((prevErrors: any) => ({
        ...prevErrors,
        [id]: {
          ...(prevErrors[id] || {}),
          price: !cleanValue
            ? 'Price is required'
            : isNaN(priceNum) || priceNum < minPrice
            ? `Price must be at least $${minPrice}`
            : null,
        },
      }));
    }

    if (field === 'details') {
      setErrors((prevErrors: any) => ({
        ...prevErrors,
        [id]: {
          ...(prevErrors[id] || {}),
          details: !cleanValue.trim() ? 'Package details are required' : null,
        },
      }));
    }
  };

  // Calculate progress
  const calculateProgress = () => {
    const validPackages = packages.filter(
      pkg => pkg.details.trim() && pkg.price.trim(),
    );
    return Math.min(validPackages.length / 3, 1);
  };

  const progress = calculateProgress();
  const validPackagesCount = packages.filter(
    pkg => pkg.details.trim() && pkg.price.trim(),
  ).length;

  // Upload data to firestore
  const savePackagesToFirestore = async () => {
    const user = auth().currentUser;
    if (!user) return;

    // Validate all fields
    let newErrors: PackageErrors = {};
    let hasError = false;

    packages.forEach(pkg => {
      const minPrice = 25 * pkg.id;
      const priceNum = parseFloat(pkg.price);
      const pkgErrors: any = {};

      if (!pkg.details.trim()) {
        pkgErrors.details = 'Package details are required';
        hasError = true;
      }
      if (!pkg.price.trim()) {
        pkgErrors.price = 'Price is required';
        hasError = true;
      } else if (isNaN(priceNum) || priceNum < minPrice) {
        pkgErrors.price = `Price must be at least $${minPrice}`;
        hasError = true;
      }
      if (Object.keys(pkgErrors).length > 0) {
        newErrors[pkg.id] = pkgErrors;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix the errors before proceeding.',
      });
      return;
    }

    const validPackages = packages.filter(
      pkg => pkg.details.trim() && pkg.price.trim(),
    );

    if (validPackages.length < 3) {
      Toast.show({
        type: 'error',
        text1: 'Add at least 3 packages',
        text2: 'Please complete at least 3 packages before continuing.',
      });
      return;
    }

    try {
      setLoading(true);
      const serviceRef = firestore()
        .collection('CleanerServices')
        .doc(user.uid);

      const doc = await serviceRef.get();
      if (doc.exists) {
        const existingData = doc.data();
        let existingPackages = existingData?.packages || [];
        const updatedPackages = packages.map(pkg => {
          const existingPkg = existingPackages.find((p: any) => p.id === pkg.id);
          return existingPkg ? {...existingPkg, ...pkg} : pkg;
        });

        await serviceRef.update({
          packages: updatedPackages,
          updatedAt: new Date(),
        });
      } else {
        await serviceRef.set({packages});
      }

      Toast.show({
        type: 'success',
        text1: 'Packages Saved',
        text2: 'Your service packages have been updated',
      });

      // navigation.navigate('CleanerNavigator');
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
        setPackages(
          data?.packages?.length
            ? data.packages
            : [{id: 1, details: '', price: ''}],
        );
      }
    } catch (error) {}
  };

  const togglePackage = (id: number) => {
    setExpandedPackage(expandedPackage === id ? null : id);
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
        <HeaderBack
          title="Service Packages"
          textStyle={styles.headerText}
          left={true}
          style={{backgroundColor: 'transparent'}}
          arrowColor={'white'}
        />

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
                      {validPackagesCount >= 3
                        ? '✓ Ready to publish!'
                        : `${3 - validPackagesCount} more package${
                            3 - validPackagesCount > 1 ? 's' : ''
                          } needed`}
                    </Text>
                  </View>
                  <View style={styles.progressCircle}>
                    <Progress.Circle
                      progress={progress}
                      size={50}
                      thickness={4}
                      color={progress === 1 ? Colors.green500 : Colors.gradient1}
                      unfilledColor={Colors.gray200}
                      borderWidth={0}>
                      <Text style={styles.progressCircleText}>
                        {validPackagesCount}/3
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
                    Package 1: Basic cleaning services (Starting at $25)
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>
                    Package 2: Standard services with extras (Starting at $50)
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>
                    Package 3: Premium services (Starting at $75)
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>
                    Higher packages should offer more value
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Packages Container */}
          <View style={styles.packagesContainer}>
            <Text style={styles.packagesTitle}>Create Your Packages</Text>
            <Text style={styles.packagesSubtitle}>
              Add 3-4 packages with clear pricing and details
            </Text>

            {packages.map((pkg, index) => (
              <Animated.View key={pkg.id} style={styles.packageCardWrapper}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => togglePackage(pkg.id)}
                  style={[
                    styles.packageHeader,
                    expandedPackage === pkg.id && styles.packageHeaderExpanded,
                  ]}>
                  <LinearGradient
                    colors={
                      pkg.details && pkg.price
                        ? [Colors.indigoBg50, Colors.blueBg75]
                        : [Colors.white, Colors.gray50]
                    }
                    style={styles.packageHeaderGradient}>
                    <View style={styles.packageHeaderContent}>
                      <View style={styles.packageNumberContainer}>
                        <Text style={styles.packageNumber}>{pkg.id}</Text>
                      </View>
                      <View style={styles.packageTitleContainer}>
                        <Text style={styles.packageTitle}>
                          Package {pkg.id}
                        </Text>
                        {pkg.price ? (
                          <Text style={styles.packagePricePreview}>
                            ${pkg.price}
                          </Text>
                        ) : (
                          <Text style={styles.packagePlaceholder}>
                            Set pricing
                          </Text>
                        )}
                      </View>
                      <View style={styles.packageActions}>
                        {pkg.id > 1 && (
                          <TouchableOpacity
                            onPress={() => removePackage(pkg.id)}
                            style={styles.removeButton}>
                            <AntDesign
                              name="delete"
                              size={16}
                              color={Colors.red500}
                            />
                          </TouchableOpacity>
                        )}
                        <MaterialIcons
                          name={
                            expandedPackage === pkg.id
                              ? 'keyboard-arrow-up'
                              : 'keyboard-arrow-down'
                          }
                          size={24}
                          color={Colors.placeholderColor}
                        />
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {expandedPackage === pkg.id && (
                  <Animated.View
                    entering={ZoomIn.duration(300)}
                    style={styles.packageContent}>
                    <LinearGradient
                      colors={[Colors.white, Colors.blueBg50]}
                      style={styles.packageContentGradient}>
                      {/* Package Details */}
                      <View style={styles.inputSection}>
                        <View style={styles.inputLabelContainer}>
                          <Text style={styles.inputLabel}>Package Details</Text>
                          <Text style={styles.charCount}>
                            {pkg.details.length}/200
                          </Text>
                        </View>
                        <DescriptionField
                          placeholder="Describe what's included in this package..."
                          count={false}
                          value={pkg.details}
                          maxLength={200}
                          onChangeText={text =>
                            handleInputChange(pkg.id, 'details', text)
                          }
                          style={styles.descriptionField}
                          textInput={{fontSize: RFPercentage(1.5)}}
                        />
                        {errors[pkg.id]?.details && (
                          <View style={styles.errorContainer}>
                            <MaterialIcons
                              name="error-outline"
                              size={16}
                              color={Colors.red500}
                            />
                            <Text style={styles.errorText}>
                              {errors[pkg.id].details}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Price Input */}
                      <View style={styles.inputSection}>
                        <View style={styles.inputLabelContainer}>
                          <Text style={styles.inputLabel}>Starting Price</Text>
                          <Text style={styles.minPriceHint}>
                            Min: ${25 * pkg.id}
                          </Text>
                        </View>
                        <View style={styles.priceInputContainer}>
                          <View style={styles.priceSymbol}>
                            <Text style={styles.priceSymbolText}>$</Text>
                          </View>
                          <InputField
                            placeholder={`e.g. ${25 * pkg.id}`}
                            customStyle={styles.priceInput}
                            value={pkg.price}
                            onChangeText={text =>
                              handleInputChange(pkg.id, 'price', text)
                            }
                            type={'numeric'}
                          />
                        </View>
                        {errors[pkg.id]?.price && (
                          <View style={styles.errorContainer}>
                            <MaterialIcons
                              name="error-outline"
                              size={16}
                              color={Colors.red500}
                            />
                            <Text style={styles.errorText}>
                              {errors[pkg.id].price}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Package Status */}
                      <View style={styles.packageStatus}>
                        {pkg?.details && pkg.price ? (
                          <View style={styles.statusComplete}>
                            <AntDesign
                              name="checkcircle"
                              size={16}
                              color={Colors.green500}
                            />
                            <Text style={styles.statusText}>Complete</Text>
                          </View>
                        ) : (
                          <View style={styles.statusIncomplete}>
                            <MaterialIcons
                              name="info-outline"
                              size={16}
                              color={Colors.amber500}
                            />
                            <Text style={styles.statusText}>Incomplete</Text>
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </Animated.View>
                )}
              </Animated.View>
            ))}

            {/* Add Package Button */}
            {packages?.length < MAX_PACKAGES && (
              <Animated.View entering={FadeInUp.delay(300)}>
                <TouchableOpacity
                  onPress={addPackage}
                  style={styles.addPackageButton}>
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
                      <Text style={styles.addPackageText}>
                        Add Package {packages?.length + 1}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Package Limit Info */}
            <View style={styles.limitInfo}>
              <MaterialIcons name="info-outline" size={16} color={Colors.placeholderColor} />
              <Text style={styles.limitInfoText}>
                You can add up to {MAX_PACKAGES} packages
              </Text>
            </View>
          </View>

          {/* Continue Button */}
          <Animated.View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                validPackagesCount < 3 && styles.buttonDisabled,
              ]}
              onPress={savePackagesToFirestore}
              disabled={loading || validPackagesCount < 3}
              activeOpacity={0.8}>
              <LinearGradient
                colors={
                  validPackagesCount < 3
                    ? [Colors.gray200, Colors.gray300]
                    : [Colors.gradient1, Colors.gradient2]
                }
                style={styles.buttonGradient}>
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>
                      {profileCompletion === '100'
                        ? 'Update Packages'
                        : validPackagesCount >= 3
                        ? 'Complete Setup'
                        : `Add ${3 - validPackagesCount} More Package${
                            3 - validPackagesCount > 1 ? 's' : ''
                          }`}
                    </Text>
                    {validPackagesCount >= 3 && (
                      <AntDesign
                        name="check"
                        size={RFPercentage(2.2)}
                        color={Colors.white}
                        style={styles.buttonIcon}
                      />
                    )}
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.requirementsText}>
              {validPackagesCount >= 3
                ? '✓ Ready to publish your service profile!'
                : `${3 - validPackagesCount} package${
                    3 - validPackagesCount > 1 ? 's' : ''
                  } remaining`}
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
              setExpandedPackage(null);

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
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    // elevation: 8,
  },
  headerText: {
    fontSize: RFPercentage(2.3),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  progressSection: {
    marginTop: 15,
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
  timeLineContainer: {
    marginTop: -20,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  timeLineCard: {
    borderRadius: 20,
    padding: 15,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 12,
    // elevation: 5,
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
  packageHeaderExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
  packagePlaceholder: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.gray400,
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
  packageContent: {
    backgroundColor: Colors.white,
  },
  packageContentGradient: {
    padding: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
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
  minPriceHint: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: Colors.green500,
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
  packageStatus: {
    marginTop: 16,
  },
  statusComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.greenOverlay10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusIncomplete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.amberOverlay10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.gray700,
    marginLeft: 6,
  },
  addPackageButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
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
    width: '60%',
    alignSelf: 'center',
    height: RFPercentage(5.6),
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
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
