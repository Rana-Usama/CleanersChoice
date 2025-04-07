import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  Keyboard,
} from 'react-native';
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Icons, Fonts} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import InfoHeader from '../../../../components/InfoHeader';
import DescriptionField from '../../../../components/DescriptionField';
import TimeLine from '../../../../components/TimeLine';
import CustomDropDown from '../../../../components/DropDown';
import GradientButton from '../../../../components/GradientButton';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import InputField from '../../../../components/InputField';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useDispatch, useSelector} from 'react-redux';
import {cleanerDescription} from '../../../../redux/Form/Actions';
import {cleanerAvailability} from '../../../../redux/Availability/Actions';
import Toast from 'react-native-toast-message';
import {RootStackParamList} from '../../../../routers/StackNavigator';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import MultiSelect from 'react-native-multiple-select';

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

const ServiceOne: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'ServiceOne'>
    >();
  const available = useSelector(state => state.availablity.availability);
  const [selectedItem, setSelectedItem] = useState(null);
  const [location, setLoaction] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const description = useSelector(state => state.form.description);
  const [serviceData, setServiceData] = useState(null);
  const profileCompletion = useSelector(
    state => state.profile.profileCompletion,
  );
  const profileData = useSelector(state => state.profile.profileData);
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
    } catch (error) {
      console.error(error);
    }
  };

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
            availability: available.length > 0 ? available  : serviceData?.availability,
            type: selectedItems,
            location: location,
            serviceImages: serviceData?.serviceImages || [],
            packages: serviceData?.packages || [],
            rating: serviceData?.rating || null,
            reviews: serviceData?.reviews || [],
          });
        navigation.navigate('ServiceTwo');
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    } else {
      Toast.show({
        type: 'info',
        text1: 'Adding Service',
        text2: 'Fill the required fields',
        position: 'top',
        topOffset: RFPercentage(8),
        text1Style: {fontFamily: Fonts.fontBold, fontSize: RFPercentage(1.7)},
        text2Style: {
          fontFamily: Fonts.fontRegular,
          fontSize: RFPercentage(1.4),
        },
      });
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack title="Service" textStyle={styles.headerText} />
      <KeyboardAvoidingView
        style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={{flexGrow: 1, paddingBottom: RFPercentage(5)}}
          >
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
              <DescriptionField
                placeholder="Service Description"
                count={true}
                value={description}
                onChangeText={text => dispatch(cleanerDescription(text))}
                maxLength={200}
              />
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
                  {available.length > 0 || serviceData?.availability.length > 0 ? (
                    <Image
                      source={Icons.timeEdit}
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

            <InputField
              placeholder="Location"
              value={location}
              onChangeText={setLoaction}
              customStyle={{width: '100%'}}
            />

            <View style={{flex: 1}}>
              <MultiSelect
                hideTags={true}
                items={items}
                uniqueKey="id"
                ref={multiSelectRef}
                onSelectedItemsChange={onSelectedItemsChange}
                selectedItems={selectedItems}
                selectText="Select Services you provide"
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
                textInputProps={{autoFocus:false}}  
                styleDropdownMenu={{height:RFPercentage(6)}}   
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{marginTop: RFPercentage(0.7)}}>
                {multiSelectRef.current?.getSelectedItemsExt(selectedItems)}
              </ScrollView>
            </View>

            <View style={styles.buttonContainer}>
              <GradientButton
                title={profileCompletion === '100' ? 'Edit' : 'Next'}
                onPress={addServices}
                loading={loading}
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
