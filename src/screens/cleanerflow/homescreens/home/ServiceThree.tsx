import React, {useState} from 'react';
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

const MAX_PACKAGES = 4; 

const ServiceThree: React.FC = () => {
  const navigation = useNavigation();
  const [packages, setPackages] = useState([{id: 1}]); 

  const addPackage = () => {
    if (packages.length < MAX_PACKAGES) {
      setPackages([...packages, {id: packages.length + 1}]); 
    }
  };

  const removePackage = (id:any) => {
    setPackages(packages.filter(pkg => pkg.id !== id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled">
          <HeaderBack title="Service" textStyle={styles.headerText} />
          <View style={styles.container}>
            <View style={styles.infoHeaderContainer}>
              <InfoHeader />
            </View>
          </View>

          <View style={styles.timelineContainer}>
            <TimeLine stepTwo={true} stepThree={true} />
          </View>

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
                      <TouchableOpacity activeOpacity={0.8} onPress={() => removePackage(pkg.id)}>
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
                  <DescriptionField placeholder="Package Details" />
                  <InputField
                    placeholder="Enter Starting Price"
                    customStyle={{width: '100%'}}
                  />
                </View>
              </View>
            ))}

            {packages.length < MAX_PACKAGES && (
              <View
                style={{alignSelf: 'flex-end', marginTop: RFPercentage(0.5)}}>
                <TouchableOpacity onPress={addPackage}>
                  <View>
                    <Text
                      style={{
                        color: Colors.gradient1,
                        fontSize: RFPercentage(1.5),
                        fontFamily: Fonts.fontMedium,
                      }}>
                      + Add Package
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <GradientButton
                title="Next"
                onPress={() => navigation.navigate('HomeScreen')}
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
    fontSize: RFPercentage(1.8),
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
    fontSize: RFPercentage(1.6),
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(4),
  },
});
