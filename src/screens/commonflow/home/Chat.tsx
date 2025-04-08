import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { GiftedChat } from "react-native-gifted-chat";
import  firestore from '@react-native-firebase/firestore';
import { RFPercentage } from "react-native-responsive-fontsize";
import { Colors, Fonts } from "../../../constants/Themes";
import AntDesign from 'react-native-vector-icons/AntDesign'


const Chat = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const { chatId, senderId, senderName, receiver, receiverName, receiverProfile } = route.params;
  console.log({ chatId, senderId, senderName, receiver });

  useEffect(() => {
    const listenForNewMessages = () => {
      const q = firestore()
        .collection(`chats/${chatId}/messages`)
        .orderBy("createdAt", "desc");
      const unsubscribe = q.onSnapshot((snapshot) => {
        const newMessages = snapshot.docs.map((doc) => {
          const firebaseMessage = doc.data();
          return {
            _id: doc.id,
            text: firebaseMessage.text,
            createdAt: firebaseMessage.createdAt ? firebaseMessage.createdAt.toDate() : new Date(),
            user: {
              _id: firebaseMessage.senderId,
              name: firebaseMessage.senderName,
            },
          };
        });

        console.log(newMessages);
        setMessages((prevMessages) => {
          const updatedMessages = GiftedChat.append(newMessages, prevMessages); 
          console.log(updatedMessages);
          return updatedMessages;
        });
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
        .collection(`chats/${chatId}/messages`)
        .orderBy("timestamp", "desc")
        .limit(100);

      const snapshot = await q.get();
      const initialMessages = snapshot.docs.map((doc) => {
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
      console.log("INITIAL CHAT", initialMessages);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]); 
      setMessages((prevMessages) => {
        const messagesMap = new Map();
        prevMessages.forEach((msg) => messagesMap.set(msg._id, msg));
        initialMessages.forEach((msg) => messagesMap.set(msg._id, msg));
        console.log(Array.from(messagesMap.values()).sort((a, b) => b.createdAt - a.createdAt));
        return GiftedChat.append(Array.from(messagesMap.values()).sort((a, b) => b.createdAt - a.createdAt)).filter(Boolean);
      });
    };
    fetchInitialMessages();
  }, [chatId]);



  const fetchMoreMessages = async () => {
    if (!lastVisible) return;

    const q = firestore()
      .collection(`chats/${chatId}/messages`)
      .orderBy("timestamp", "desc")
      .startAfter(lastVisible)
      .limit(100);

    const snapshot = await q.get();
    const newMessages = snapshot.docs.map((doc) => {
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

    setMessages((prevMessages) => {
      const messagesMap = new Map();
      prevMessages.forEach((msg) => messagesMap.set(msg._id, msg));
      newMessages.forEach((msg) => messagesMap.set(msg._id, msg));
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      return GiftedChat.append(Array.from(messagesMap.values()).sort((a, b) => b.createdAt - a.createdAt)).filter(Boolean);
    });
  };

  const onSend = useCallback(async (messages = []) => {
    const message = messages[0];
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
      await firestore()
        .collection(`chats/${chatId}/messages`)
        .doc()  
        .set(newMessage);  
  
      const participants = [senderId, receiver]; 
  
      const chatRef = firestore().collection("chats").doc(chatId);
      await chatRef.update({
        ...newMessage,
        lastMessage: newMessage,
        lastMessageTimestamp: timestamp,
        participants: participants, 
      });
    } catch (e) {
      console.log(e);
    }
  }, [chatId, senderId, senderName, receiver]); 
  

  useEffect(() => {
    if (!chatId || !senderId) return;
    const markMessagesAsRead = async () => {
      try {
        const q = firestore()
          .collection(`chats/${chatId}/messages`)
          .where("unread", "==", true)
          .where("senderId", "!=", senderId);

        const snapshot = await q.get();

        const batch = firestore().batch();
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { unread: false });
        });

        const chatRef = firestore().collection("chats").doc(chatId);
        const chatDoc = await chatRef.get();
        const chatData = chatDoc.data();

        if (chatData?.lastMessage?.senderId !== senderId && chatData?.lastMessage?.unread) {
          batch.update(chatRef, {
            "lastMessage.unread": false,
          });
        }

        await batch.commit();
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markMessagesAsRead();
  }, [chatId, senderId]);

  console.log(messages);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? RFPercentage(7.9) : RFPercentage(-25)}>
      <View style={styles.screen}>
        <View style={{width:'100%', height:RFPercentage(8), marginTop:RFPercentage(3), justifyContent:'center', borderBottomWidth:1, borderBottomColor:Colors.placeholderColor, alignSelf:'center', paddingBottom:RFPercentage(1.5)}}>
          <View style={{flexDirection:'row', alignItems:'center', paddingHorizontal:RFPercentage(0.5)}}>
            <TouchableOpacity onPress={()=> navigation.goBack()}>
              <AntDesign name='arrowleft' size={RFPercentage(2.5)} color={Colors.placeholderColor}  />
            </TouchableOpacity>
            <Image source={{uri:receiverProfile? receiverProfile:null}} resizeMode="contain" style={{width:RFPercentage(6), height:RFPercentage(6), marginLeft:RFPercentage(2), borderWidth : 2, borderColor:Colors.gradient1}} borderRadius={RFPercentage(100)} />
            <Text style={{color:Colors.primaryText, fontFamily:Fonts.fontMedium, fontSize:RFPercentage(1.7), marginLeft:RFPercentage(2)}}>{receiverName}</Text>
          </View>
        </View>
        <View style={styles.messageContainer}>
          <GiftedChat
            messages={messages}
            onSend={(messages) => onSend(messages)}
            user={{
              _id: senderId,
              name: senderName,
            }}
            loadEarlier={!!lastVisible}
            onLoadEarlier={fetchMoreMessages}
            bottomOffset={RFPercentage(2)} 
            renderLoadEarlier={(props) => (
              <TouchableOpacity style={styles.loadMessages} onPress={props.onLoadEarlier}>
                <Text style={{ color: Colors.background, fontWeight: "bold" }}>Load earlier messages</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingLeft: RFPercentage(1),
    paddingRight: RFPercentage(1),
    backgroundColor: Colors.background,
  },
  messageContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "white",
    marginBottom: RFPercentage(1),
    borderRadius: RFPercentage(1),
  },
  loadMessages: {
    backgroundColor: Colors.gradient1,
    padding: RFPercentage(1.3),
    borderRadius: RFPercentage(100),
    alignSelf: "center",
    marginBottom: 10,
    paddingHorizontal: RFPercentage(2.6),
  },
});

export default Chat;
