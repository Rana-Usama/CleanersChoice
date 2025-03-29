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
} from 'react-native';
import React, {useState, useEffect} from 'react';
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
import InputField from '../../../../components/InputField';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useDispatch, useSelector} from 'react-redux';
import {cleanerDescription} from '../../../../redux/Form/Actions';
import {cleanerAvailability} from '../../../../redux/Availability/Actions';
import Toast from 'react-native-toast-message';

const data1 = [
  {id: 1, label: 'Washing'},
  {id: 2, label: 'Cleaning'},
  {id: 3, label: 'Repairing'},
];

const ServiceOne: React.FC = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const available = useSelector(state => state.availablity.availability);
  const [selectedItem, setSelectedItem] = useState(null);
  const [location, setLoaction] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const description = useSelector(state => state.form.description);
  const [serviceData, setServiceData] = useState(null);

  const handleSelection = item => {
    setSelectedItem(item);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth().currentUser;
      if (!user) return;
      try {
        const userDoc = await firestore()
          .collection('Users')
          .doc(user.uid)
          .get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setUserData(userData);
        } else {
          console.log('User data not found.');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserData();
  }, []);

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
        dispatch(cleanerDescription(data?.description || ''));
        dispatch(cleanerAvailability(data?.availability || false));
        setSelectedItem(data?.type || '');
        setLoaction(data?.location || '');
        setServiceData(data);
      }
    } catch (error) {
      console.error('Error fetching service data:', error);
    }
  };

  const addServices = async () => {
    const user = auth().currentUser;
    if (!user) return;

    if (description && location && available && selectedItem) {
      try {
        setLoading(true);
        const serviceRef = await firestore()
          .collection('CleanerServices')
          .doc(user.uid)
          .set({
            createdAt: firestore.FieldValue.serverTimestamp(),
            name: userData?.name,
            image: userData?.profile,
            description: description,
            availability: available,
            type: selectedItem,
            location: location,
            serviceImages: serviceData?.serviceImages || [],
            packages: serviceData?.packages || [],
            rating: serviceData?.rating || null,
            reviews: serviceData?.reviews || [],
          });
        navigation.navigate('ServiceTwo');
      } catch (error) {
        console.error('Error adding service: ', error);
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={{flexGrow: 1}}
          keyboardShouldPersistTaps="handled">
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
                count={false}
                value={description}
                onChangeText={text => dispatch(cleanerDescription(text))}
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
                        available.length > 0
                          ? Colors.inputTextColor
                          : Colors.placeholderColor,
                    },
                  ]}>
                  {available.length > 0
                    ? 'Availability Set'
                    : 'Set Availability'}
                </Text>
              </View>
              <View style={{position: 'absolute', right: RFPercentage(1)}}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Availability')}>
                  {available.length > 0 ? (
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

            <CustomDropDown
              placeholder={selectedItem || 'Select services you provide'}
              placeholderColor={{
                color: selectedItem
                  ? Colors.inputTextColor
                  : Colors.placeholderColor,
              }}
              data={data1}
              setValue={handleSelection}
            />
            <InputField
              placeholder="e.g. Ohio"
              customStyle={{width: '100%'}}
              value={location}
              onChangeText={setLoaction}
            />

            <View style={styles.buttonContainer}>
              <GradientButton
                title="Next"
                onPress={addServices}
                loading={loading}
                // disabled={(description && location && available && selectedItem) ? false : true}
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
    marginTop: RFPercentage(4),
  },
});
