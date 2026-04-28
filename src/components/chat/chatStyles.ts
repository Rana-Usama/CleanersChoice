import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../constants/Themes';

// Shared spacing tokens
export const BUBBLE_SPACING = {
  messagePadding: RFPercentage(0.8),
  messageBottomMargin: RFPercentage(0.8),
  borderRadius: RFPercentage(2),
};

// Sent bubble: steelBlue; Received bubble: coolGray200
export const SENT_BG = Colors.steelBlue;
export const RECEIVED_BG = Colors.coolGray200;
export const RECEIVED_BORDER = Colors.coolGray200;

// Shared bubble wrapper styles (left/right)
export const BUBBLE_WRAPPER = {
  left: {
    backgroundColor: RECEIVED_BG,
    padding: BUBBLE_SPACING.messagePadding,
  },
  right: {
    backgroundColor: SENT_BG,
    padding: BUBBLE_SPACING.messagePadding,
  },
};

// Shared bubble text styles (left/right)
export const BUBBLE_TEXT = {
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
};

// Shared time style tokens
export const TIME_STYLE = {
  fontSize: RFPercentage(1.25),
  fontFamily: Fonts.fontRegular,
  leftColor: Colors.warmGray400,
  rightColor: 'rgba(255,255,255,0.75)',
  externalColor: Colors.warmGray400,
};

// Format time from date
export const formatTime = (date: any): string => {
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
  } catch {
    return '';
  }
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
