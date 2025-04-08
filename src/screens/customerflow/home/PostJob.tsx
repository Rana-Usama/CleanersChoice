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
import React, {useState, useRef, useEffect} from 'react';
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
import MultiSelect from 'react-native-multiple-select';
import {useSelector} from 'react-redux';
import Toast from 'react-native-toast-message';

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
];

const data2 = [
  {
    id: 1,
    label: '30-80$',
  },
  {
    id: 2,
    label: '120-150$',
  },
  {
    id: 3,
    label: '200-400$',
  },
];

const items = [
  {
    id: '11',
    name: 'Window Cleaning',
  },
  {
    id: '22',
    name: 'Chimney Cleaning',
  },
  {
    id: '33',
    name: 'Carpet Cleaning',
  },
  {
    id: '44',
    name: 'Residential Cleaning',
  },
  {
    id: '55',
    name: 'Pressure Washing',
  },
  {
    id: '66',
    name: 'Car Washing',
  },
  {
    id: '77',
    name: 'Others',
  },
];

const PostJob = ({route}) => {
  const {jobId} = route.params

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
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const handleSelectedItem2 = (item: any) => {
    setSelectedRange(item);
  };

  const [selectedItems, setSelectedItems] = useState([]);
  const multiSelectRef = useRef(null);
  const onSelectedItemsChange = (selectedItems: any) => {
    setSelectedItems(selectedItems);
  };

  const postJob = async () => {
    const user = auth().currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const jobData = {
        createdAt: formattedDate,
        title: jobTitle,
        description: Description,
        type: selectedType,
        location: Location,
        priceRange: budget,
        remarks: remarks || '',
        jobId: user.uid,
        status: 'active',
      };
      if (jobId) {
        await firestore().collection('Jobs').doc(jobId).update(jobData);
        navigation.navigate('Jobs');
        Toast.show({
          type: 'success',
          text1: 'Job Update',
          text2: 'Job Updated successfully',
          position: 'top',
          topOffset: RFPercentage(8),
          text1Style: {fontFamily: Fonts.fontBold, fontSize: RFPercentage(1.7)},
          text2Style: {
            fontFamily: Fonts.fontRegular,
            fontSize: RFPercentage(1.4),
          },
        });
      } else {
        await firestore().collection('Jobs').add(jobData);
        navigation.navigate('JobPosted');
      }
    } catch (error) {
      console.error('Error posting/updating job:', error);
    } finally {
      setLoading(false);
    }
  };


  const [job, setJob] = useState([]);

  const fetchJob = async () => {
    const user = auth().currentUser;
    if (!user || !jobId) return;
    setLoading(true);
    try {
      const docSnapshot = await firestore().collection('Jobs').doc(jobId).get();

      if (docSnapshot.exists) {
        const jobData = docSnapshot.data();
        setJob(jobData);
        setJobTitle(jobData.title || '');
        setDescription(jobData.description || '');
        setLocation(jobData.location || '');
        setSelectedType(jobData.type || []);
        setBudget(jobData.priceRange || null);
        setRemarks(jobData.remarks || '');
        setDate(moment(jobData.createdAt, 'YYYY-MM-DD  HH:mm A').toDate());
      } else {
        setJob([]);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}>
          <HeaderBack
            title="Post Job"
            textStyle={{fontSize: RFPercentage(1.8)}}
          />
          <View style={styles.container}>
            <InfoHeader text="Post your cleaning job by providing following details!" />
            <View style={{marginTop: RFPercentage(1.5)}}>
              <InputField
                placeholder="Job Title e.g, Garden Cleaning"
                customStyle={{width: '100%'}}
                value={jobTitle}
                onChangeText={setJobTitle}
              />
              <View>
                <DescriptionField
                  placeholder="Description of the cleaning job"
                  count={true}
                  value={Description}
                  onChangeText={setDescription}
                  maxLength={200}
                />
              </View>
              <InputField
                placeholder="Enter Location you want service at"
                customStyle={{width: '100%'}}
                value={Location}
                onChangeText={setLocation}
              />

              <CustomDropDown
                placeholder={jobId ? selectedType : 'Service Type'}
                data={data1}
                placeholderColor={
                  jobId ? Colors.inputTextColor : Colors.placeholderColor
                }
                setValue={handleSelectedItem}
              />

              {/* <View style={{flex: 1}}>
                <MultiSelect
                  hideTags={true}
                  items={items}
                  uniqueKey="id"
                  ref={multiSelectRef}
                  onSelectedItemsChange={onSelectedItemsChange}
                  selectedItems={selectedItems}
                  selectText="Select Services you want"
                  searchInputPlaceholderText="Search Services..."
                  onChangeInput={text => console.log(text)}
                  altFontFamily={Fonts.fontRegular}
                  tagRemoveIconColor={Colors.inputFieldColor}
                  tagBorderColor={Colors.inputFieldColor}
                  tagTextColor={Colors.inputTextColor}
                  selectedItemTextColor={Colors.inputTextColor}
                  selectedItemIconColor={Colors.inputTextColor}
                  itemTextColor={Colors.placeholderColor}
                  displayKey="name"
                  searchInputStyle={{
                    color: Colors.inputTextColor,
                    fontFamily: Fonts.fontRegular,
                  }}
                  submitButtonColor={Colors.gradient2}
                  submitButtonText="Save"
                  fontFamily={Fonts.fontRegular}
                  selectedItemFontFamily={Fonts.fontRegular}
                  itemFontFamily={Fonts.fontRegular}
                  itemFontSize={RFPercentage(1.4)}
                  hideSubmitButton
                  styleItemsContainer={{
                    backgroundColor: 'transparent',
                    borderRadius: RFPercentage(0.5),
                  }}
                  styleTextDropdownSelected={{
                    color: Colors.placeholderColor,
                    fontSize: RFPercentage(1.6),
                    fontFamily: Fonts.fontRegular,
                  }}
                  styleTextTag={{
                    fontSize: RFPercentage(1.5),
                    fontFamily: Fonts.fontRegular,
                    color: Colors.inputTextColor,
                  }}
                  hideDropdown
                  textInputProps={{autoFocus: false}}
                  styleDropdownMenu={{height: RFPercentage(6)}}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{marginTop: RFPercentage(0.7)}}>
                  {multiSelectRef.current?.getSelectedItemsExt(selectedItems)}
                </ScrollView>
              </View> */}

              <InputField
                placeholder="Budget"
                customStyle={{width: '100%'}}
                value={budget}
                onChangeText={setBudget}
              />

              {/* <CustomDropDown
                placeholder={jobId ? selectedRange : 'Price Range'}
                data={data2}
                placeholderColor={
                  jobId ? Colors.inputTextColor : Colors.placeholderColor
                }
                setValue={handleSelectedItem2}
              /> */}
              <View style={styles.dateContainer}>
                <TouchableOpacity
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
            <View style={{alignSelf: 'center', marginTop: RFPercentage(3)}}>
              <GradientButton
                title={jobId ? 'Edit Job' : 'Make Job Live'}
                textStyle={{fontSize: RFPercentage(1.5)}}
                onPress={postJob}
                loading={loading}
                disabled={loading}
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
    paddingBottom: RFPercentage(8),
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
