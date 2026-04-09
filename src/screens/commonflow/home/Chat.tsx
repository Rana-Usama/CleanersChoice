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
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {
  GiftedChat,
  InputToolbar,
  Bubble,
  IMessage,
} from 'react-native-gifted-chat';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES} from '../../../constants/Themes';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useFocusEffect} from '@react-navigation/native';
import DocumentPicker from 'react-native-document-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  PendingAttachment,
  ChatAttachment,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
  ALLOWED_EXTENSIONS_LABEL,
} from '../../../types/chat';

const Chat = ({navigation, route}: any) => {
  const [messages, setMessages] = useState<IMessage[]>([]);

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
  const [pendingAttachment, setPendingAttachment] =
    useState<PendingAttachment | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);

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
          const msg: any = {
            _id: doc.id,
            text: data.text || '',
            createdAt: data.timestamp?.toDate() || new Date(),
            user: {
              _id: data.senderId,
              name: data.senderName,
            },
          };
          if (data.type === 'attachment' && data.attachment) {
            msg.attachment = data.attachment;
            msg.messageType = 'attachment';
          }
          return msg;
        });

        setMessages(GiftedChat.append([], newMessages).filter(Boolean));
      });

    return () => unsubscribe();
  }, [chatId]);

  const sanitizeFileName = (name: string): string => {
    return name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 100);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocIcon = (mimeType: string): string => {
    if (mimeType === 'application/pdf') return 'file-pdf-box';
    if (
      mimeType === 'application/msword' ||
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
      return 'file-word-box';
    if (mimeType === 'text/plain') return 'file-document-outline';
    return 'file-document';
  };

  const getDocColor = (mimeType: string): string => {
    if (mimeType === 'application/pdf') return '#E53935';
    if (
      mimeType === 'application/msword' ||
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
      return '#1565C0';
    if (mimeType === 'text/plain') return '#616161';
    return Colors.gradient1;
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: ALLOWED_MIME_TYPES as unknown as string[],
        copyTo: 'cachesDirectory',
      });
      const file = result[0];
      if (!file) return;

      const mimeType = file.type || 'application/octet-stream';
      if (
        !ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])
      ) {
        Alert.alert(
          'Unsupported File',
          `Only ${ALLOWED_EXTENSIONS_LABEL} files are supported.`,
        );
        return;
      }

      const fileSize = file.size || 0;
      if (fileSize === 0) {
        Alert.alert('Invalid File', 'The selected file appears to be empty.');
        return;
      }
      if (fileSize > MAX_FILE_SIZE_BYTES) {
        Alert.alert(
          'File Too Large',
          `Maximum file size is ${MAX_FILE_SIZE_LABEL}. Selected file is ${formatFileSize(fileSize)}.`,
        );
        return;
      }

      setPendingAttachment({
        uri: file.fileCopyUri || file.uri,
        name: file.name || 'document',
        mimeType,
        size: fileSize,
      });
    } catch (err: any) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Failed to pick document. Please try again.');
      }
    }
  };

  const uploadAttachment = async (
    attachment: PendingAttachment,
  ): Promise<ChatAttachment> => {
    const safeName = sanitizeFileName(attachment.name);
    const storagePath = `chat-attachments/${chatId}/${Date.now()}_${safeName}`;
    const ref = storage().ref(storagePath);

    const task = ref.putFile(attachment.uri, {
      contentType: attachment.mimeType,
    });

    task.on('state_changed', snapshot => {
      const progress = Math.round(
        (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
      );
      setUploadProgress(progress);
    });

    await task;
    const downloadUrl = await ref.getDownloadURL();
    setUploadProgress(null);

    return {
      url: downloadUrl,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
    };
  };

  const handleOpenAttachment = async (url: string, fileName: string) => {
    try {
      const {dirs} = ReactNativeBlobUtil.fs;
      const filePath = `${dirs.CacheDir}/${sanitizeFileName(fileName)}`;

      const res = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: filePath,
      }).fetch('GET', url);

      if (Platform.OS === 'ios') {
        ReactNativeBlobUtil.ios.openDocument(res.path());
      } else {
        ReactNativeBlobUtil.android.actionViewIntent(
          res.path(),
          'application/pdf',
        );
      }
    } catch {
      // Fallback: open in browser
      Linking.openURL(url).catch(() =>
        Alert.alert('Error', 'Unable to open this file.'),
      );
    }
  };

  // Send Message (text or attachment)
  const onSend = useCallback(
    async (messagesToSend: IMessage[] = []) => {
      const msg = messagesToSend[0];
      const hasText = msg?.text?.trim();
      const hasAttachment = !!pendingAttachment;

      if (!hasText && !hasAttachment) return;

      setIsSending(true);
      const timestamp = new Date();

      try {
        let attachmentData: ChatAttachment | undefined;

        // Upload attachment if present
        if (pendingAttachment) {
          try {
            attachmentData = await uploadAttachment(pendingAttachment);
          } catch {
            Alert.alert(
              'Upload Failed',
              'Failed to upload attachment. Please check your connection and try again.',
            );
            setIsSending(false);
            setUploadProgress(null);
            return;
          }
        }

        const isAttachment = !!attachmentData;
        const displayText = isAttachment
          ? `${attachmentData!.name}`
          : msg?.text || '';

        // Optimistic UI update
        const newMessage: any = {
          _id: `${Date.now()}`,
          text: displayText,
          createdAt: timestamp,
          user: {_id: senderId, name: senderName, avatar: senderProfile},
        };
        if (isAttachment) {
          newMessage.attachment = attachmentData;
          newMessage.messageType = 'attachment';
        }
        setMessages(prev => GiftedChat.append(prev, [newMessage]));
        setMessage('');
        setPendingAttachment(null);

        // Build Firestore message
        const firestoreMessage: any = {
          text: displayText,
          timestamp,
          senderId,
          senderName,
          unread: true,
          chatId,
          receiver,
          type: isAttachment ? 'attachment' : 'text',
        };
        if (isAttachment) {
          firestoreMessage.attachment = attachmentData;
        }

        const chatRef = firestore().collection('Chats').doc(chatId);
        await chatRef.collection('Messages').add(firestoreMessage);
        await chatRef.set(
          {
            lastMessage: firestoreMessage,
            lastMessageTimestamp: timestamp,
            participants: [senderId, receiver],
          },
          {merge: true},
        );

        const pushBody = isAttachment
          ? ` Sent a document: ${attachmentData!.name}`
          : msg?.text || '';
        await sendPushNotification(pushBody);
      } catch {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      } finally {
        setIsSending(false);
      }
    },
    [chatId, senderId, senderName, receiver, senderProfile, pendingAttachment],
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
          backgroundColor={Colors.background}
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
              renderBubble={props => {
                const currentMsg = props.currentMessage as any;
                const isAttachmentMsg = currentMsg?.messageType === 'attachment' && currentMsg?.attachment;
                const isRight = currentMsg?.user?._id === senderId;

                if (isAttachmentMsg) {
                  const att = currentMsg.attachment as ChatAttachment;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleOpenAttachment(att.url, att.name)}
                      style={[
                        styles.attachmentBubble,
                        isRight
                          ? styles.attachmentBubbleRight
                          : styles.attachmentBubbleLeft,
                      ]}>
                      <MaterialCommunityIcons
                        name={getDocIcon(att.mimeType)}
                        size={RFPercentage(4)}
                        color={isRight ? Colors.background : getDocColor(att.mimeType)}
                      />
                      <View style={styles.attachmentBubbleInfo}>
                        <Text
                          style={[
                            styles.attachmentBubbleName,
                            {color: isRight ? Colors.background : Colors.primaryText},
                          ]}
                          numberOfLines={2}>
                          {att.name}
                        </Text>
                        <Text
                          style={[
                            styles.attachmentBubbleSize,
                            {color: isRight ? 'rgba(255,255,255,0.7)' : Colors.secondaryText},
                          ]}>
                          {formatFileSize(att.size)} •{' '}
                          {att.mimeType.split('/').pop()?.toUpperCase()}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name="download"
                        size={RFPercentage(2.2)}
                        color={isRight ? 'rgba(255,255,255,0.7)' : Colors.gradient1}
                      />
                    </TouchableOpacity>
                  );
                }

                return (
                  <Bubble
                    {...props}
                    wrapperStyle={{
                      left: {
                        backgroundColor: Colors.coolGray200,
                        padding: RFPercentage(0.6),
                      },
                      right: {
                        backgroundColor: Colors.steelBlue,
                        padding: RFPercentage(0.6),
                      },
                    }}
                    textStyle={{
                      left: {
                        color: Colors.inputTextColor,
                        fontFamily: Fonts.fontRegular,
                        fontSize: RFPercentage(1.9),
                      },
                      right: {
                        color: Colors.background,
                        fontFamily: Fonts.fontRegular,
                        fontSize: RFPercentage(1.9),
                      },
                    }}
                  />
                );
              }}
              renderInputToolbar={props => (
                <View
                  style={{
                    backgroundColor: Colors.offWhite,
                    width: '100%',
                    minHeight:
                      Platform.OS === 'ios'
                        ? RFPercentage(12)
                        : RFPercentage(9),
                    justifyContent: 'center',
                    maxHeight: RFPercentage(24),
                    paddingVertical: RFPercentage(2),
                  }}>
                  {/* Upload progress bar */}
                  {uploadProgress !== null && (
                    <View style={styles.uploadProgressContainer}>
                      <View style={styles.uploadProgressBar}>
                        <View
                          style={[
                            styles.uploadProgressFill,
                            {width: `${uploadProgress}%`},
                          ]}
                        />
                      </View>
                      <Text style={styles.uploadProgressText}>
                        Uploading... {uploadProgress}%
                      </Text>
                    </View>
                  )}

                  {/* Pending attachment preview */}
                  {pendingAttachment && (
                    <View style={styles.attachmentPreview}>
                      <MaterialCommunityIcons
                        name={getDocIcon(pendingAttachment.mimeType)}
                        size={RFPercentage(3)}
                        color={getDocColor(pendingAttachment.mimeType)}
                      />
                      <View style={styles.attachmentPreviewInfo}>
                        <Text
                          style={styles.attachmentPreviewName}
                          numberOfLines={1}>
                          {pendingAttachment.name}
                        </Text>
                        <Text style={styles.attachmentPreviewSize}>
                          {formatFileSize(pendingAttachment.size)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setPendingAttachment(null)}
                        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                        <MaterialCommunityIcons
                          name="close-circle"
                          size={RFPercentage(2.5)}
                          color={Colors.red500}
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  <InputToolbar
                    {...props}
                    containerStyle={styles.toolbar}
                    renderComposer={() => (
                      <View style={styles.composerRow}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={handlePickDocument}
                          disabled={isSending}
                          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                          style={styles.attachButton}>
                          <MaterialCommunityIcons
                            name="paperclip"
                            size={RFPercentage(2.5)}
                            color={
                              pendingAttachment
                                ? Colors.gradient1
                                : Colors.warmGray400
                            }
                          />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.customTextInput}
                          placeholder="Type a message"
                          placeholderTextColor={Colors.warmGray400}
                          value={message}
                          onChangeText={setMessage}
                          multiline={true}
                          scrollEnabled={true}
                          textAlignVertical="top"
                          editable={!isSending}
                        />
                      </View>
                    )}
                    renderSend={() => (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.sendButton}
                        hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
                        disabled={isSending}
                        onPress={() => {
                          if (isSending) return;
                          onSend([
                            {
                              _id: `${Date.now()}`,
                              text: message,
                              user: {
                                _id: senderId,
                                name: senderName,
                              },
                              createdAt: new Date(),
                            },
                          ]);
                        }}>
                        {isSending ? (
                          <ActivityIndicator
                            size="small"
                            color={Colors.gradient1}
                          />
                        ) : (
                          <Feather
                            name="send"
                            size={RFPercentage(2.5)}
                            color={Colors.gradient1}
                          />
                        )}
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
                      backgroundColor: Colors.coolGray300,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: Colors.warmGray350,
                    }}>
                    <Text
                      style={{
                        color: Colors.primaryText,
                        fontSize: RFPercentage(1.9),
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
    color: Colors.inputTextColor,
    fontSize: RFPercentage(1.9),
    flex: 1,
    textAlignVertical: 'top',
    fontFamily: Fonts.fontRegular,
    paddingVertical: 0,
    marginVertical: 0,
    lineHeight: RFPercentage(3),
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
  },
  attachButton: {
    marginRight: RFPercentage(1),
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RFPercentage(100),
    position: 'absolute',
    right: RFPercentage(0),
    top: Platform.OS === 'android' ? RFPercentage(0.3) : 0,
    zIndex: 999,
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
    backgroundColor: Colors.grayBorderOverlay30,
  },
  profileContainer: {
    width: '100%',
    height: RFPercentage(8),
    marginTop: RFPercentage(7),
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.coolGray250,
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
    fontSize: RFPercentage(2.1),
  },
  receiverName: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.9),
    marginLeft: RFPercentage(2),
  },
  toolbar: {
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(3),
    maxHeight: RFPercentage(18),
    justifyContent: 'center',
    paddingHorizontal: RFPercentage(1.7),
    borderTopWidth: RFPercentage(0.1),
    alignSelf: 'center',
    width: '90%',
    backgroundColor: Colors.silverOverlay50,
    borderColor: Colors.warmGrayOverlay90,
    borderTopColor: Colors.warmGrayOverlay90,
    bottom: Platform.OS === 'ios' ? RFPercentage(1) : 0,
    paddingVertical: RFPercentage(1.4),
  },
  // Attachment preview (above input)
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.silverOverlay50,
    marginHorizontal: '5%',
    marginBottom: RFPercentage(1),
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(1.5),
    borderWidth: 1,
    borderColor: Colors.warmGrayOverlay90,
  },
  attachmentPreviewInfo: {
    flex: 1,
    marginLeft: RFPercentage(1),
    marginRight: RFPercentage(1),
  },
  attachmentPreviewName: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
  },
  attachmentPreviewSize: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
    marginTop: 2,
  },
  // Upload progress
  uploadProgressContainer: {
    marginHorizontal: '5%',
    marginBottom: RFPercentage(0.8),
  },
  uploadProgressBar: {
    height: 3,
    backgroundColor: Colors.coolGray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: Colors.gradient1,
  },
  uploadProgressText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.2),
    marginTop: 2,
    textAlign: 'center',
  },
  // Attachment message bubble
  attachmentBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1.2),
    borderRadius: RFPercentage(1.8),
    maxWidth: RFPercentage(35),
    marginBottom: RFPercentage(0.5),
  },
  attachmentBubbleLeft: {
    backgroundColor: Colors.coolGray200,
  },
  attachmentBubbleRight: {
    backgroundColor: Colors.steelBlue,
  },
  attachmentBubbleInfo: {
    flex: 1,
    marginHorizontal: RFPercentage(1),
  },
  attachmentBubbleName: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
  },
  attachmentBubbleSize: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.2),
    marginTop: 2,
  },
});

export default Chat;
