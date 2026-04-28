import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts} from '../../constants/Themes';
import {ChatAttachment} from '../../types/chat';
import PdfIcon from '../../assets/svg/pdfIcon';
import {
  BUBBLE_SPACING,
  SENT_BG,
  RECEIVED_BG,
  RECEIVED_BORDER,
  TIME_STYLE,
} from './chatStyles';

interface ChatDocumentBubbleProps {
  attachment: ChatAttachment;
  isRight: boolean;
  time: string;
  fileSize: string;
  text?: string;
  onPress: () => void;
  onDownload?: () => void;
}

const ChatDocumentBubble: React.FC<ChatDocumentBubbleProps> = ({
  attachment,
  isRight,
  time,
  fileSize,
  text,
  onPress,
  onDownload,
}) => {
  const hasCaption = !!text?.trim();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        isRight ? styles.cardRight : styles.cardLeft,
        {marginBottom: BUBBLE_SPACING.messageBottomMargin},
      ]}>
      {/* Doc row */}
      <View style={styles.docRow}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <PdfIcon width={RFPercentage(3.5)} height={RFPercentage(3.5)} />
        </View>
        {/* File info */}
        <View style={styles.info}>
          <Text
            style={[
              styles.fileName,
              {color: isRight ? Colors.background : Colors.primaryText},
            ]}
            numberOfLines={2}>
            {attachment.name}
          </Text>
          <Text
            style={[
              styles.fileSize,
              {
                color: isRight
                  ? 'rgba(255,255,255,0.65)'
                  : Colors.secondaryText,
              },
            ]}>
            {fileSize} • {attachment.mimeType.split('/').pop()?.toUpperCase()}
          </Text>
        </View>
        {/* Download button (received only) */}
        {!isRight && (
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={e => {
              e.stopPropagation();
              onDownload?.();
            }}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            style={styles.downloadBtn}>
            <MaterialCommunityIcons
              name="download"
              size={RFPercentage(2.2)}
              color={Colors.gradient1}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Divider */}
      <View
        style={[
          styles.divider,
          {
            backgroundColor: isRight
              ? 'rgba(255,255,255,0.2)'
              : Colors.coolGray200,
          },
        ]}
      />

      {/* Caption text (if any) */}
      {hasCaption && (
        <Text
          style={[
            styles.caption,
            {color: isRight ? Colors.background : Colors.inputTextColor},
          ]}>
          {text}
        </Text>
      )}

      {/* Time */}
      <Text
        style={[
          styles.time,
          {
            color: isRight ? TIME_STYLE.rightColor : TIME_STYLE.leftColor,
          },
        ]}>
        {time}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: RFPercentage(1.3),
    paddingTop: RFPercentage(0.8),
    paddingBottom: RFPercentage(0.4),
    borderRadius: BUBBLE_SPACING.borderRadius,
    minWidth: RFPercentage(28),
    maxWidth: RFPercentage(36),
  },
  cardLeft: {
    backgroundColor: RECEIVED_BG,
  },
  cardRight: {
    backgroundColor: SENT_BG,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  iconWrap: {
    paddingTop: 3,
  },
  downloadBtn: {
    alignSelf: 'center',
    marginLeft: RFPercentage(0.5),
  },
  info: {
    flex: 1,
    marginHorizontal: RFPercentage(1),
  },
  fileName: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.55),
    lineHeight: RFPercentage(2.2),
  },
  fileSize: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.15),
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: RFPercentage(0.5),
    marginHorizontal: -RFPercentage(0.2),
  },
  caption: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.9),
    lineHeight: RFPercentage(2.7),
    marginBottom: RFPercentage(0.3),
  },
  time: {
    fontSize: TIME_STYLE.fontSize,
    fontFamily: TIME_STYLE.fontFamily,
    textAlign: 'right',
  },
});

export default ChatDocumentBubble;

