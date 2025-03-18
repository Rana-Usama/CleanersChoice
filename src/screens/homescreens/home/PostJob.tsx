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
import Feather from 'react-native-vector-icons/Feather';
import InputField from '../../../components/InputField';
import CustomDropDown from '../../../components/DropDown';
import GradientButton from '../../../components/GradientButton';
import {useNavigation} from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';

const PostJob = () => {
  const navigation = useNavigation();
  const [date, setDate] = useState<Date>(new Date());
  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState(null);
  const [value2, setValue2] = useState(null);

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
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Feather name="info" color={Colors.gradient1} size={18} />
              <Text style={styles.infoText}>
                Post your cleaning job by providing the following details!
              </Text>
            </View>
            <View style={{marginTop: RFPercentage(1.5)}}>
              <InputField
                placeholder="Job Title e.g, Garden Cleaning"
                customStyle={{width: '100%'}}
              />
              <View style={styles.textArea}>
                <TextInput
                  placeholder="Description of the cleaning job"
                  placeholderTextColor={Colors.placeholderColor}
                  style={styles.textInput}
                  numberOfLines={20}
                  multiline
                />
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
                  <Text style={styles.dateText}>Job Due Date and Time</Text>
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
                <View style={[styles.textArea, {height: RFPercentage(7)}]}>
                  <TextInput
                    placeholder="Any special remarks"
                    placeholderTextColor={Colors.placeholderColor}
                    style={styles.textInput}
                    numberOfLines={5}
                    multiline
                  />
                </View>
              </View>
            </View>
            <View style={{alignSelf: 'center', marginTop: RFPercentage(5)}}>
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
    fontFamily: Fonts.fontRegular,
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
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    left: 5,
    top: 1,
  },
  remarksText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.primaryText,
  },
});
