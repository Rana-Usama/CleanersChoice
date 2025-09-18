import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Keyboard,
  StatusBar,
  ImageBackground,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {GiftedChat, InputToolbar, Bubble} from 'react-native-gifted-chat';
import firestore from '@react-native-firebase/firestore';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES} from '../../../constants/Themes';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import {useFocusEffect} from '@react-navigation/native';

const Chat = ({navigation, route}: any) => {
  const [messages, setMessages] = useState<
    {id: string; text: string; sender: string; timestamp: number}[]
  >([]);
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

  // Fetch chats
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

  // Send Message
  const onSend = useCallback(
    async (messagesToSend = []) => {
      const message = messagesToSend[0];
      if (!message.text || message.text.trim() === '') {
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
      setMessage('');
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
      } catch (e) {}
    },
    [chatId, senderId, senderName, receiver],
  );

  // Mark message as read
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
        } catch (error) {}
      };

      markLastMessageAsRead();
    }, [chatId, senderId]),
  );

  // Push Notifications
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
      } else {
      }
    } catch (err) {}
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.screen}>
        <StatusBar
          barStyle={'dark-content'}
          translucent
          backgroundColor="transparent"
        />
        <View style={styles.profileContainer}>
          <View style={styles.inner}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}>
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

            <Text style={styles.receiverName}>
              {receiverName?.length > 20
                ? `${receiverName.slice(0, 20)}...`
                : receiverName}
            </Text>
          </View>
        </View>
        <View style={styles.messageContainer}>
          <ImageBackground
            source={IMAGES.chat}
            resizeMode="cover"
            style={{flex: 1}}>
            <GiftedChat
              messages={messages}
              onSend={messages => onSend(messages)}
              user={{
                _id: senderId,
                name: senderName,
                avatar: senderProfile,
              }}
              showAvatarForEveryMessage={true}
              renderBubble={props => (
                <Bubble
                  {...props}
                  wrapperStyle={{
                    left: {
                      backgroundColor: 'rgba(232, 235, 238, 1)',
                      padding: RFPercentage(0.6),
                    },
                    right: {
                      backgroundColor: 'rgba(115, 162, 199, 1)',
                      padding: RFPercentage(0.6),
                    },
                  }}
                  textStyle={{
                    left: {
                      color: Colors.inputTextColor,
                      fontFamily: Fonts.fontRegular,
                      fontSize: RFPercentage(1.8),
                    },
                    right: {
                      color: Colors.background,
                      fontFamily: Fonts.fontRegular,
                      fontSize: RFPercentage(1.8),
                    },
                  }}
                />
              )}
              renderInputToolbar={props => (
                <View
                  style={{
                    backgroundColor: 'rgba(248, 248, 248, 1)',
                    width: '100%',
                    minHeight: RFPercentage(10),
                    justifyContent: 'center',
                    maxHeight: RFPercentage(18),
                    paddingVertical: RFPercentage(2),
                  }}>
                  <InputToolbar
                    {...props}
                    containerStyle={styles.toolbar}
                    renderComposer={() => (
                      <TextInput
                        style={styles.customTextInput}
                        placeholder="Type a message"
                        placeholderTextColor={'rgba(178, 177, 177, 1)'}
                        value={message}
                        onChangeText={setMessage}
                        multiline={true}
                        scrollEnabled={true}
                        textAlignVertical="top"
                      />
                    )}
                    renderSend={() => (
                      <TouchableOpacity
                        activeOpacity={0.8}
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
                        }}>
                        <Feather
                          name="send"
                          size={RFPercentage(2.5)}
                          color={'rgba(135, 133, 133, 1)'}
                        />
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
              renderAvatar={props => {
                const isReceiver = props.currentMessage.user._id !== senderId;
                if (!isReceiver) return null;
                return receiverProfile ? (
                  <Image
                    source={{uri: receiverProfile}}
                    style={{
                      width: RFPercentage(4.5),
                      height: RFPercentage(4.5),
                      borderRadius: RFPercentage(50),
                      borderWidth: 1,
                      borderColor: Colors.primaryText,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: RFPercentage(5),
                      height: RFPercentage(5),
                      borderRadius: RFPercentage(50),
                      backgroundColor: 'rgba(208, 209, 211, 1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(188, 189, 191, 1)',
                    }}>
                    <Text
                      style={{
                        color: Colors.primaryText,
                        fontSize: RFPercentage(1.8),
                        fontFamily: 'Poppins_600SemiBold',
                      }}>
                      {receiverName?.[0] || '?'}
                    </Text>
                  </View>
                );
              }}
            />
          </ImageBackground>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messageContainer: {
    flex: 1,
    width: '100%',
    paddingTop: RFPercentage(1),
    // paddingHorizontal: RFPercentage(2),
  },
  loadMessages: {
    backgroundColor: Colors.gradient1,
    padding: RFPercentage(1.3),
    borderRadius: RFPercentage(100),
    alignSelf: 'center',
    marginBottom: 10,
    paddingHorizontal: RFPercentage(2.6),
  },
  customTextInput: {
    color: Colors.white,
    fontSize: RFPercentage(1.8),
    fontFamily: 'Poppins_400Regular',
    width: '90%',
    marginVertical: 0,
    paddingVertical: 0,
    justifyContent: 'center',
    textAlignVertical: 'top',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(100),
    position: 'absolute',
    right: RFPercentage(-1),
    top: RFPercentage(-1),
  },

  noProfileContainer: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    marginLeft: RFPercentage(2),
    borderWidth: RFPercentage(0.2),
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
    paddingHorizontal: RFPercentage(2),
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
  },
  receiverName: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
    marginLeft: RFPercentage(2),
  },
  toolbar: {
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(3),
    // minHeight: RFPercentage(5.5),
    maxHeight: RFPercentage(18),
    justifyContent: 'center',
    padding: RFPercentage(1.7),
    borderTopWidth: RFPercentage(0.1),
    alignSelf: 'center',
    width: '90%',
    backgroundColor: 'rgba(234, 232, 232, 0.5)',
    borderColor: 'rgba(234, 232, 232, 0.9)',
    borderTopColor: 'rgba(234, 232, 232, 0.9)',
  },
});

export default Chat;
