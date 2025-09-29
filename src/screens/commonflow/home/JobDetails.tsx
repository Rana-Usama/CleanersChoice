import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import GradientButton from '../../../components/GradientButton';
import NextButton from '../../../components/NextButton';
import {useDispatch, useSelector} from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import {setJobId} from '../../../redux/Job/Actions';
import auth from '@react-native-firebase/auth';

const JobDetails = ({route, navigation}: any) => {
  const {item} = route.params;
  const userData = useSelector(state => state?.profile?.profileData);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);

  // Mark Complete
  const markComplete = async (jobId: string, newStatus: string) => {
    setLoading(true);
    try {
      await firestore().collection('Jobs').doc(jobId).update({
        status: newStatus,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      navigation.goBack();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const dispatch = useDispatch();
  dispatch(setJobId(item.id));

  // Edit Button
  const handleEditButton = () => {
    setLoading2(true);
    setTimeout(() => {
      setLoading2(false);
      navigation.navigate('PostJob', {jobId: item.id});
    }, 1000);
  };

  // Generating Chat Id
  const user = auth().currentUser;
  const userId = user?.uid;
  const generateChatId = () => {
    return `${userId}_${item.id}`;
  };
  const chatId = generateChatId();
  const [existingChatId, setExistingChatId] = useState(null);

  // User Data
  const [userInfo, setUserInfo] = useState([]);
  useEffect(() => {
    fetchUserData();
  }, []);
  const fetchUserData = async () => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      const userDoc = await firestore().collection('Users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setUserInfo(userData);
      }
    } catch (error) {}
  };

  // Other user
  const [otherUser, setOtherUser] = useState([]);
  useEffect(() => {
    otherUserData();
  }, []);
  const otherUserData = async () => {
    try {
      const userDoc = await firestore()
        .collection('Users')
        .doc(item.jobId)
        .get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setOtherUser(userData);
      }
    } catch (error) {}
  };

  // Fetch existing id
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

  // Finding Chat
  useEffect(() => {
    const tryToFindChat = async () => {
      if (user?.uid && item?.jobId) {
        const chatId = await fetchExistingChatId(user.uid, item.jobId);
        if (chatId) {
          setExistingChatId(chatId);
        }
      }
    };
    tryToFindChat();
  }, [user?.uid, item?.jobId]);

  const cleanDescription = item.description.replace(/\s+/g, ' ').trim();

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack
        title="Posted Job Details"
        textStyle={styles.headerText}
        left={true}
      />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <View
                style={{
                  width: RFPercentage(3.3),
                  height: RFPercentage(3.3),
                  borderRadius: RFPercentage(100),
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(222, 243, 255, 1)',
                }}>
                <Image
                  source={Icons.verify}
                  resizeMode="contain"
                  style={styles.icon}
                  tintColor={Colors.gradient1}
                />
              </View>
              <Text style={styles.label}>Job Title:</Text>
            </View>
            <Text style={styles.value}>{item.title}</Text>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <View
                style={{
                  width: RFPercentage(3.3),
                  height: RFPercentage(3.3),
                  borderRadius: RFPercentage(100),
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(222, 243, 255, 1)',
                }}>
                <Image
                  source={Icons.bars}
                  resizeMode="contain"
                  style={styles.icon}
                  tintColor={Colors.gradient1}
                />
              </View>
              <Text style={styles.label}>Description:</Text>
            </View>
            <Text style={styles.description}>{cleanDescription}</Text>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <View
                style={{
                  width: RFPercentage(3.3),
                  height: RFPercentage(3.3),
                  borderRadius: RFPercentage(100),
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(222, 243, 255, 1)',
                }}>
                <Image
                  source={Icons.location}
                  resizeMode="contain"
                  style={styles.icon}
                  tintColor={Colors.gradient1}
                />
              </View>
              <Text style={styles.label}>Location:</Text>
            </View>
            <Text style={styles.value}>{item.location}</Text>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <View
                style={{
                  width: RFPercentage(3.3),
                  height: RFPercentage(3.3),
                  borderRadius: RFPercentage(100),
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(222, 243, 255, 1)',
                }}>
                <Image
                  source={Icons.verify}
                  resizeMode="contain"
                  style={styles.icon}
                  tintColor={Colors.gradient1}
                />
              </View>
              <Text style={styles.label}>Service Type:</Text>
            </View>
            <Text style={styles.value}>{item.type}</Text>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <View
                style={{
                  width: RFPercentage(3.3),
                  height: RFPercentage(3.3),
                  borderRadius: RFPercentage(100),
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(222, 243, 255, 1)',
                }}>
                <Image
                  source={Icons.priceRange}
                  resizeMode="contain"
                  style={styles.icon}
                  tintColor={Colors.gradient1}
                />
              </View>
              <Text style={styles.label}>Budget:</Text>
            </View>
            <Text style={styles.value}>{item.priceRange}$</Text>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <View
                style={{
                  width: RFPercentage(3.3),
                  height: RFPercentage(3.3),
                  borderRadius: RFPercentage(100),
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(222, 243, 255, 1)',
                }}>
                <Image
                  source={Icons.calendar}
                  resizeMode="contain"
                  style={styles.icon}
                  tintColor={Colors.gradient1}
                />
              </View>
              <Text style={styles.label}>Due Date & Time:</Text>
            </View>
            <Text style={styles.value}>{item.createdAt}</Text>
          </View>
        </View>
        {item.status === 'active' && userData.role === 'Customer' ? (
          <>
            <View style={styles.buttonWrapper}>
              <NextButton
                title="Edit Job Post"
                onPress={handleEditButton}
                textStyle={styles.buttonText}
                disabled={loading2 || loading}
                loading={loading2}
                style={{width: RFPercentage(20)}}
              />
              <View style={styles.buttonSpacing}>
                <GradientButton
                  title="Mark as complete"
                  textStyle={styles.buttonText}
                  onPress={() => {
                    markComplete(item.id, 'completed');
                  }}
                  loading={loading}
                  disabled={loading}
                  style={{width: RFPercentage(20)}}
                />
              </View>
            </View>
          </>
        ) : userData.role === 'Cleaner' ? (
          <View style={styles.buttonWrapper}>
            <GradientButton
              title="Message Client"
              textStyle={styles.buttonText}
              onPress={() => {
                setLoading3(true);
                setTimeout(() => {
                  setLoading3(false);
                  navigation.navigate('Chat', {
                    chatId: existingChatId ? existingChatId : chatId,
                    senderId: userId,
                    senderName: userInfo?.name,
                    receiver: item.jobId,
                    receiverName: otherUser?.name,
                    receiverProfile: otherUser?.profile,
                    senderProfile: userInfo?.profile,
                    fcmToken: otherUser.fcmToken,
                  });
                }, 1000);
              }}
              loading={loading3}
              disabled={loading3}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default JobDetails;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollViewContent: {
    paddingBottom: RFPercentage(10),
  },
  container: {
    backgroundColor: Colors.background,
    width: '88%',
    alignSelf: 'center',
  },
  sectionContainer: {
    marginTop: RFPercentage(3),
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: RFPercentage(2),
    height: RFPercentage(2),
    bottom: 0.7,
  },
  label: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
    left: RFPercentage(0.8),
  },
  value: {
    color: 'rgba(75, 85, 99, 1)',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    marginTop: RFPercentage(0.5),
    // left:RFPercentage(1)
  },
  description: {
    color: 'rgba(75, 85, 99, 1)',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    marginTop: RFPercentage(0.6),
    lineHeight: RFPercentage(2.2),
  },
  buttonWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: RFPercentage(8),
  },
  buttonSpacing: {
    marginLeft: RFPercentage(2),
  },
  buttonText: {
    fontSize: RFPercentage(1.7),
  },
  headerText: {
    fontSize: RFPercentage(2),
  },
});
