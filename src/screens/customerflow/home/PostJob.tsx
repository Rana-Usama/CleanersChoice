import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import InputField from '../../../components/InputField';
import CustomDropDown from '../../../components/DropDown';
import GradientButton from '../../../components/GradientButton';
import {useNavigation} from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import DescriptionField from '../../../components/DescriptionField';
import InfoHeader from '../../../components/InfoHeader';
import moment from 'moment';

const PostJob = () => {
  const navigation = useNavigation();
  const [date, setDate] = useState<Date>(new Date());
  const [open, setOpen] = useState<boolean>(false);
  const formattedDate = moment(date).format("YYYY-MM-DD  HH:mm A");

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

  const data2 = [
    {
      id: 1,
      label: '80$',
    },
    {
      id: 2,
      label: '120$',
    },
    {
      id: 3,
      label: '200$',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <HeaderBack
            title="Post Job"
            textStyle={{fontSize: RFPercentage(1.8)}}
          />
          <View style={styles.container}>
           <InfoHeader text='Post your cleaning job by providing following details!' />
            <View style={{marginTop: RFPercentage(1.5)}}>
              <InputField
                placeholder="Job Title e.g, Garden Cleaning"
                customStyle={{width: '100%'}}
              />
              <View>
                <DescriptionField placeholder='Description of the cleaning job' />
              </View>
              <InputField
                placeholder="Enter Location you want service at"
                customStyle={{width: '100%'}}
              />
              <CustomDropDown placeholder="Service Type" data={data1} />
              <CustomDropDown placeholder="Price Range" data={data2} />
              <View style={styles.dateContainer}>
                <TouchableOpacity
                  onPress={() => setOpen(true)}
                  style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Image
                    source={Icons.calendar}
                    resizeMode="contain"
                    style={{width: RFPercentage(2), height: RFPercentage(2)}}
                  />
                  <Text style={styles.dateText}>{formattedDate || 'Job Due Date and Time'}</Text>
                </TouchableOpacity>
              </View>
              <DatePicker
                modal
                open={open}
                date={date}
                onConfirm={date => {
                  setOpen(false);
                  setDate(date);
                }}
                onCancel={() => {
                  setOpen(false);
                }}
              />
              <View>
                <Text style={styles.remarksText}>
                  Leave any special remarks (Optional)
                </Text>
                <DescriptionField placeholder='Any Special Remarks' style={{height:RFPercentage(11)}} />
              </View>
            </View>
            <View style={{alignSelf: 'center', marginTop: RFPercentage(3)}}>
              <GradientButton
                title="Make Job Live"
                textStyle={{fontSize: RFPercentage(1.4)}}
                onPress={() => navigation.navigate('JobPosted')}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PostJob;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom:RFPercentage(8),
  },
  container: {
    width: '90%',
    alignSelf: 'center',
    paddingTop: RFPercentage(3),
  },
  infoText: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    left: 5,
    top: 1,
  },
  textArea: {
    width: '100%',
    height: RFPercentage(12),
    borderWidth: 1,
    borderColor: Colors.inputFieldColor,
    borderRadius: RFPercentage(0.8),
    marginVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(1),
    paddingTop: RFPercentage(0.8),
  },
  textInput: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    paddingVertical: 0,
    marginVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
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
  dateText: {
    color: Colors.inputTextColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    left: 5,
    top: 1.5,
  },
  remarksText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.primaryText,
  },
});
