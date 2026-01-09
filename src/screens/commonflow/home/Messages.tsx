import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import React, {useState, useEffect, useCallback, useRef} from 'react';
import firestore from '@react-native-firebase/firestore';
import {RFPercentage} from 'react-native-responsive-fontsize';
import HeaderBack from '../../../components/HeaderBack';
import {Colors, Fonts, IMAGES} from '../../../constants/Themes';
import Message from '../../../components/Message';
import moment from 'moment';
import {useFocusEffect} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import NotFound from '../../../components/NotFound';
import {useExitAppOnBack} from '../../../utils/ExitApp';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Messages = ({navigation}: any) => {
  const [chats, setChats] = useState<
    {
      id: any;
      name: any;
      image: any;
      lastMessage: any;
      lastMessageTimestamp: any;
      receiverId: any;
      fcmToken: any;
    }[]
  >([]);

  useExitAppOnBack();

  const [loading2, setLoading2] = useState(false);
  const [all, setAll] = useState(true);
  const [unread, setUnread] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [senderName, setSenderName] = useState('');
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Animation for filter toggle
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

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
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
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
          } catch (error) {
            console.error('Error in snapshot:', error);
          }
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

  const unreadCount = chats.filter(
    chat => chat.lastMessage?.unread && userId === chat.lastMessage?.receiver,
  ).length;

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent={true}
      />

      {/* Modern Header */}
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <HeaderBack
          title="Messages"
          textStyle={styles.headerText}
          left={true}
          arrowColor="#FFFFFF"
          style={{backgroundColor: 'transparent'}}
          logo
          tintColor={'white'}
        />
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gradient1}
          />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Filter Section */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>Conversations</Text>
          <Text style={styles.sectionSubtitle}>
            Manage your messages and chats
          </Text>

          <View style={styles.filtersContainer}>
            <Animated.View style={{transform: [{scale: scaleAnim}]}}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={toggle1}
                style={[styles.filterButton, all && styles.filterButtonActive]}>
                <LinearGradient
                  colors={
                    all
                      ? [Colors.gradient1, Colors.gradient2]
                      : ['#FFFFFF', '#dae2f6ff']
                  }
                  style={styles.filterGradient}>
                  <Text
                    style={[
                      styles.filterButtonText,
                      all && styles.filterButtonTextActive,
                    ]}>
                    All Messages
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{transform: [{scale: scaleAnim}]}}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={toggle2}
                style={[
                  styles.filterButton,
                  unread && styles.filterButtonActive,
                ]}>
                <LinearGradient
                  colors={
                    unread
                      ? [Colors.gradient1, Colors.gradient2]
                      : ['#FFFFFF', '#dae2f6ff']
                  }
                  style={styles.filterGradient}>
                  <Text
                    style={[
                      styles.filterButtonText,
                      unread && styles.filterButtonTextActive,
                    ]}>
                    Unread Only
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Active Filter Info */}
          <View style={styles.activeFilterCard}>
            <View style={styles.activeFilterContent}>
              <MaterialIcons name="info" size={20} color={Colors.gradient1} />
              <Text style={styles.activeFilterText}>
                {unread
                  ? `Showing ${unreadCount} unread conversation${
                      unreadCount !== 1 ? 's' : ''
                    }`
                  : `Showing all conversations (${chats.length})`}
              </Text>
            </View>
          </View>
        </View>

        {/* Messages Section */}
        <View style={styles.messagesSection}>
          <View style={styles.messagesHeader}>
            <Text style={styles.messagesTitle}>
              {unread ? 'Unread Messages' : 'All Conversations'}
            </Text>
            <Text style={styles.messagesCount}>
              {chats.length} chat{chats.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {loading2 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.gradient1} />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : chats.length === 0 ? (
            <View style={styles.noMessagesContainer}>
              <NotFound
                // icon="chatbubble-outline"
                text={
                  unread
                    ? 'No unread messages\nStart a new conversation'
                    : 'No conversations yet\nStart chatting with clients'
                }
              />
            </View>
          ) : (
            <View style={styles.messagesList}>
              <FlatList
                scrollEnabled={false}
                data={chats}
                keyExtractor={item => item.id}
                renderItem={({item}) => {
                  const isUnread =
                    item.lastMessage?.unread &&
                    userId === item.lastMessage?.receiver;

                  return (
                    <Message
                      name={item.name}
                      unread={isUnread}
                      message={item.lastMessage?.text || 'No message yet'}
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
                          fcmToken: item?.fcmToken,
                        })
                      }
                      // customStyle={[
                      //   styles.messageCard,
                      //   isUnread && styles.unreadMessageCard,
                      // ]}
                    />
                  );
                }}
                contentContainerStyle={styles.messagesListContent}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: RFPercentage(2),
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
  unreadBadge: {
    backgroundColor: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    right: 30,
    top: 5,
  },
  unreadBadgeText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  filtersSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: RFPercentage(2),
    fontFamily: Fonts.semiBold,
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: '#6B7280',
    marginBottom: 20,
  },
  filtersContainer: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  filterButtonActive: {
    shadowColor: Colors.gradient1,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  filterGradient: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  filterIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(224, 234, 253, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterButtonText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: '#374151',
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  activeFilterCard: {
    marginTop: 16,
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    padding: 16,
  },
  activeFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeFilterText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    color: '#4B5563',
    flex: 1,
  },
  messagesSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  messagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  messagesTitle: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
    color: '#1F2937',
  },
  messagesCount: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    color: Colors.gradient1,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: '#6B7280',
  },
  noMessagesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    bottom: 50,
  },
  startChatButton: {
    marginTop: 24,
    borderRadius: 100,
    overflow: 'hidden',
    width: '50%',
  },
  startChatGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startChatText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
  messagesList: {
    marginTop: 8,
  },
  messagesListContent: {
    paddingBottom: 16,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  unreadMessageCard: {
    backgroundColor: '#F8FAFF',
    borderColor: Colors.gradient1 + '20',
    shadowColor: Colors.gradient1,
    shadowOpacity: 0.1,
  },
  newMessageButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: Colors.gradient1,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  newMessageGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minWidth: 180,
  },
  newMessageText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
});

export default Messages;
