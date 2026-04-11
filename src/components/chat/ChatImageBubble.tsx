import React from 'react';
import {View, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors} from '../../constants/Themes';
import {ChatAttachment} from '../../types/chat';
import ChatMessageTime from './ChatMessageTime';
import {BUBBLE_SPACING} from './chatStyles';

interface ChatImageBubbleProps {
  attachment: ChatAttachment;
  isRight: boolean;
  isDownloaded: boolean;
  time: string;
  onPress: () => void;
  onDownload?: () => void;
}

const ChatImageBubble: React.FC<ChatImageBubbleProps> = ({
  attachment,
  isRight,
  isDownloaded,
  time,
  onPress,
  onDownload,
}) => (
  <View style={styles.container}>
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.bubble,
        isRight ? styles.bubbleRight : styles.bubbleLeft,
      ]}>
      <Image
        source={{uri: attachment.url}}
        style={styles.image}
        resizeMode="cover"
      />
      {!isRight && !isDownloaded && (
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={onDownload}
          style={styles.downloadOverlay}>
          <MaterialCommunityIcons
            name="download"
            size={RFPercentage(2.0)}
            color={Colors.background}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
    <ChatMessageTime
      time={time}
      isRight={isRight}
      variant="external"
      style={styles.time}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: BUBBLE_SPACING.messageBottomMargin,
  },
  bubble: {
    borderRadius: BUBBLE_SPACING.borderRadius,
    overflow: 'hidden',
    maxWidth: RFPercentage(22),
  },
  bubbleLeft: {
    backgroundColor: Colors.coolGray200,
  },
  bubbleRight: {
    backgroundColor: Colors.steelBlue,
  },
  image: {
    width: RFPercentage(20),
    height: RFPercentage(17),
    borderRadius: BUBBLE_SPACING.borderRadius,
  },
  downloadOverlay: {
    position: 'absolute',
    bottom: RFPercentage(1),
    right: RFPercentage(1),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: RFPercentage(100),
    padding: RFPercentage(0.5),
  },
  time: {
    marginTop: RFPercentage(0.3),
    marginHorizontal: RFPercentage(0.2),
  },
});

export default ChatImageBubble;
