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
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import InfoHeader from '../../../../components/InfoHeader';
import TimeLine from '../../../../components/TimeLine';
import GradientButton from '../../../../components/GradientButton';
import DescriptionField from '../../../../components/DescriptionField';
import InputField from '../../../../components/InputField';
import {useNavigation} from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import {useSelector} from 'react-redux';

const MAX_PACKAGES = 4;

const ServiceThree: React.FC = () => {
  const navigation = useNavigation();
  const [packages, setPackages] = useState([{id: 1, details: '', price: ''}]);
  const [loading, setLoading] = useState(false);
  const profileCompletion = useSelector(
    state => state.profile.profileCompletion,
  );
  const [errors, setErrors] = useState({});

  console.log(errors);

  const addPackage = () => {
    if (packages.length < MAX_PACKAGES) {
      setPackages([
        ...packages,
        {id: packages.length + 1, details: '', price: ''},
      ]);
    }
  };

  const removePackage = id => {
    if (id === 1) return;
    setPackages(packages.filter(pkg => pkg.id !== id));
  };

  const handleInputChange = (id, field, value) => {
    setPackages(prevPackages =>
      prevPackages.map(pkg => (pkg.id === id ? {...pkg, [field]: value} : pkg)),
    );

    if (field === 'price') {
      const minPrice = 25 * id;
      setErrors(prevErrors => ({
        ...prevErrors,
        [id]:
          parseFloat(value) < minPrice
            ? `Price must be at least ${minPrice}$`
            : null,
      }));
    }
  };

  const savePackagesToFirestore = async () => {
    const user = auth().currentUser;
    if (!user) return;

    // Filter valid packages
    const validPackages = packages.filter(
      pkg => pkg.details.trim() !== '' && pkg.price.trim() !== '',
    );

    // Require exactly 3 packages
    if (validPackages.length < 3) {
      Toast.show({
        type: 'error',
        text1: 'Add at least 3 packages',
        text2: 'Please fill in 3 packages before continuing.',
        position: 'top',
        topOffset: RFPercentage(8),
        text1Style: {fontFamily: Fonts.fontBold, fontSize: RFPercentage(1.7)},
        text2Style: {
          fontFamily: Fonts.fontRegular,
          fontSize: RFPercentage(1.4),
        },
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
          const existingPkg = existingPackages.find(p => p.id === pkg.id);
          return existingPkg ? {...existingPkg, ...pkg} : pkg;
        });
        await serviceRef.update({
          packages: updatedPackages,
        });
      } else {
        await serviceRef.set({
          packages,
        });
      }
      navigation.navigate('CleanerNavigator');
    } catch (error) {
      console.error('Error updating packages: ', error);
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
    } catch (error) {
      console.error('Error fetching service data:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={styles.keyboardAvoidingView}>
        <ScrollView
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
                    placeholder={`Package Details`}
                    count={true}
                    value={pkg.details}
                    maxLength={100}
                    onChangeText={text =>
                      handleInputChange(pkg.id, 'details', text)
                    }
                    charCount={pkg.details.length}
                  />

                  <InputField
                    placeholder={`Starting Price e.g ${25 * pkg.id}$`}
                    customStyle={{
                      width: '100%',
                      borderColor: errors?.[pkg.id]
                        ? Colors.error
                        : Colors.inputFieldColor,
                    }}
                    value={pkg.price}
                    onChangeText={text =>
                      handleInputChange(pkg.id, 'price', text)
                    }
                    type={'numeric'}
                  />
                  <Text style={styles.errorText}>{errors[pkg.id]}</Text>
                </View>
              </View>
            ))}

            {packages.length < MAX_PACKAGES && (
              <View style={{alignSelf: 'flex-end', bottom: RFPercentage(1.7)}}>
                <TouchableOpacity onPress={addPackage}>
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
                disabled={Object.values(errors).some(error => error !== null)}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
