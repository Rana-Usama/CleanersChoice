import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import React, {useState, useRef, useEffect} from 'react';
import {Colors, Fonts, Icons, IMAGES} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import HeaderBack from '../../../components/HeaderBack';
import LinearGradient from 'react-native-linear-gradient';
import Package from '../../../components/Package';
import GradientButton from '../../../components/GradientButton';
import {useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../../../routers/StackNavigator';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import moment from 'moment';
import {useSelector} from 'react-redux';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AntDesign from 'react-native-vector-icons/AntDesign';

const {width} = Dimensions.get('window');

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

const ServiceDetails: React.FC = ({route}: any) => {
  const {item} = route.params;
  const [visibleItems, setVisibleItems] = useState(5);
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'ServiceDetails'>
    >();
  const profileData = useSelector(state => state.profile.profileData);
  const [loading, setloading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const toggleDescription = () => {
    setIsExpanded(prevState => !prevState);
  };

  const [step, setStep] = useState(0);
  const scrollViewRef = useRef(null);

  const onScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);

    if (index !== step) {
      setStep(index);
    }
  };

  const handleShowMore = () => {
    setVisibleItems(prev => Math.min(prev + 5, item.type.length));
  };

  const handleShowLess = () => {
    setVisibleItems(5);
  };

  // Services names
  const getServiceNames = (serviceIds: any) => {
    return serviceIds
      ?.map((id: any) => {
        const serviceItem = items.find(item => item.id === id);
        return serviceItem ? serviceItem.name : null;
      })
      .filter((name: any) => name !== null);
  };
  const serviceNames = getServiceNames(item?.type.slice(0, visibleItems));
  const createdAtDate = new Date(item.createdAt._seconds * 1000);
  const formattedDate = moment(createdAtDate).format('DD MMMM, YYYY');

  const getTruncatedText = (text: any) => {
    const maxChars = 120;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).trim() + '... ';
  };

  // Generating chat id
  const user = auth().currentUser;
  const userId = user?.uid;
  const generateChatId = () => {
    return `${userId}_${item.id}`;
  };
  const chatId = generateChatId();
  const [existingChatId, setExistingChatId] = useState(null);

  // Existing chat id
  const fetchExistingChatId = async (userId1: any, userId2: any) => {
    try {
      const chatsSnapshot = await firestore()
        .collection('Chats')
        .where('participants', 'array-contains', userId1)
        .get();

      for (const doc of chatsSnapshot.docs) {
        const chatData = doc.data();
        const participants = chatData.participants || [];

        if (participants.includes(userId1) && participants.includes(userId2)) {
          return doc.id;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Finding chat
  useEffect(() => {
    const tryToFindChat = async () => {
      if (user?.uid && item?.jobId) {
        const chatId = await fetchExistingChatId(userId, item.id);
        if (chatId) {
          setExistingChatId(chatId);
        } else {
          console.log('No existing chat found');
        }
      }
    };

    tryToFindChat();
  }, [userId, item?.id]);

  // Fetching token
  const [token, setFcmToken] = useState(null);
  useEffect(() => {
    fetchToken(item.id);
  }, []);
  const fetchToken = async (id: any) => {
    try {
      const userDoc = await firestore().collection('Users').doc(id).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setFcmToken(userData?.fcmToken);
      }
    } catch (error) {}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={{paddingBottom: RFPercentage(10)}}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <HeaderBack
          title={'Service Details'}
          textStyle={{fontSize: RFPercentage(2)}}
          left={true}
        />

        {/* Main Container */}
        <View style={{width: '100%', marginTop: RFPercentage(2)}}>
          <ScrollView
            horizontal
            onScroll={onScroll}
            ref={scrollViewRef}
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            style={{
              width: width,
              height: RFPercentage(28),
            }}
            contentContainerStyle={{
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {item.serviceImages.map((image: any, index: any) => (
              <View key={index} style={{margin: 20}}>
                <Image
                  source={typeof image === 'string' ? {uri: image} : image}
                  resizeMode="cover"
                  style={styles.cover}
                  borderRadius={RFPercentage(1)}
                />
              </View>
            ))}
          </ScrollView>
          {item.serviceImages.length > 1 && (
            <View style={styles.dotsContainer}>
              {item.serviceImages.length === 1 ? null : (
                <>
                  {item.serviceImages.map((_: any, index: any) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setStep(index)}>
                      {step === index ? (
                        <LinearGradient
                          colors={[Colors.gradient1, Colors.gradient2]}
                          style={styles.activeDot}
                        />
                      ) : (
                        <View style={styles.inactiveDot} />
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          )}
        </View>
        <View style={styles.container}>
          {/* Service Info */}
          <View style={{marginTop: RFPercentage(2)}}>
            <View style={styles.rowContainer}>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Image
                  source={item.image ? {uri: item.image} : IMAGES.defaultPic}
                  resizeMode="contain"
                  style={styles.icon}
                />
              </TouchableOpacity>

              <Text style={[styles.headeing2, {color: Colors.primaryText}]}>
                {item.name?.length > 10
                  ? `${item.name.slice(0, 10)}...`
                  : item.name}
              </Text>
            </View>

            <View
              style={{position: 'absolute', right: 0, top: RFPercentage(2.1)}}>
              <Text style={styles.joining}>Joined on : {formattedDate}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={{marginTop: RFPercentage(2.5)}}>
            <View>
              <View style={styles.rowAlign}>
                <Image
                  source={Icons.bars}
                  resizeMode="contain"
                  style={styles.icons}
                />
                <Text
                  style={[styles.headeing2, {marginLeft: RFPercentage(0.8)}]}>
                  Description:
                </Text>
              </View>
              <Text style={styles.showMore}>
                {isExpanded
                  ? item.description + ' '
                  : getTruncatedText(item.description)}
                {item.description.length > 120 && (
                  <Text onPress={toggleDescription} style={styles.showText}>
                    {isExpanded ? 'Read Less' : 'Read More'}
                  </Text>
                )}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={{marginTop: RFPercentage(2.5)}}>
            <View style={styles.rowAlign}>
              <Image
                source={Icons.location}
                resizeMode="contain"
                style={styles.icons}
              />
              <Text style={[styles.headeing2, {marginLeft: RFPercentage(0.8)}]}>
                Location:
              </Text>
            </View>
            <Text style={styles.showMore}>{item.location}</Text>
          </View>

          {/* Availability */}
          <View style={{marginTop: RFPercentage(2.5)}}>
            <View>
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() =>
                  navigation.navigate('CheckAvailability', {item: item})
                }
                style={styles.availabilityRow}>
                <Image
                  source={Icons.availability}
                  resizeMode="contain"
                  style={styles.icons}
                />
                <Text style={styles.check}>Check Availability</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Services */}
          <View style={{marginTop: RFPercentage(2.5)}}>
            <View style={styles.serviceRow}>
              <View style={styles.rowAlign}>
                <Image
                  source={Icons.verify}
                  resizeMode="contain"
                  style={styles.icons}
                />
                <Text
                  style={[styles.headeing2, {marginLeft: RFPercentage(0.8)}]}>
                  Services:
                </Text>
              </View>
            </View>
            <View
              style={{right: RFPercentage(0.7), marginTop: RFPercentage(0.5)}}>
              <FlatList
                data={serviceNames}
                numColumns={2}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item, index}) => (
                  <View style={styles.serviceBox}>
                    <Text style={styles.serviceText}>{item}</Text>
                  </View>
                )}
              />

              {/* Show More / Show Less button */}
              {item.type.length > 5 && (
                <TouchableOpacity
                  onPress={
                    visibleItems < item.type.length
                      ? handleShowMore
                      : handleShowLess
                  }>
                  <Text
                    style={[
                      styles.serviceMore,
                      {
                        left:
                          visibleItems < item.type.length
                            ? RFPercentage(20.6)
                            : RFPercentage(34.5),
                      },
                    ]}>
                    {visibleItems < item.type.length
                      ? `+${item.type.length - visibleItems} More`
                      : `See Less`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Packages */}
        <View>
          <View style={styles.msg}>
            <View style={styles.rowAlign}>
              <Image
                source={Icons.verify}
                resizeMode="contain"
                style={styles.icons}
              />
              <Text style={[styles.headeing2, {marginLeft: RFPercentage(0.8)}]}>
                Starting Packages:
              </Text>
            </View>
          </View>
          <View style={{marginTop: RFPercentage(1.5)}}>
            <FlatList
              horizontal
              data={item.packages}
              keyExtractor={item => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{paddingHorizontal: RFPercentage(1.2)}}
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

        {/* Button Container */}
        <View style={{alignSelf: 'center', marginTop: RFPercentage(7)}}>
          <GradientButton
            title="Get Custom Offer"
            style={{width: RFPercentage(20)}}
            textStyle={{fontSize: RFPercentage(1.7)}}
            onPress={() => {
              setloading(true);
              setTimeout(() => {
                setloading(false);
                navigation.navigate('Chat', {
                  chatId: existingChatId ? existingChatId : chatId,
                  senderId: profileData.uid,
                  senderName: profileData.name,
                  receiver: item.id,
                  receiverName: item.name,
                  receiverProfile: item.image,
                  senderProfile: profileData.profile,
                  fcmToken: token,
                });
              }, 1000);
            }}
            loading={loading}
          />
        </View>
      </ScrollView>

      {/* Full picture */}
      {modalVisible && (
        <Modal
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
          animationType="fade">
          <View style={styles.modelContent}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.arrow}>
              <AntDesign
                name="arrowleft"
                color={Colors.primaryText}
                size={RFPercentage(2.8)}
              />
            </TouchableOpacity>
            <Image
              source={item.image ? {uri: item.image} : IMAGES.defaultPic}
              resizeMode="contain"
              style={styles.fullImg}
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default ServiceDetails;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    width: '90%',
    alignSelf: 'center',
    paddingTop: RFPercentage(1),
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(2),
  },
  activeDot: {
    width: RFPercentage(1),
    height: RFPercentage(1),
    borderRadius: RFPercentage(2),
    marginHorizontal: 3,
  },
  inactiveDot: {
    width: RFPercentage(1),
    height: RFPercentage(1),
    borderRadius: RFPercentage(2),
    marginHorizontal: 3,
    backgroundColor: 'rgba(209, 213, 219, 1)',
  },
  image: {
    width: '100%',
    height: RFPercentage(27),
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(100),
    marginRight: RFPercentage(1),
    borderWidth: 2,
    borderColor: Colors.gradient1,
  },
  starContainer: {
    flexDirection: 'row',
    // marginTop: RFPercentage(0.4),
    marginLeft: RFPercentage(7),
    bottom: RFPercentage(1.5),
  },
  star: {
    width: RFPercentage(1.3),
    height: RFPercentage(1.3),
    marginRight: RFPercentage(0.2),
  },
  headeing2: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cover: {
    width: width * 0.9,
    height: RFPercentage(28),
  },
  joining: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
  },
  icons: {width: RFPercentage(1.8), height: RFPercentage(1.8)},
  showMore: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    textAlign: 'justify',
    lineHeight: RFPercentage(2.5),
    marginTop: RFPercentage(0.5),
  },
  showText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: RFPercentage(20),
  },
  check: {
    color: Colors.gradient1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    left: RFPercentage(0.8),
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceBox: {
    height: RFPercentage(4),
    borderWidth: 1,
    borderColor: Colors.inputFieldColor,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RFPercentage(0.8),
    margin: RFPercentage(0.7),
    paddingHorizontal: RFPercentage(2),
    alignSelf: 'flex-start',
  },
  serviceText: {
    color: Colors.placeholderColor,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
  },
  serviceMore: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    textAlign: 'center',
    bottom: RFPercentage(1.5),
    position: 'absolute',
  },
  msg: {
    width: '90%',
    alignSelf: 'center',
    marginTop: RFPercentage(2.5),
  },
  modelContent: {
    flex: 1,
    backgroundColor: '',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    position: 'absolute',
    left: RFPercentage(2),
    top: Platform.OS === 'android' ? RFPercentage(3.6) : RFPercentage(6),
    zIndex: 2,
  },
  fullImg: {width: '100%', height: '100%'},
});
