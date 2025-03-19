import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React from 'react'; 
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Icons, Fonts} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import InfoHeader from '../../../../components/InfoHeader';
import TimeLine from '../../../../components/TimeLine';
import GradientButton from '../../../../components/GradientButton';
import DescriptionField from '../../../../components/DescriptionField';
import InputField from '../../../../components/InputField';
import {useNavigation} from '@react-navigation/native';

const ServiceThree: React.FC = () => {
  const navigation = useNavigation();

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
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Package 1</Text>
              <View>
                <DescriptionField placeholder="Package Details" />
                <InputField
                  placeholder="Enter Starting Price"
                  customStyle={{width: '100%'}}
                />
              </View>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Package 2</Text>
              <View>
                <DescriptionField placeholder="Package Details" />
                <InputField
                  placeholder="Enter Starting Price"
                  customStyle={{width: '100%'}}
                />
              </View>
            </View>

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
