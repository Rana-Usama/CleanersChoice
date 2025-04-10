import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useEffect, useCallback} from 'react';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import HeaderBack from '../../../components/HeaderBack';
import {Colors, Fonts, Icons, IMAGES} from '../../../constants/Themes';
import Message from '../../../components/Message';
import moment from 'moment';
import {RootStackParamList} from '../../../routers/StackNavigator';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

const Messages = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Messages'>>();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const pageSize = 10;
  const [loading2, setLoading2] = useState(false);
  const [all, setAll] = useState(true);
  const [unread, setUnread] = useState(false);

  const user = auth().currentUser;
  const userId = user?.uid;

  const toggle1 = () => {
    setAll(true);
    setUnread(false);
  };
  const toggle2 = () => {
    setAll(false);
    setUnread(true);
  };

  useFocusEffect(
    useCallback(() => {
      let unsubscribe;
      setLoading2(true);
      if (userId) {
        let query = firestore()
          .collection('Chats')
          .where('participants', 'array-contains', userId)
          .orderBy('lastMessageTimestamp', 'desc');

        unsubscribe = query.onSnapshot(
          async snapshot => {
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

              console.log('all chats..................', filteredChats);

              setChats(filteredChats);
              setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            } catch (error) {
              // console.log('Error processing chat snapshot:', error);
            } finally {
              setLoading2(false);
            }
          },
          error => {
            // console.log('Error fetching chats in real-time: ', error);
            setLoading2(false);
          },
        );
      } else {
        setLoading2(false);
      }

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, [userId, unread]),
  );

  const fetchMoreChats = async () => {
    if (!lastVisible || loading) return;
    setLoading(true);
    try {
      const snapshot = await firestore()
        .collection('Chats')
        .where('participants', 'array-contains', userId)
        .orderBy('lastMessageTimestamp', 'desc')
        .startAfter(lastVisible)
        .limit(pageSize)
        .get();

      const newChatData = await Promise.all(
        snapshot.docs.map(async doc => await getChatData(doc)),
      );

      setChats(prev => [...prev, ...newChatData]);

      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (e) {
      // console.log('Chat Error: ', e);
    } finally {
      setLoading(false);
    }
  };

  const getChatData = async doc => {
    const chat = doc.data();
    const otherUser = chat.participants.find(p => p !== userId);

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
      };
    } catch (error) {
      // console.log('Error fetching user data: ', error);
      return {
        id: doc.id,
        name: 'Unknown',
        image: null,
        lastMessage: chat.lastMessage || '',
        lastMessageTimestamp: chat.lastMessageTimestamp,
        receiverId: '',
      };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <HeaderBack title="Messages" textStyle={styles.headerText} />
        <View style={styles.container}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity onPress={toggle1}>
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
            <TouchableOpacity onPress={toggle2} style={styles.unreadButton}>
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
              <ActivityIndicator
                size={'large'}
                color={Colors.placeholderColor}
                style={{marginTop: RFPercentage(20)}}
              />
            </>
          ) : (
            <>
              {chats.length > 0 ? (
                <View style={{marginTop: RFPercentage(2)}}>
                  <FlatList
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
                              ? moment(
                                  item.lastMessageTimestamp.toDate(),
                                ).format('h:mm A')
                              : ''
                          }
                          onPress={() =>
                            navigation.navigate('Chat', {
                              chatId: item.lastMessage?.chatId,
                              senderId: userId,
                              senderName: item.lastMessage?.senderName,
                              receiver: item.receiverId,
                              receiverName: item.name,
                              receiverProfile: item.image,
                            })
                          }
                        />
                      );
                    }}
                    onEndReached={fetchMoreChats}
                    onEndReachedThreshold={0.5}
                    // ListFooterComponent={loading && <Text>Loading...</Text>}
                  />
                </View>
              ) : (
                <View style={styles.noServiceContainer}>
                  <Image
                    source={Icons.empty}
                    resizeMode="contain"
                    style={styles.noServiceImg}
                  />
                  <Text style={styles.noServiceText}>No chat found</Text>
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
  },
  headerText: {
    fontSize: RFPercentage(1.8),
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    width: RFPercentage(12),
    height: RFPercentage(4),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  toggleText: {
    fontSize: RFPercentage(1.5),
  },
  unreadButton: {
    left: RFPercentage(2.8),
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
