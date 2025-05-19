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
  StatusBar,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {GiftedChat, InputToolbar, Bubble} from 'react-native-gifted-chat';
import firestore from '@react-native-firebase/firestore';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES} from '../../../constants/Themes';
import AntDesign from 'react-native-vector-icons/AntDesign';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import {useFocusEffect} from '@react-navigation/native';
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';

const Chat = ({navigation, route}: any) => {
  const [messages, setMessages] = useState<
    {id: string; text: string; sender: string; timestamp: number}[]
  >([]);
  const [lastVisible, setLastVisible] =
    useState<FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData> | null>(
      null,
    );
  const {
    chatId,
    senderId,
    senderName,
    receiver,
    receiverName,
    receiverProfile,
    senderProfile,
    fcmToken,
  } = route.params;

  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Chats')
      .doc(chatId)
      .collection('Messages')
      .orderBy('timestamp', 'desc')
      .onSnapshot(snapshot => {
        const newMessages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            _id: doc.id,
            text: data.text,
            createdAt: data.timestamp?.toDate() || new Date(),
            user: {
              _id: data.senderId,
              name: data.senderName,
            },
          };
        });

        setMessages(GiftedChat.append([], newMessages).filter(Boolean));
      });

    return () => unsubscribe();
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
    async (messagesToSend = []) => {
      const message = messagesToSend[0];
      if (!message.text || message.text.trim() === '') {
        console.log('Message text is empty!');
        return;
      }

      const timestamp = firestore.FieldValue.serverTimestamp();
      const localTimestamp = new Date(); // For UI until server timestamp comes back

      const newMessage = {
        _id: `${Date.now()}`, // temp unique id for UI
        text: message.text,
        createdAt: localTimestamp,
        user: {
          _id: senderId,
          name: senderName,
          avatar: senderProfile,
        },
      };

      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [newMessage]),
      );

      const firestoreMessage = {
        text: message.text,
        timestamp,
        senderId,
        senderName,
        unread: true,
        chatId,
        receiver,
      };

      try {
        const chatRef = firestore().collection('Chats').doc(chatId);
        await chatRef.collection('Messages').add(firestoreMessage);
        const participants = [senderId, receiver];

        await chatRef.set(
          {
            lastMessage: firestoreMessage,
            lastMessageTimestamp: timestamp,
            participants,
          },
          {merge: true},
        );
        await sendPushNotification(message.text);
        setMessage('');
      } catch (e) {
        console.log('Error sending message:', e);
      }
    },
    [chatId, senderId, senderName, receiver],
  );

  useFocusEffect(
    useCallback(() => {
      const markLastMessageAsRead = async () => {
        try {
          const chatRef = firestore().collection('Chats').doc(chatId);
          const chatDoc = await chatRef.get();
          const lastMessage = chatDoc.data()?.lastMessage;
          if (lastMessage?.receiver === senderId && lastMessage?.unread) {
            await chatRef.set(
              {
                lastMessage: {
                  ...lastMessage,
                  unread: false,
                },
              },
              {merge: true},
            );
          }
        } catch (error) {
          console.log('Error marking last message as read:', error);
        }
      };

      markLastMessageAsRead();
    }, [chatId, senderId]),
  );

  console.log(fcmToken);
  const sendPushNotification = async (message: any) => {
    try {
      const response = await fetch(
        'https://cleaners-choice-server.vercel.app/api/send-notification',
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            fcmToken: fcmToken,
            title: senderName,
            body: message,
            data: {screen: 'messages'},
          }),
        },
      );
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        console.log(`Message sent to ${fcmToken}:`, result);
      } else {
        const text = await response.text();
        console.log(`Non-JSON response for ${fcmToken}:`, text);
      }
    } catch (err) {
      console.log(`Error sending to ${fcmToken}:`, err);
    }
  };

  return (
    <LinearGradient
      colors={['rgb(238, 242, 251)', 'rgb(180, 203, 252)']}
      style={styles.screen}>
      <StatusBar
        barStyle={'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <View style={styles.profileContainer}>
        <View style={styles.inner}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign
              name="arrowleft"
              size={RFPercentage(2.5)}
              color={Colors.placeholderColor}
            />
          </TouchableOpacity>
          <View>
            {receiverProfile ? (
              <>
                <Image
                  source={{uri: receiverProfile}}
                  resizeMode="contain"
                  style={styles.profile}
                  borderRadius={RFPercentage(100)}
                />
              </>
            ) : (
              <>
                <View style={styles.noProfileContainer}>
                  <Text style={styles.noProfile}>{receiverName?.[0]}</Text>
                </View>
              </>
            )}
          </View>

          <Text style={styles.receiverName}>{receiverName}</Text>
        </View>
      </View>
      <View style={styles.messageContainer}>
        <GiftedChat
          messages={messages}
          onSend={messages => onSend(messages)}
          user={{
            _id: senderId,
            name: senderName,
            avatar: senderProfile,
          }}
          // loadEarlier={!!lastVisible}
          // onLoadEarlier={fetchMoreMessages}
          showAvatarForEveryMessage={true}
          renderAvatar={props => null}
          // renderLoadEarlier={props => (
          //   <TouchableOpacity
          //     style={styles.loadMessages}
          //     onPress={props.onLoadEarlier}>
          //     <Text
          //       style={{
          //         color: Colors.background,
          //         fontFamily: Fonts.fontMedium,
          //       }}>
          //       Load earlier messages
          //     </Text>
          //   </TouchableOpacity>
          // )}
          renderBubble={props => (
            <Bubble
              {...props}
              wrapperStyle={{
                left: {
                  backgroundColor: Colors.background,
                  padding: RFPercentage(0.6),
                },
                right: {
                  backgroundColor: Colors.gradient1,
                  padding: RFPercentage(0.6),
                },
              }}
              textStyle={{
                left: {
                  color: Colors.inputTextColor,
                  fontFamily: Fonts.fontRegular,
                },
                right: {
                  color: Colors.background,
                  fontFamily: Fonts.fontRegular,
                },
              }}
            />
          )}
          renderInputToolbar={props => (
            <InputToolbar
              {...props}
              containerStyle={styles.toolbar}
              renderComposer={() => (
                <TextInput
                  style={styles.customTextInput}
                  placeholder="Type a message"
                  placeholderTextColor="#bbb"
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
                          avatar: senderProfile,
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
    // flex: 1,
    fontSize: RFPercentage(1.8),
    borderRadius: RFPercentage(10),
    // backgroundColor:'red',
    width: RFPercentage(36),
    fontFamily: Fonts.fontRegular,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(100),
    position: 'absolute',
    right: 0,
    bottom: RFPercentage(0.5),
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noProfileContainer: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    marginLeft: RFPercentage(2),
    borderWidth: 2,
    borderColor: Colors.gradient1,
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 231, 235, 0.3)',
  },
  profileContainer: {
    width: '100%',
    height: RFPercentage(8),
    marginTop: RFPercentage(6),
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgb(190, 193, 199)',
    alignSelf: 'center',
    paddingBottom: RFPercentage(1),
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(0.5),
  },
  profile: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    marginLeft: RFPercentage(2),
    borderWidth: 2,
    borderColor: Colors.gradient1,
  },
  noProfile: {
    color: Colors.gradient1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2),
    top: RFPercentage(0.2),
  },
  receiverName: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
    marginLeft: RFPercentage(2),
  },
  toolbar: {
    backgroundColor: Colors.buttonColor,
    borderWidth: 1,
    borderColor: Colors.gradient2,
    borderRadius: RFPercentage(6),
    height: RFPercentage(6),
    justifyContent: 'center',
    paddingHorizontal: RFPercentage(1.5),
    // bottom: keyboardVisible ? RFPercentage(25) : 0,
  },
});

export default Chat;
