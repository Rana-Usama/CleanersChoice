import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import React, {useState, useCallback, useRef} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Icons, Fonts} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import InfoHeader from '../../../../components/InfoHeader';
import DescriptionField from '../../../../components/DescriptionField';
import TimeLine from '../../../../components/TimeLine';
import GradientButton from '../../../../components/GradientButton';
import {useFocusEffect} from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import InputField from '../../../../components/InputField';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useDispatch, useSelector} from 'react-redux';
import {cleanerDescription} from '../../../../redux/Form/Actions';
import MultiSelect from 'react-native-multiple-select';
import {showToast} from '../../../../utils/ToastMessage';

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
    name: 'Lawn Care',
  },
  {
    id: '88',
    name: 'Others',
  },
];

const ServiceOne: React.FC = ({navigation}: any) => {
  const available = useSelector(state => state?.availablity?.availability);
  const [location, setLoaction] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const description = useSelector(state => state?.form?.description);
  const [serviceData, setServiceData] = useState(null);
  const profileCompletion = useSelector(
    state => state?.profile?.profileCompletion,
  );
  const profileData = useSelector(state => state?.profile?.profileData);
  const [selectedItems, setSelectedItems] = useState([]);
  const multiSelectRef = useRef(null);
  const onSelectedItemsChange = (selectedItems: any) => {
    setSelectedItems(selectedItems);
  };

  const [hasFetchedData, setHasFetchedData] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasFetchedData) {
        fetchServiceData();
        setHasFetchedData(true);
      }
    }, [hasFetchedData]),
  );

  // Fetching Services
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
        dispatch(cleanerDescription(data?.description || ''));
        setSelectedItems(data?.type || []);
        setLoaction(data?.location || '');
        setServiceData(data);
      }
    } catch (error) {}
  };

  // Adding Services
  const addServices = async () => {
    const user = auth().currentUser;
    if (!user) return;
    if (description && location && available && selectedItems) {
      try {
        setLoading(true);
        const serviceRef = await firestore()
          .collection('CleanerServices')
          .doc(user.uid)
          .set({
            createdAt: firestore.FieldValue.serverTimestamp(),
            name: profileData?.name,
            image: profileData?.profile,
            description: description,
            availability:
              available.length > 0 ? available : serviceData?.availability,
            type: selectedItems,
            location: location,
            serviceImages: serviceData?.serviceImages || [],
            packages: serviceData?.packages || [],
            rating: serviceData?.rating || null,
            reviews: serviceData?.reviews || [],
          });
        navigation.navigate('ServiceTwo');
      } catch (error) {
      } finally {
        setLoading(false);
      }
    } else {
      showToast({
        type: 'info',
        title: 'Adding Service Details',
        message: 'Please fill all the fields!',
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack title="Service" textStyle={styles.headerText} left={true} />
      <KeyboardAvoidingView style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={{flexGrow: 1, paddingBottom: RFPercentage(5)}}>
          {/* Header */}
          <View style={styles.container}>
            <View style={styles.infoHeaderContainer}>
              <InfoHeader />
            </View>
          </View>

          {/* Time Line */}
          <View style={styles.timeLineContainer}>
            <TimeLine />
          </View>

          <View style={styles.container}>
            {/* Description */}
            <View style={styles.descriptionContainer}>
              <DescriptionField
                placeholder="Service Description"
                count={true}
                value={description}
                onChangeText={text => dispatch(cleanerDescription(text))}
                maxLength={200}
              />
            </View>

            {/* Availability */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Availability')}
              style={styles.dateContainer}>
              <View style={styles.dateButton}>
                <Image
                  source={Icons.calendar}
                  resizeMode="contain"
                  style={styles.dateIcon}
                />
                <Text
                  style={[
                    styles.dateText,
                    {
                      color:
                        available.length > 0 ||
                        serviceData?.availability.length > 0
                          ? Colors.inputTextColor
                          : Colors.placeholderColor,
                    },
                  ]}>
                  {available.length > 0 || serviceData?.availability.length > 0
                    ? 'Availability Set'
                    : 'Set Availability'}
                </Text>
              </View>
              <View style={{position: 'absolute', right: RFPercentage(1)}}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Availability')}>
                  {available.length > 0 ||
                  serviceData?.availability.length > 0 ? (
                    <Image
                      source={Icons.availablityEdit}
                      style={{width: RFPercentage(2), height: RFPercentage(2)}}
                      resizeMode="contain"
                    />
                  ) : (
                    <AntDesign
                      name="right"
                      size={RFPercentage(1.5)}
                      color={Colors.placeholderColor}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Location */}
            <InputField
              placeholder="Add city/town you provide your services at"
              value={location}
              onChangeText={setLoaction}
              customStyle={{width: '100%', marginBottom: RFPercentage(3)}}
            />

            {/* Service Type */}
            <View style={{flex: 1}}>
              <MultiSelect
                hideTags={true}
                items={items}
                styleDropdownMenuSubsection={{
                  borderWidth: 1,
                  borderRadius: RFPercentage(0.8),
                  borderColor: Colors.inputFieldColor,
                }}
                uniqueKey="id"
                ref={multiSelectRef}
                onSelectedItemsChange={onSelectedItemsChange}
                selectedItems={selectedItems}
                selectText="Select Services you provide"
                searchInputPlaceholderText="Search Services..."
                onChangeInput={text => console.log(text)}
                altFontFamily={Fonts.fontRegular}
                tagRemoveIconColor={Colors.placeholderColor}
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
                itemFontSize={RFPercentage(1.6)}
                hideSubmitButton
                styleItemsContainer={{
                  backgroundColor: 'transparent',
                  borderRadius: RFPercentage(0.5),
                  padding: RFPercentage(1),
                }}
                styleTextDropdownSelected={{
                  color: Colors.placeholderColor,
                  fontSize: RFPercentage(1.7),
                  fontFamily: Fonts.fontRegular,
                  marginLeft: RFPercentage(1.3),
                }}
                styleTextDropdown={{
                  color: Colors.placeholderColor,
                  fontSize: RFPercentage(1.7),
                  fontFamily: Fonts.fontRegular,
                  marginLeft: RFPercentage(1.3),
                }}
                styleTextTag={{
                  fontSize: RFPercentage(1.6),
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
            </View>

            {/* Button Container */}
            <View style={styles.buttonContainer}>
              <GradientButton
                title={profileCompletion === '100' ? 'Edit' : 'Next'}
                onPress={addServices}
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

export default ServiceOne;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerText: {
    fontSize: RFPercentage(2),
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
    height: RFPercentage(6),
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
    fontSize: RFPercentage(1.7),
    marginLeft: 5,
    top: RFPercentage(0.2),
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(5),
  },
  serviceBox: {
    borderRadius: RFPercentage(0.8),
    marginVertical: RFPercentage(0.6),
    width: RFPercentage(17),
    marginHorizontal: RFPercentage(1),
    flexDirection: 'row',
    alignItems: 'center',
    padding: RFPercentage(1),
    backgroundColor: 'rgba(229, 231, 235, 0.3)',
    borderWidth: 1.2,
  },
  serviceLabel: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
  },
  heading: {
    color: Colors.inputTextColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    top: RFPercentage(0.6),
  },
});
