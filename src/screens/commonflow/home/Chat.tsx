import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Keyboard,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {GiftedChat, InputToolbar} from 'react-native-gifted-chat';
import firestore from '@react-native-firebase/firestore';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../constants/Themes';
import AntDesign from 'react-native-vector-icons/AntDesign';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

const Chat = ({navigation, route}) => {
  const [messages, setMessages] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const {
    chatId,
    senderId,
    senderName,
    receiver,
    receiverName,
    receiverProfile,
  } = route.params;

  const [message, setMessage] = useState('');

  useEffect(() => {
    const listenForNewMessages = () => {
      const q = firestore()
        .collection('Chats')
        .doc(chatId)
        .collection('Messages')
        .orderBy('createdAt', 'desc');

      const unsubscribe = q.onSnapshot(snapshot => {
        if (snapshot.empty) {
          console.log('No new messages.');
          return;
        }

        const newMessages = snapshot.docs.map(doc => {
          const firebaseMessage = doc.data();
          return {
            _id: doc.id,
            text: firebaseMessage.text,
            createdAt: firebaseMessage.createdAt
              ? firebaseMessage.createdAt.toDate()
              : new Date(),
            user: {
              _id: firebaseMessage.senderId,
              name: firebaseMessage.senderName,
            },
          };
        });

        console.log('New Messages:', newMessages);

        if (newMessages.length > 0) {
          setMessages(prevMessages => {
            const updatedMessages = GiftedChat.append(
              newMessages,
              prevMessages,
            );
            console.log('Updated Messages:', updatedMessages);
            return updatedMessages;
          });
        }
      });

      return unsubscribe;
    };

    if (chatId) {
      return listenForNewMessages();
    }
  }, [chatId]);

  useEffect(() => {
    const fetchInitialMessages = async () => {
      const q = firestore()
        .collection('Chats')
        .doc(chatId)
        .collection('Messages')
        .orderBy('timestamp', 'desc')
        .limit(100);

      const snapshot = await q.get();
      const initialMessages = snapshot.docs.map(doc => {
        const firebaseMessage = doc.data();
        return {
          _id: doc.id,
          text: firebaseMessage.text,
          createdAt: firebaseMessage.timestamp.toDate(),
          user: {
            _id: firebaseMessage.senderId,
            name: firebaseMessage.senderName,
          },
        };
      });
      console.log('INITIAL CHAT', initialMessages);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setMessages(prevMessages => {
        const messagesMap = new Map();
        prevMessages.forEach(msg => messagesMap.set(msg._id, msg));
        initialMessages.forEach(msg => messagesMap.set(msg._id, msg));
        console.log(
          Array.from(messagesMap.values()).sort(
            (a, b) => b.createdAt - a.createdAt,
          ),
        );
        return GiftedChat.append(
          Array.from(messagesMap.values()).sort(
            (a, b) => b.createdAt - a.createdAt,
          ),
        ).filter(Boolean);
      });
    };
    fetchInitialMessages();
  }, [chatId]);

  const fetchMoreMessages = async () => {
    if (!lastVisible) return;
    const q = firestore()
      .collection('Chats')
      .doc(chatId)
      .collection('Messages')
      .orderBy('timestamp', 'desc')
      .startAfter(lastVisible)
      .limit(100);

    const snapshot = await q.get();
    const newMessages = snapshot.docs.map(doc => {
      const firebaseMessage = doc.data();
      return {
        _id: doc.id,
        text: firebaseMessage.text,
        createdAt: firebaseMessage.timestamp.toDate(),
        user: {
          _id: firebaseMessage.senderId,
          name: firebaseMessage.senderName,
        },
      };
    });

    setMessages(prevMessages => {
      const messagesMap = new Map();
      prevMessages.forEach(msg => messagesMap.set(msg._id, msg));
      newMessages.forEach(msg => messagesMap.set(msg._id, msg));
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      return GiftedChat.append(
        Array.from(messagesMap.values()).sort(
          (a, b) => b.createdAt - a.createdAt,
        ),
      ).filter(Boolean);
    });
  };

  const onSend = useCallback(
    async (messages = []) => {
      const message = messages[0];
      if (!message.text || message.text.trim() === '') {
        console.log('Message text is empty!');
        return;
      }
      const timestamp = firestore.FieldValue.serverTimestamp();
      const newMessage = {
        text: message.text,
        timestamp,
        senderId: senderId,
        senderName: senderName,
        unread: true,
        chatId: chatId,
      };

      try {
        const chatRef = firestore().collection('Chats').doc(chatId);
        await chatRef.collection('Messages').add(newMessage);
        const participants = [senderId, receiver];

        await chatRef.set(
          {
            lastMessage: newMessage,
            lastMessageTimestamp: timestamp,
            participants: participants,
          },
          {merge: true},
        );
        setMessage('');
      } catch (e) {
        console.log('Error sending message:', e);
      }
    },
    [chatId, senderId, senderName, receiver],
  );

  const markMessagesAsRead = async (chatId, receiverId) => {
    try {
      const messagesRef = firestore()
        .collection('Chats')
        .doc(chatId)
        .collection('Messages');

      const snapshot = await messagesRef
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const lastMessageDoc = snapshot.docs[0];
        const lastMessage = lastMessageDoc.data();

        console.log('lastMessage........', lastMessage);
        console.log('lastMessage........', receiverId);

        if (lastMessage.senderId !== receiverId && lastMessage.unread) {
          await lastMessageDoc.ref.update({unread: false});
          console.log('Last message marked as read');
        }
      }
    } catch (e) {
      console.log('Error marking last message as read:', e);
    }
  };

  useEffect(() => {
    if (chatId && receiver) {
      markMessagesAsRead(chatId, receiver);
    }
  }, [chatId, receiver]);

  const insets = useSafeAreaInsets();

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  console.log('messages........', messages);

  

 
  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={
        Platform.OS === 'ios' ? RFPercentage(7.9) : RFPercentage(-25)
      }>
      <LinearGradient
        colors={['rgb(238, 243, 255)', 'rgb(170, 197, 255)']}
        style={styles.screen}>
        <View
          style={{
            width: '100%',
            height: RFPercentage(8),
            marginTop: RFPercentage(3),
            justifyContent: 'center',
            borderBottomWidth: 1,
            borderBottomColor: 'rgb(190, 193, 199)',
            alignSelf: 'center',
            paddingBottom: RFPercentage(1.5),
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: RFPercentage(0.5),
            }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <AntDesign
                name="arrowleft"
                size={RFPercentage(2.5)}
                color={Colors.placeholderColor}
              />
            </TouchableOpacity>
            <Image
              source={{uri: receiverProfile ? receiverProfile : null}}
              resizeMode="contain"
              style={{
                width: RFPercentage(6),
                height: RFPercentage(6),
                marginLeft: RFPercentage(2),
                borderWidth: 2,
                borderColor: Colors.gradient1,
              }}
              borderRadius={RFPercentage(100)}
            />
            <Text
              style={{
                color: Colors.primaryText,
                fontFamily: Fonts.fontMedium,
                fontSize: RFPercentage(1.7),
                marginLeft: RFPercentage(2),
              }}>
              {receiverName}
            </Text>
          </View>
        </View>
        <View style={styles.messageContainer}>
          <GiftedChat
            key={messages.length}
            messages={messages}
            onSend={messages => onSend(messages)}
            user={{
              _id: senderId,
              name: senderName,
            }}
            loadEarlier={!!lastVisible}
            onLoadEarlier={fetchMoreMessages}
            bottomOffset={insets.bottom}
            renderLoadEarlier={props => (
              <TouchableOpacity
                style={styles.loadMessages}
                onPress={props.onLoadEarlier}>
                <Text style={{color: Colors.background, fontWeight: 'bold'}}>
                  Load earlier messages
                </Text>
              </TouchableOpacity>
            )}
            renderInputToolbar={props => (
              <InputToolbar
                {...props}
                containerStyle={{
                  backgroundColor: Colors.buttonColor,
                  borderWidth: 1,
                  borderColor: Colors.gradient2,
                  borderRadius: RFPercentage(6),
                  height: RFPercentage(6),
                  justifyContent: 'center',
                  paddingHorizontal: RFPercentage(1.5),
                  top: keyboardVisible ? RFPercentage(7) : 0,
                }}
                renderComposer={() => (
                  <TextInput
                    style={styles.customTextInput}
                    placeholder="Type a message"
                    placeholderTextColor="#bbb"
                    multiline
                    value={message}
                    onChangeText={setMessage}
                  />
                )}
                renderSend={() => (
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={() => {
                      onSend([
                        {
                          text: message,
                          user: {
                            _id: senderId,
                            name: senderName,
                          },
                          createdAt: new Date(),
                        },
                      ]);
                      Keyboard.dismiss();
                    }}>
                    <Feather
                      name="send"
                      size={RFPercentage(2.3)}
                      color={Colors.gradient2}
                    />
                  </TouchableOpacity>
                )}
              />
            )}
          />
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingLeft: RFPercentage(1),
    paddingRight: RFPercentage(1),
    // backgroundColor: Colors.gradient2,
  },
  messageContainer: {
    flex: 1,
    width: '100%',
    marginBottom: RFPercentage(1),
    borderRadius: RFPercentage(1),
    paddingTop: RFPercentage(1),
  },
  loadMessages: {
    backgroundColor: Colors.gradient1,
    padding: RFPercentage(1.3),
    borderRadius: RFPercentage(100),
    alignSelf: 'center',
    marginBottom: 10,
    paddingHorizontal: RFPercentage(2.6),
  },
  customInputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    marginHorizontal: 10,
  },
  customTextInput: {
    flex: 1,
    fontSize: RFPercentage(1.8),
    borderRadius: RFPercentage(10),
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(100),
    position: 'absolute',
    right: 0,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Chat;
