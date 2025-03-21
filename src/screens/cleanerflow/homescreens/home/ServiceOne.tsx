import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Icons, Fonts} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import InfoHeader from '../../../../components/InfoHeader';
import DescriptionField from '../../../../components/DescriptionField';
import TimeLine from '../../../../components/TimeLine';
import CustomDropDown from '../../../../components/DropDown';
import GradientButton from '../../../../components/GradientButton';
import {useNavigation} from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';

const data1 = [
  {
    id: 1,
    label: 'Washing',
  },
  {
    id: 2,
    label: 'Cleaning',
  },
  {
    id: 3,
    label: 'Cleaning',
  },
];

const ServiceOne: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack title="Service" textStyle={styles.headerText} />
      <View style={styles.container}>
        <View style={styles.infoHeaderContainer}>
          <InfoHeader />
        </View>
      </View>

      <View style={styles.timeLineContainer}>
        <TimeLine />
      </View>

      <View style={styles.container}>
        <View style={styles.descriptionContainer}>
          <DescriptionField placeholder="Service Description" count={true} />
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Availability')}
          style={styles.dateContainer}>
          <View style={styles.dateButton}>
            <Image
              source={Icons.calendar}
              resizeMode="contain"
              style={styles.dateIcon}
            />
            <Text style={styles.dateText}>{'Set Availability'}</Text>
          </View>
          <View style={{position: 'absolute',right:RFPercentage(1)}}>
            <TouchableOpacity>
              <AntDesign name="right" size={RFPercentage(1.5)} color={Colors.placeholderColor} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <CustomDropDown
          placeholder="Select services you provide"
          data={data1}
        />

        <View style={styles.buttonContainer}>
          <GradientButton
            title="Next"
            onPress={() => navigation.navigate('ServiceTwo')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ServiceOne;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerText: {
    fontSize: RFPercentage(1.8),
  },
  container: {
    width: '90%',
    alignSelf: 'center',
  },
  infoHeaderContainer: {
    marginTop: RFPercentage(2.5),
  },
  timeLineContainer: {
    marginTop: RFPercentage(2.8),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionContainer: {
    marginTop: RFPercentage(2),
  },
  dateContainer: {
    width: '100%',
    height: RFPercentage(5.4),
    borderWidth: 1,
    borderColor: Colors.inputFieldColor,
    borderRadius: RFPercentage(0.8),
    marginVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(1.5),
    justifyContent: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    width: RFPercentage(2),
    height: RFPercentage(2),
  },
  dateText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    marginLeft: 5,
    top: RFPercentage(0.2),
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(4),
  },
});
