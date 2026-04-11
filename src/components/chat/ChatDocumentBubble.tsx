import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts} from '../../constants/Themes';
import {ChatAttachment} from '../../types/chat';
import PdfIcon from '../../assets/svg/pdfIcon';
import ChatMessageTime from './ChatMessageTime';
import {BUBBLE_SPACING} from './chatStyles';

interface ChatDocumentBubbleProps {
  attachment: ChatAttachment;
  isRight: boolean;
  time: string;
  fileSize: string;
  onPress: () => void;
  onDownload?: () => void;
}

const ChatDocumentBubble: React.FC<ChatDocumentBubbleProps> = ({
  attachment,
  isRight,
  time,
  fileSize,
  onPress,
  onDownload,
}) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    style={[
      styles.card,
      isRight ? styles.cardRight : styles.cardLeft,
    ]}>
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <PdfIcon width={RFPercentage(3.5)} height={RFPercentage(3.5)} />
      </View>
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
            {color: isRight ? 'rgba(255,255,255,0.7)' : Colors.secondaryText},
          ]}>
          {fileSize} • {attachment.mimeType.split('/').pop()?.toUpperCase()}
        </Text>
      </View>
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
    <ChatMessageTime
      time={time}
      isRight={isRight}
      variant="internal"
      style={styles.time}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: RFPercentage(1.3),
    paddingTop: RFPercentage(0.5),
    paddingBottom: RFPercentage(0.15),
    borderRadius: BUBBLE_SPACING.borderRadius,
    width: RFPercentage(35),
    marginBottom: BUBBLE_SPACING.messageBottomMargin,
  },
  cardLeft: {
    backgroundColor: Colors.coolGray200,
  },
  cardRight: {
    backgroundColor: Colors.steelBlue,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    minHeight: RFPercentage(3.5),
  },
  iconWrap: {
    paddingTop: 2,
  },
  downloadBtn: {
    alignSelf: 'center',
  },
  info: {
    flex: 1,
    marginHorizontal: RFPercentage(1),
  },
  fileName: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    lineHeight: RFPercentage(2.2),
  },
  fileSize: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.1),
    marginTop: 1,
  },
  time: {
    alignSelf: 'flex-end',
    marginTop: RFPercentage(0.1),
  },
});

export default ChatDocumentBubble;
