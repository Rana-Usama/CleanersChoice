import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import InfoHeader from '../../../../components/InfoHeader';
import TimeLine from '../../../../components/TimeLine';
import GradientButton from '../../../../components/GradientButton';
import DescriptionField from '../../../../components/DescriptionField';
import InputField from '../../../../components/InputField';
import AntDesign from 'react-native-vector-icons/AntDesign';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import {useSelector} from 'react-redux';

const MAX_PACKAGES = 4;

const ServiceThree: React.FC = ({navigation}: any) => {
  const [packages, setPackages] = useState([{id: 1, details: '', price: ''}]);
  const [loading, setLoading] = useState(false);
  const profileCompletion = useSelector(
    state => state?.profile?.profileCompletion,
  );
  const [errors, setErrors] = useState<{
    [key: number]: {price?: string; details?: string};
  }>({});

  // Add package
  const addPackage = () => {
    if (packages.length < MAX_PACKAGES) {
      setPackages([
        ...packages,
        {id: packages.length + 1, details: '', price: ''},
      ]);
    }
  };

  // Remove Package
  const removePackage = (id: any) => {
    if (id === 1) return;
    setPackages(packages.filter(pkg => pkg.id !== id));
  };

  // Input Field function
  const handleInputChange = (id: any, field: any, value: any) => {
    // Remove any non-numeric characters from price except dot
    const cleanValue = field === 'price' ? value.replace(/[^0-9]/g, '') : value;
    setPackages(prevPackages =>
      prevPackages.map(pkg =>
        pkg.id === id ? {...pkg, [field]: cleanValue} : pkg,
      ),
    );
    // Price validation
    if (field === 'price') {
      const minPrice = 25 * id;
      const priceNum = parseFloat(cleanValue);
      setErrors(prevErrors => ({
        ...prevErrors,
        [id]: {
          ...(prevErrors[id] || {}),
          price: !cleanValue
            ? 'Price is required'
            : isNaN(priceNum) || priceNum < minPrice
            ? `Price must be at least ${minPrice}$`
            : null,
        },
      }));
    }

    if (field === 'details') {
      setErrors(prevErrors => ({
        ...prevErrors,
        [id]: {
          ...(prevErrors[id] || {}),
          details: !cleanValue.trim() ? 'Package details are required' : null,
        },
      }));
    }
  };

  // Upload data to firestore
  const savePackagesToFirestore = async () => {
    const user = auth().currentUser;
    if (!user) return;

    // Validate all fields again before submitting
    let newErrors = {};
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
        pkgErrors.price = `Price must be at least ${minPrice}$`;
        hasError = true;
      }

      if (Object.keys(pkgErrors).length > 0) {
        newErrors[pkg.id] = pkgErrors;
      }
    });

    if (hasError) {
      setErrors(newErrors); // Update error state to show in UI
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix the errors before proceeding.',
      });
      return;
    }

    // Extra: catch mismatched inputs
    const priceOnlyPackages = packages.filter(
      pkg => pkg.price.trim() !== '' && pkg.details.trim() === '',
    );
    const detailsOnlyPackages = packages.filter(
      pkg => pkg.details.trim() !== '' && pkg.price.trim() === '',
    );

    if (priceOnlyPackages.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Missing package details',
        text2: 'You entered a price but did not add details.',
      });
      return;
    }

    if (detailsOnlyPackages.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Missing package price',
        text2: 'You entered details but did not add a price.',
      });
      return;
    }

    const validPackages = packages.filter(
      pkg => pkg.details.trim() !== '' && pkg.price.trim() !== '',
    );

    if (validPackages.length < 3) {
      Toast.show({
        type: 'error',
        text1: 'Add at least 3 packages',
        text2: 'Please complete at least 3 packages before continuing.',
      });
      return;
    }

    // Proceed to Firestore
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
          const existingPkg = existingPackages.find(p => p.id === pkg.id);
          return existingPkg ? {...existingPkg, ...pkg} : pkg;
        });

        await serviceRef.update({packages: updatedPackages});
      } else {
        await serviceRef.set({packages});
      }
      navigation.navigate('CleanerNavigator');
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

  // Fetching Service Data
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={styles.keyboardAvoidingView}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollView}
            keyboardShouldPersistTaps="handled">
            {/* Header */}
            <HeaderBack
              title="Service"
              textStyle={styles.headerText}
              left={true}
            />
            <View style={styles.container}>
              <View style={styles.infoHeaderContainer}>
                <InfoHeader />
              </View>
            </View>

            {/* Time Line */}
            <View style={styles.timelineContainer}>
              <TimeLine stepTwo={true} stepThree={true} />
            </View>

            {/* Package Details Container */}
            <View style={styles.container}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Select General Packages</Text>
              </View>

              {packages.map(pkg => (
                <View key={pkg.id} style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Package {pkg.id}</Text>
                  {pkg.id === 1 ? null : (
                    <>
                      <View style={{position: 'absolute', right: 0}}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => removePackage(pkg.id)}>
                          <AntDesign
                            name="minuscircleo"
                            size={RFPercentage(2.2)}
                            color={Colors.gradient1}
                          />
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  <View>
                    <DescriptionField
                      placeholder={`Enter Package details`}
                      count={true}
                      value={pkg.details}
                      maxLength={120}
                      onChangeText={text =>
                        handleInputChange(pkg.id, 'details', text)
                      }
                      charCount={pkg.details.length}
                    />
                    {errors[pkg.id]?.details && (
                      <Text style={styles.errorText}>
                        {errors[pkg.id].details}
                      </Text>
                    )}

                    <InputField
                      placeholder={`Starting Price e.g ${25 * pkg.id}$`}
                      customStyle={{
                        width: '100%',
                        borderColor: Colors.inputFieldColor,
                      }}
                      value={pkg.price ? `$${pkg.price}` : ''}
                      onChangeText={text =>
                        handleInputChange(pkg.id, 'price', text)
                      }
                      type={'numeric'}
                    />
                    {errors[pkg.id]?.price && (
                      <Text style={styles.errorText}>
                        {errors[pkg.id].price}
                      </Text>
                    )}
                  </View>
                </View>
              ))}

              {packages.length < MAX_PACKAGES && (
                <View style={{alignSelf: 'flex-end'}}>
                  <TouchableOpacity activeOpacity={0.8} onPress={addPackage}>
                    <View>
                      <Text style={styles.addText}>+ Add Package</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Button Container */}
              <View style={styles.buttonContainer}>
                <GradientButton
                  title={profileCompletion === '100' ? 'Edit' : 'Next'}
                  onPress={savePackagesToFirestore}
                  loading={loading}
                  disabled={loading}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default ServiceThree;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingBottom: RFPercentage(5),
  },
  container: {
    width: '90%',
    alignSelf: 'center',
    marginTop: RFPercentage(0.5),
  },
  headerText: {
    fontSize: RFPercentage(2),
  },
  infoHeaderContainer: {
    marginTop: RFPercentage(2.5),
  },
  timelineContainer: {
    marginTop: RFPercentage(2.8),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContainer: {
    marginTop: RFPercentage(2),
  },
  sectionTitle: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(4),
  },
  errorText: {
    color: Colors.error,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    bottom: RFPercentage(0.9),
    left: 5,
  },
  addText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
  },
});
