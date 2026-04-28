import React from 'react';
import {View, Image, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts} from '../../constants/Themes';
import {ChatAttachment} from '../../types/chat';
import {
  BUBBLE_SPACING,
  SENT_BG,
  RECEIVED_BG,
  RECEIVED_BORDER,
  TIME_STYLE,
} from './chatStyles';

interface ChatImageBubbleProps {
  attachment: ChatAttachment;
  isRight: boolean;
  isDownloaded: boolean;
  time: string;
  text?: string;
  onPress: () => void;
  onDownload?: () => void;
}

const IMAGE_WIDTH = RFPercentage(28);
const IMAGE_HEIGHT = RFPercentage(24);

const ChatImageBubble: React.FC<ChatImageBubbleProps> = ({
  attachment,
  isRight,
  isDownloaded,
  time,
  text,
  onPress,
  onDownload,
}) => {
  const hasCaption = !!text?.trim();

  return (
    <View
      style={[
        styles.bubble,
        isRight ? styles.bubbleRight : styles.bubbleLeft,
        {marginBottom: BUBBLE_SPACING.messageBottomMargin},
        !hasCaption && styles.bubbleNoFrame,
      ]}>
      {/* Image */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.imageTouchable}>
        <Image
          source={{uri: attachment.url}}
          style={[
            styles.image,
            // only round bottom if no caption/time row below
            !hasCaption && styles.imageRoundBottom,
          ]}
          resizeMode="cover"
        />
        {/* Download overlay on image (received, not yet downloaded) */}
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
        {/* Time overlaid on image when no caption */}
        {!hasCaption && (
          <View style={styles.timeOverlay}>
            <Text style={styles.timeOverlayText}>{time}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Caption + time row (when text exists) */}
      {hasCaption && (
        <View style={styles.captionRow}>
          <Text
            style={[
              styles.captionText,
              {color: isRight ? Colors.background : Colors.inputTextColor},
            ]}>
            {text}
          </Text>
          <View style={styles.timeRow}>
            <Text
              style={[
                styles.timeText,
                {
                  color: isRight
                    ? TIME_STYLE.rightColor
                    : TIME_STYLE.leftColor,
                },
              ]}>
              {time}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    borderRadius: BUBBLE_SPACING.borderRadius,
    maxWidth: IMAGE_WIDTH + RFPercentage(4),
    alignSelf: 'flex-start',
    padding: RFPercentage(0.7),
    overflow: 'hidden',
  },
  bubbleNoFrame: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  bubbleLeft: {
    backgroundColor: RECEIVED_BG,
  },
  bubbleRight: {
    backgroundColor: SENT_BG,
    alignSelf: 'flex-end',
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: BUBBLE_SPACING.borderRadius - 2,
    overflow: 'hidden',
  },
  imageRoundBottom: {
    // no extra style needed — bubble overflow clips it
  },
  downloadOverlay: {
    position: 'absolute',
    top: RFPercentage(0.8),
    left: RFPercentage(0.8),
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: RFPercentage(100),
    padding: RFPercentage(0.6),
  },
  timeOverlay: {
    position: 'absolute',
    bottom: RFPercentage(0.6),
    right: RFPercentage(0.8),
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: RFPercentage(1),
    paddingHorizontal: RFPercentage(0.6),
    paddingVertical: RFPercentage(0.15),
  },
  timeOverlayText: {
    color: '#fff',
    fontSize: TIME_STYLE.fontSize,
    fontFamily: TIME_STYLE.fontFamily,
  },
  captionRow: {
    width: IMAGE_WIDTH,
    alignSelf: 'center',
    paddingTop: RFPercentage(0.6),
    paddingBottom: RFPercentage(0.4),
  },
  imageTouchable: {
    width: IMAGE_WIDTH,
    alignSelf: 'center',
  },
  captionText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.9),
    lineHeight: RFPercentage(2.7),
  },
  timeRow: {
    alignItems: 'flex-end',
    marginTop: RFPercentage(0.2),
  },
  timeText: {
    fontSize: TIME_STYLE.fontSize,
    fontFamily: TIME_STYLE.fontFamily,
  },
});

export default ChatImageBubble;

