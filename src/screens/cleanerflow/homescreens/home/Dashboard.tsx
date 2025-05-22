import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import React, {useState, useEffect, useCallback} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons, IMAGES} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import ImagePicker from 'react-native-image-crop-picker';
import GradientButton from '../../../../components/GradientButton';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {useDispatch, useSelector} from 'react-redux';
import {
  setProfileData,
  setProfileCompletion,
} from '../../../../redux/ProfileData/Actions';
import Package from '../../../../components/Package';
import {RootStackParamList} from '../../../../routers/StackNavigator';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Review from '../../../../components/Review';
import {Image as CompressorImage} from 'react-native-compressor';
import { useExitAppOnBack } from '../../../../utils/ExitApp';

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

const Dashboard: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'CleanerNavigator'>
    >();
  const [img, setImg] = useState(null);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [service, setService] = useState(null);
  const dispatch = useDispatch();
  const [visibleItems, setVisibleItems] = useState(5);
  const [loading3, setLoading3] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useExitAppOnBack()

  const onRefresh = () => {
    setRefreshing(true);
    setLoading3(true)
    setLoading(true);
    serviceDetails();
    fetchUserData();
    setTimeout(() => {
      setRefreshing(false);
      setLoading(false);
      setLoading3(false)
    }, 2000);
  };

  const uploadImg = async () => {
    try {
      setLoading(true);
      const image = await ImagePicker.openPicker({
        width: 1000,
        height: 1000,
        cropping: true,
      });
      if (!image) {
        setLoading(false);
        return;
      }
      const compressedImage = await CompressorImage.compress(image.path, {
        compressionMethod: 'manual',
        maxWidth: 1000,
        quality: 0.8,
      });

      const user = auth().currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      const imagePath = `user_profiles/profile_${user.uid}.jpg`;
      const reference = storage().ref(imagePath);
      await reference.putFile(compressedImage);
      const downloadURL = await reference.getDownloadURL();
      await firestore().collection('Users').doc(user.uid).update({
        profile: downloadURL,
      });
      setImg({uri: downloadURL});
      setProfile(downloadURL);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading3(true);
    setTimeout(() => {
      setLoading3(false);
    }, 3000);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, []),
  );

  const fetchUserData = async () => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      const userDoc = await firestore().collection('Users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setProfile(userData?.profile);
        setName(userData?.name);
        dispatch(setProfileData(userData));
      }
    } catch (error) {}
  };

  useFocusEffect(
    React.useCallback(() => {
      serviceDetails();
    }, []),
  );

  const serviceDetails = async () => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      const userDoc = await firestore()
        .collection('CleanerServices')
        .doc(user.uid)
        .get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setService(userData);
      }
    } catch (error) {}
  };

  const handleNext = () => {
    setLoading2(true);
    setTimeout(() => {
      setLoading2(false);
      navigation.navigate('ServiceOne');
    }, 500);
  };

  const profileCompletion =
    service?.availability?.length > 0 &&
    service?.description?.length > 0 &&
    service?.location?.length > 0 &&
    service?.packages?.length > 0
      ? '100'
      : service?.availability?.length > 0 &&
        service?.description?.length > 0 &&
        service?.location?.length > 0
      ? '80'
      : '50';

  dispatch(setProfileCompletion(profileCompletion));

  const handleShowMore = () => {
    setVisibleItems(prev => Math.min(prev + 5, service?.type.length));
  };

  const handleShowLess = () => {
    setVisibleItems(5);
  };

  const getServiceNames = (serviceIds: any) => {
    return serviceIds
      ?.map((id: any) => {
        const serviceItem = items.find(item => item.id === id);
        return serviceItem ? serviceItem.name : null;
      })
      .filter((name: any) => name !== null);
  };
  const serviceNames = getServiceNames(service?.type?.slice(0, visibleItems));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{paddingBottom: RFPercentage(15)}}
        style={{flex: 1}}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <HeaderBack
          logo={true}
          title="Dashboard"
          textStyle={styles.headerText}
          right={profileCompletion === '100' ? true : false}
          rightText="Edit Service"
          onPress={() => navigation.navigate('ServiceOne')}
        />

        <View style={styles.container}>
          
          {/* Profile Image */}
          <View style={styles.imgContainer}>
            <TouchableOpacity onPress={uploadImg}>
              <View style={styles.pictureContainer}>
                {loading ? (
                  <ActivityIndicator
                    size={'large'}
                    color={Colors.inputFieldColor}
                  />
                ) : (
                  <Image
                    source={
                      img
                        ? {uri: img?.uri}
                        : profile
                        ? {uri: profile}
                        : IMAGES.defaultPic
                    }
                    resizeMode="contain"
                    style={styles.imgStyle}
                  />
                )}
              </View>

              <TouchableOpacity onPress={uploadImg}>
                <Image
                  source={Icons.edit}
                  resizeMode="contain"
                  style={styles.uploadedImg}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.nameText}>{name}</Text>
          </View>
        </View>

        {/* Service Details */}
        {loading3 ? (
          <>
            <ActivityIndicator
              size={RFPercentage(5)}
              color={'rgba(75, 85, 99, 0.5)'}
              style={{top: RFPercentage(20)}}
            />
          </>
        ) : (
          <>
            {profileCompletion === '100' ? (
              <>
                <View style={styles.ratingContainer2}>
                  <View style={styles.starContainer}>
                    {Array.from({length: service?.rating}, (_, index) => (
                      <Image
                        key={index}
                        source={IMAGES.star}
                        resizeMode="contain"
                        style={styles.star}
                      />
                    ))}
                  </View>
                </View>

                {/* Description */}
                <View
                  style={{
                    marginTop: RFPercentage(2.5),
                    width: '90%',
                    alignSelf: 'center',
                  }}>
                  <View>
                    <Text style={styles.headeing2}>Description:</Text>
                    <Text style={styles.description}>
                      {service?.description}
                    </Text>
                  </View>
                </View>

                {/* Availability */}
                <View
                  style={{
                    marginTop: RFPercentage(2.5),
                    width: '90%',
                    alignSelf: 'center',
                  }}>
                  <View>
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => navigation.navigate('Availability')}
                      style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Text style={styles.availability}>
                        Edit Your Availability
                      </Text>
                      <Image
                        source={Icons.editIcon}
                        resizeMode="contain"
                        style={styles.availabilityIcon}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Services */}
                <View style={{marginTop: RFPercentage(2.5)}}>
                  <View style={styles.serviceContainer}>
                    <Text style={styles.headeing2}>Services:</Text>
                  </View>
                  <View
                    style={{
                      right: RFPercentage(0.7),
                      marginTop: RFPercentage(0.5),
                    }}>
                    <FlatList
                      data={serviceNames}
                      numColumns={2}
                      contentContainerStyle={{
                        paddingHorizontal: RFPercentage(2),
                      }}
                      keyExtractor={(item, index) => index.toString()}
                      renderItem={({item, index}) => (
                        <View style={styles.serviceBox}>
                          <Text style={styles.serviceName}>{item}</Text>
                        </View>
                      )}
                    />
                    {service?.type.length > 5 && (
                      <TouchableOpacity
                        onPress={
                          visibleItems < service?.type.length
                            ? handleShowMore
                            : handleShowLess
                        }>
                        <Text
                          style={[
                            styles.showMore,
                            {
                              left:
                                visibleItems < service?.type?.length
                                  ? RFPercentage(19.5)
                                  : RFPercentage(35.5),
                            },
                          ]}>
                          {visibleItems < service?.type.length
                            ? `+${service?.type.length - 5} More`
                            : `See Less`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Packages */}
                <View>
                  <Text
                    style={[
                      styles.headeing2,
                      {
                        width: '90%',
                        alignSelf: 'center',
                        marginTop: RFPercentage(2.5),
                      },
                    ]}>
                    Starting Packages:
                  </Text>
                  <View style={{marginTop: RFPercentage(1.5)}}>
                    <FlatList
                      horizontal
                      data={service?.packages}
                      keyExtractor={item => item.id.toString()}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{
                        paddingHorizontal: RFPercentage(1.2),
                      }}
                      renderItem={({item}) => {
                        return (
                          <Package
                            name={`Package ${item.id}`}
                            price={item.price}
                            detail={item.details}
                          />
                        );
                      }}
                    />
                  </View>
                </View>

                {/* Rating and Review */}
                {service?.rating || service?.reviews.length > 0 ? (
                  <>
                    <View style={{width: '90%', alignSelf: 'center'}}>
                      <View>
                        <Text
                          style={[
                            styles.headeing2,
                            {marginTop: RFPercentage(2.5)},
                          ]}>
                          Rating & Reviews:
                        </Text>
                      </View>
                      <View style={styles.ratingContainer}>
                        <Text
                          style={[
                            styles.headeing2,
                            {color: Colors.primaryText},
                          ]}>
                          Overall Rating
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}>
                          <Image
                            source={IMAGES.star}
                            resizeMode="contain"
                            style={styles.ratingStar}
                          />
                          <Text style={styles.ratingText}>5.0</Text>
                        </View>
                      </View>
                      <View style={{marginTop: RFPercentage(2)}}>
                        <Review />
                      </View>
                    </View>
                  </>
                ) : null}
              </>
            ) : (
              // Profile Completion Info Container
              <>
                <View style={styles.profileCompletionContainer}>
                  <Text style={styles.profileCompletionText}>
                    Profile Completion {profileCompletion}%
                  </Text>
                </View>
                <View style={styles.noServiceContainer}>
                  <Image
                    source={Icons.dashBoard}
                    resizeMode="contain"
                    style={styles.dashboardIcon}
                  />
                  <Text style={styles.noServiceText}>
                    You haven’t listed any services
                  </Text>
                </View>

                <View style={styles.completeProfileContainer}>
                  <GradientButton
                    title="Complete Profile Now"
                    textStyle={styles.buttonText}
                    style={styles.button}
                    onPress={handleNext}
                    loading={loading2}
                    disabled={loading2}
                  />
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    width: '90%',
    alignSelf: 'center',
    // backgroundColor: 'red',
    // flex: 1,
  },
  imgContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(4),
  },
  pictureContainer: {
    width: RFPercentage(13),
    height: RFPercentage(13),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 244, 246, 1)',
    borderWidth: 2,
    borderColor: 'rgba(64, 123, 255, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 40,
  },
  imgStyle: {
    width: RFPercentage(12),
    height: RFPercentage(12),
    borderRadius: RFPercentage(100),
  },
  uploadedImg: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    position: 'absolute',
    left: RFPercentage(9.5),
    bottom: RFPercentage(1),
  },
  nameContainer: {
    marginTop: RFPercentage(2),
  },
  nameText: {
    textAlign: 'center',
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
    fontSize: RFPercentage(1.8),
  },
  profileCompletionContainer: {
    width: '90%',
    height: RFPercentage(5),
    borderWidth: 1.4,
    borderColor: Colors.gradient1,
    borderRadius: RFPercentage(0.8),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: RFPercentage(3.5),
  },

  profileCompletionText: {
    textAlign: 'center',
    fontFamily: Fonts.fontRegular,
    color: 'rgba(0, 0, 0, 1)',
    fontSize: RFPercentage(1.7),
    textAlignVertical: 'center',
  },
  noServiceContainer: {
    marginTop: RFPercentage(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardIcon: {
    width: RFPercentage(7),
    height: RFPercentage(7),
  },
  availability: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
  },
  availabilityIcon: {
    width: RFPercentage(1.5),
    height: RFPercentage(1.5),
    left: RFPercentage(0.5),
  },
  noServiceText: {
    textAlign: 'center',
    fontFamily: Fonts.fontRegular,
    color: 'rgba(55, 65, 81, 1)',
    fontSize: RFPercentage(1.7),
    marginTop: RFPercentage(1),
  },
  completeProfileContainer: {
    // position: 'absolute',
    alignSelf: 'center',
    marginTop: RFPercentage(20),
    // bottom: 0,
  },
  button: {
    width: RFPercentage(20),
  },
  buttonText: {
    fontSize: RFPercentage(1.6),
  },
  headerText: {
    fontSize: RFPercentage(2),
  },

  starContainer: {
    flexDirection: 'row',
  },
  star: {
    width: RFPercentage(1.3),
    height: RFPercentage(1.3),
    marginRight: RFPercentage(0.2),
    bottom: RFPercentage(0.5),
  },
  headeing2: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.9),
  },
  description: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    textAlign: 'justify',
    lineHeight: RFPercentage(2.5),
    marginTop: RFPercentage(0.5),
  },
  serviceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    alignSelf: 'center',
  },
  allText: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
  },
  serviceBox: {
    height: RFPercentage(4),
    borderWidth: 1,
    borderColor: Colors.inputFieldColor,
    borderRadius: RFPercentage(0.8),
    margin: RFPercentage(0.7),
    paddingHorizontal: RFPercentage(1.2),
    // width:RFPercentage(16),
    justifyContent: 'center',
  },
  serviceName: {
    color: Colors.placeholderColor,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
  },
  moreButton: {
    color: Colors.placeholderColor,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    textAlign: 'center',
    position: 'absolute',
    bottom: RFPercentage(2.6),
    left: RFPercentage(22),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: RFPercentage(1.8),
  },
  ratingStar: {
    width: RFPercentage(1.8),
    height: RFPercentage(1.8),
    right: 3,
  },
  ratingText: {
    color: 'rgba(0, 0, 0, 1)',
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.4),
    top: 1,
  },
  ratingContainer2: {
    marginTop: RFPercentage(0.8),
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  showMore: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontMedium,
    textAlign: 'center',
    bottom: RFPercentage(1.5),
    position: 'absolute',
  },
});
