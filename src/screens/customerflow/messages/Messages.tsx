import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {RFPercentage} from 'react-native-responsive-fontsize';
import HeaderBack from '../../../components/HeaderBack';
import {Colors, Fonts, Icons} from '../../../constants/Themes';
import Message from '../../../components/Message';

const Messages = () => {
  const userId = useSelector(state => state.profile.profileData.uid);
  const navigation = useNavigation();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const pageSize = 10;


  console.log('chats...........', chats)

  const [all, setAll] = useState(true);
  const [unread, setUnread] = useState(false);

  const toggle1 = () => {
    setAll(true);
    setUnread(false);
  };
  const toggle2 = () => {
    setAll(false);
    setUnread(true);
  };

  useEffect(() => {
    if (userId) {
      const unsubscribe = firestore()
        .collection('chats')
        .where('participants', 'array-contains', userId) 
        .onSnapshot(
          snapshot => {
            const chatData = [];
            snapshot.docs.forEach(doc => {
              const data = getChatData(doc);
              chatData.push(data);
            });
  
            setChats(chatData); 
          },
          error => {
            console.log("Error fetching chats in real-time: ", error);
          }
        );
  
      return () => unsubscribe(); 
    }
  }, [userId]);
  
  
  const fetchMoreChats = async () => {
    if (!lastVisible) return;
    setLoading(true);
  
    try {
      const snapshot = await firestore()
        .collection('chats')
        .where('participants', 'array-contains', userId)
        .orderBy('lastMessageTimestamp', 'desc')
        .startAfter(lastVisible)
        .limit(pageSize)
        .get();
  
      const chatData = [];
      for (const doc of snapshot.docs) {
        const data = await getChatData(doc);
        chatData.push(data);
      }
  
      setChats(prevChats => [...prevChats, ...chatData]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    } catch (e) {
      console.log('Chat Error: ', e);
    } finally {
      setLoading(false);
    }
  };
  

  const getChatData = async doc => {
    const chat = doc.data();
    const otherUser = chat.participants.find(p => p !== userId);
    const userDoc = await firestore().collection('users').doc(otherUser).get();
    const userData = userDoc.data();
    return {
      id: doc.id,
      name: userData?.userName,
      image: userData?.profileImage,
      lastMessage: chat.lastMessage,
    };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <HeaderBack title="Messages" textStyle={styles.headerText} />
        <View style={styles.container}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity onPress={toggle1}>
              <View
                style={[styles.toggleButton, {
                  backgroundColor: all ? Colors.gradient1 : 'transparent',
                  borderColor: all ? 'transparent' : Colors.inputFieldColor,
                }]}>
                <Text style={[styles.toggleText, {
                  color: all ? Colors.background : Colors.placeholderColor,
                  fontFamily: all ? Fonts.fontMedium : Fonts.fontRegular,
                }]}>
                  All
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggle2} style={styles.unreadButton}>
              <View
                style={[styles.toggleButton, {
                  backgroundColor: unread ? Colors.gradient1 : 'transparent',
                  borderColor: unread ? 'transparent' : Colors.inputFieldColor,
                }]}>
                <Text style={[styles.toggleText, {
                  color: unread ? Colors.background : Colors.placeholderColor,
                  fontFamily: unread ? Fonts.fontMedium : Fonts.fontRegular,
                }]}>
                  Unread
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {chats.length > 0 ? (
            <FlatList
              data={chats}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <Message
                  name={item.name}
                  message={item.lastMessage}
                  image={item.image}
                />
              )}
              onEndReached={fetchMoreChats}
              onEndReachedThreshold={0.5}
              ListFooterComponent={loading && <Text>Loading...</Text>}
            />
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
    paddingTop: RFPercentage(3),
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
