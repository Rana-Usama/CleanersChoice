import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import React, {useState, useEffect} from 'react';
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
import {RootStackParamList} from '../../../routers/StackNavigator';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {showToast} from '../../../utils/ToastMessage';

const data1 = [
  {
    id: 1,
    label: 'Window Cleaning',
  },
  {
    id: 2,
    label: 'Chimney Cleaning',
  },
  {
    id: 3,
    label: 'Carpet Cleaning',
  },
  {
    id: 4,
    label: 'Car Cleaning',
  },
  {
    id: 5,
    label: 'Residential Cleaning',
  },
  {
    id: 6,
    label: 'Pressure Washing',
  },
  {
    id: 7,
    label: 'Lawn Care',
  },
  {
    id: 8,
    label: 'Others',
  },
];

const PostJob = ({route}: any) => {
  const {jobId} = route.params;

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'PostJob'>>();
  const [date, setDate] = useState<Date>(new Date());
  const [open, setOpen] = useState<boolean>(false);
  const formattedDate = moment(date).format('YYYY-MM-DD  HH:mm A');
  const [jobTitle, setJobTitle] = useState('');
  const [Location, setLocation] = useState('');
  const [Description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectedItem = (item: any) => {
    setSelectedType(item);
  };

  // Post Job
  const postJob = async () => {
    const user = auth().currentUser;
    if (!user) return;
    if (!jobTitle || !Location || !budget || !selectedType) {
      showToast({
        type: 'info',
        title: 'Job Post',
        message: 'Please fill all the details',
      });
      return;
    }
    setLoading(true);
    try {
      const jobData = {
        createdAt: formattedDate,
        title: jobTitle,
        description: Description,
        type: selectedType,
        location: Location,
        priceRange: budget.replace(/[^0-9]/g, ''),
        remarks: remarks || '',
        jobId: user.uid,
        status: 'active',
        createdAt2: firestore.FieldValue.serverTimestamp(),
      };
      if (jobId) {
        await firestore().collection('Jobs').doc(jobId).update(jobData);
        navigation.navigate('Home');
        showToast({
          type: 'success',
          title: 'Job Update',
          message: 'Job Updated successfully',
        });
      } else {
        await firestore().collection('Jobs').add(jobData);
        navigation.navigate('JobPosted');
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Fetch job
  const fetchJob = async () => {
    const user = auth().currentUser;
    if (!user || !jobId) return;
    setLoading(true);
    try {
      const docSnapshot = await firestore().collection('Jobs').doc(jobId).get();

      if (docSnapshot.exists) {
        const jobData = docSnapshot.data();
        setJobTitle(jobData?.title || '');
        setDescription(jobData?.description || '');
        setLocation(jobData?.location || '');
        setSelectedType(jobData?.type || []);
        setBudget(jobData?.priceRange || null);
        setRemarks(jobData?.remarks || '');
        setDate(moment(jobData?.createdAt, 'YYYY-MM-DD  HH:mm A').toDate());
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, []);

  const handleBudgetChange = (text: any) => {
    const numeric = text.replace(/[^0-9]/g, '');
    setBudget(numeric ? `$${numeric}` : '');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="always"
        style={{backgroundColor:Colors.background}}
        >
        <View style={styles.safeArea}>
          {/* Header */}
          <HeaderBack
            title="Post Job"
            textStyle={{fontSize: RFPercentage(2)}}
            left={true}
          />

          {/* Field Container */}
          <View style={styles.container}>
            <InfoHeader text="Post your cleaning job by providing following details!" />
            <View style={{marginTop: RFPercentage(1.5)}}>
              {/* Title */}
              <InputField
                placeholder="Job Title e.g, Garden Cleaning"
                customStyle={{width: '100%'}}
                value={jobTitle}
                onChangeText={setJobTitle}
              />

              {/* Describe */}
              <View>
                <DescriptionField
                  placeholder="Description of the cleaning job"
                  count={true}
                  value={Description}
                  onChangeText={setDescription}
                  maxLength={200}
                />
              </View>

              {/* City */}
              <InputField
                placeholder="Enter City/Town you want services at"
                customStyle={{width: '100%'}}
                value={Location}
                onChangeText={setLocation}
              />

              {/* Service Type */}
              <CustomDropDown
                placeholder={jobId ? selectedType : 'Service Type'}
                data={data1}
                placeholderColor={
                  jobId ? Colors.inputTextColor : Colors.placeholderColor
                }
                setValue={handleSelectedItem}
              />

              {/* Budget */}
              <InputField
                placeholder="Budget e.g; $120"
                customStyle={{width: '100%'}}
                value={budget}
                onChangeText={handleBudgetChange}
                type={'numeric'}
              />

              {/* Date Picker */}
              <View style={styles.dateContainer}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setOpen(true)}
                  style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Image
                    source={Icons.calendar}
                    resizeMode="contain"
                    style={{width: RFPercentage(2), height: RFPercentage(2)}}
                  />
                  <Text style={styles.dateText}>
                    {formattedDate || 'Job Due Date and Time'}
                  </Text>
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

              {/* Special Remarks */}
              <View>
                <Text style={styles.remarksText}>
                  Leave any special remarks (Optional)
                </Text>
                <DescriptionField
                  placeholder="Any Special Remarks"
                  style={{height: RFPercentage(11)}}
                  count={false}
                  value={remarks}
                  onChangeText={setRemarks}
                  maxLength={80}
                />
              </View>
            </View>

            {/* Button Container */}
            <View style={{alignSelf: 'center', marginTop: RFPercentage(3)}}>
              <GradientButton
                title={jobId ? 'Edit Job' : 'Make Job Live'}
                textStyle={{fontSize: RFPercentage(1.8)}}
                onPress={postJob}
                loading={loading}
                disabled={loading}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default PostJob;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop:RFPercentage(8)
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: RFPercentage(12),
  },
  container: {
    width: '90%',
    alignSelf: 'center',
    paddingTop: RFPercentage(3),
  },
  infoText: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
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
    fontSize: RFPercentage(1.6),
    left: 5,
    top: 1.5,
  },
  remarksText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
    color: Colors.primaryText,
  },
});
