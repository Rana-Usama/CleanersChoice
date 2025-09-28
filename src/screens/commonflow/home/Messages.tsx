import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import React, {useState, useEffect, useCallback} from 'react';
import firestore from '@react-native-firebase/firestore';
import {RFPercentage} from 'react-native-responsive-fontsize';
import HeaderBack from '../../../components/HeaderBack';
import {Colors, Fonts, IMAGES} from '../../../constants/Themes';
import Message from '../../../components/Message';
import moment from 'moment';
import {useFocusEffect} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import NotFound from '../../../components/NotFound';
import {Skeleton} from '@rneui/themed';
import {useExitAppOnBack} from '../../../utils/ExitApp';

const Messages = ({navigation}: any) => {
  const [chats, setChats] = useState<
    {
      id: any;
      name: any;
      image: any;
      lastMessage: any;
      lastMessageTimestamp: any;
      receiverId: any;
    }[]
  >([]);

  useExitAppOnBack();

  const [loading2, setLoading2] = useState(false);
  const [all, setAll] = useState(true);
  const [unread, setUnread] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged(user => {
      setUserId(user?.uid || null);
    });
    return unsubscribeAuth;
  }, []);

  const toggle1 = () => {
    setAll(true);
    setUnread(false);
  };
  const toggle2 = () => {
    setAll(false);
    setUnread(true);
  };

  useEffect(() => {
    setLoading2(true);
    setTimeout(() => {
      setLoading2(false);
    }, 2000);
  }, []);

  const [refreshing, setRefreshing] = useState(false);

  // Fetch chats
  const fetchChats = async () => {
    try {
      const snapshot = await firestore()
        .collection('Chats')
        .where('participants', 'array-contains', userId)
        .orderBy('lastMessageTimestamp', 'desc')
        .get();

      const allChats = await Promise.all(
        snapshot.docs.map(async doc => await getChatData(doc)),
      );

      const filteredChats = unread
        ? allChats.filter(
            chat =>
              chat.lastMessage?.unread === true &&
              chat.lastMessage?.senderId !== userId &&
              chat.lastMessage?.receiver === userId,
          )
        : allChats;

      setChats(filteredChats);
    } catch (error) {}
  };

  // On Refresh
  const onRefresh = () => {
    setRefreshing(true);
    setLoading2(true);
    fetchChats();
    setTimeout(() => {
      setRefreshing(false);
      setLoading2(false);
    }, 1500);
  };

  // Filter
  useFocusEffect(
    useCallback(() => {
      let unsubscribe: any;
      fetchChats();
      if (userId) {
        let query = firestore()
          .collection('Chats')
          .where('participants', 'array-contains', userId)
          .orderBy('lastMessageTimestamp', 'desc');

        unsubscribe = query.onSnapshot(async snapshot => {
          try {
            const allChats = await Promise.all(
              snapshot.docs.map(async doc => await getChatData(doc)),
            );

            const filteredChats = unread
              ? allChats.filter(
                  chat =>
                    chat.lastMessage?.unread === true &&
                    chat.lastMessage?.senderId !== userId &&
                    chat.lastMessage?.receiver === userId,
                )
              : allChats;

            setChats(filteredChats);
          } catch (error) {}
        });
      }
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, [userId, unread]),
  );

  // Chats Data
  const getChatData = async (doc: any) => {
    const chat = doc.data();
    const otherUser = chat.participants.find((p: any) => p !== userId);
    try {
      const userDoc = await firestore()
        .collection('Users')
        .doc(otherUser)
        .get();
      const userData = userDoc.data();
      return {
        id: doc.id,
        name: userData?.name || 'Unknown',
        image: userData?.profile || null,
        lastMessage: chat.lastMessage || '',
        lastMessageTimestamp: chat.lastMessageTimestamp,
        receiverId: userData?.uid,
        fcmToken: userData?.fcmToken,
      };
    } catch (error) {
      return {
        id: doc.id,
        name: 'Unknown',
        image: null,
        lastMessage: chat.lastMessage || '',
        lastMessageTimestamp: chat.lastMessageTimestamp,
        receiverId: '',
        fcmToken: null,
      };
    }
  };

  // Time Format
  const formatTimestamp = (timestamp: any) => {
    const time = moment(timestamp.toDate());
    const now = moment();
    if (time.isSame(now, 'day')) {
      return time.format('h:mm A'); // Today
    } else if (time.isSame(now.clone().subtract(1, 'day'), 'day')) {
      return 'Yesterday';
    } else {
      return time.format('DD/MM/YYYY'); // Older
    }
  };

  const [senderName, setSenderName] = useState('');

  async function fetchCurrentUserName() {
    const user = auth().currentUser;
    if (!user) {
      console.log('No user is signed in');
      return null;
    }
    const userId = user.uid;
    try {
      const userDoc = await firestore().collection('Users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const userName = userData?.name || null;
        setSenderName(userName);
      }
    } catch (error) {
      console.log('Error fetching user data:', error);
      return null;
    }
  }

  fetchCurrentUserName();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <HeaderBack title="Messages" textStyle={styles.headerText} logo />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{paddingBottom: RFPercentage(15)}}
        style={{flex: 1}}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity activeOpacity={0.8} onPress={toggle1}>
              <View
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: all ? Colors.gradient1 : 'transparent',
                    borderColor: all ? 'transparent' : Colors.inputFieldColor,
                  },
                ]}>
                <Text
                  style={[
                    styles.toggleText,
                    {
                      color: all ? Colors.background : Colors.placeholderColor,
                      fontFamily: all ? Fonts.fontMedium : Fonts.fontRegular,
                    },
                  ]}>
                  All
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={toggle2}
              style={styles.unreadButton}>
              <View
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: unread ? Colors.gradient1 : 'transparent',
                    borderColor: unread
                      ? 'transparent'
                      : Colors.inputFieldColor,
                  },
                ]}>
                <Text
                  style={[
                    styles.toggleText,
                    {
                      color: unread
                        ? Colors.background
                        : Colors.placeholderColor,
                      fontFamily: unread ? Fonts.fontMedium : Fonts.fontRegular,
                    },
                  ]}>
                  Unread
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {loading2 ? (
            <>
              {/* Skeleton */}
              <View style={{marginTop: RFPercentage(4)}}>
                {[...Array(7)].map((_, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: RFPercentage(2),
                    }}>
                    <Skeleton
                      animation="wave"
                      circle
                      width={50}
                      height={50}
                      style={{
                        marginRight: RFPercentage(2),
                        backgroundColor: 'rgb(223, 231, 242)',
                      }}
                    />
                    <View style={{flex: 1}}>
                      <Skeleton
                        animation="wave"
                        width="90%"
                        height={15}
                        style={{
                          marginBottom: 6,
                          backgroundColor: 'rgb(223, 231, 242)',
                        }}
                      />
                      <Skeleton
                        width="60%"
                        height={12}
                        style={{backgroundColor: 'rgb(223, 231, 242)'}}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              {/* Chats */}
              {chats.length > 0 ? (
                <FlatList
                  contentContainerStyle={{
                    paddingTop: RFPercentage(2.5),
                    paddingBottom: RFPercentage(8),
                  }}
                  data={chats}
                  keyExtractor={item => item.id}
                  renderItem={({item}) => {
                    return (
                      <Message
                        name={item.name}
                        unread={
                          item?.lastMessage?.unread &&
                          userId === item?.lastMessage?.receiver
                        }
                        message={item.lastMessage?.text || 'No message'}
                        image={item.image}
                        noProfile={IMAGES.defaultPic}
                        time={
                          item.lastMessageTimestamp
                            ? formatTimestamp(item.lastMessageTimestamp)
                            : ''
                        }
                        onPress={() =>
                          navigation.navigate('Chat', {
                            chatId: item.lastMessage?.chatId,
                            senderId: userId,
                            senderName: senderName,
                            receiver: item.receiverId,
                            receiverName: item.name,
                            receiverProfile: item.image,
                            fcmToken: item.fcmToken,
                          })
                        }
                      />
                    );
                  }}
                />
              ) : (
                // Not found
                <View style={{marginTop: RFPercentage(10)}}>
                  <NotFound text="No chats found" />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    width: '90%',
    alignSelf: 'center',
    paddingTop: RFPercentage(4),
    flex: 1,
  },
  headerText: {
    fontSize: RFPercentage(2),
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    width: RFPercentage(14),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  toggleText: {
    fontSize: RFPercentage(1.8),
  },
  unreadButton: {
    left: RFPercentage(2),
  },
  messageList: {
    marginTop: RFPercentage(2),
    marginBottom: RFPercentage(5),
  },
  noServiceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: RFPercentage(20),
  },
  noServiceImg: {
    width: RFPercentage(10),
    height: RFPercentage(10),
  },
  noServiceText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
    textAlign: 'center',
    marginTop: RFPercentage(1),
  },
});

export default Messages;
