import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../constants/Themes';

// Shared spacing tokens
export const BUBBLE_SPACING = {
  messagePadding: RFPercentage(0.6),
  messageBottomMargin: RFPercentage(0.8),
  borderRadius: RFPercentage(1.8),
};

// Shared bubble wrapper styles (left/right)
export const BUBBLE_WRAPPER = {
  left: {
    backgroundColor: Colors.coolGray200,
    padding: BUBBLE_SPACING.messagePadding,
  },
  right: {
    backgroundColor: Colors.steelBlue,
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
  fontSize: RFPercentage(1.3),
  fontFamily: Fonts.fontRegular,
  leftColor: '#aaa',
  rightColor: 'rgba(255,255,255,0.7)',
  externalColor: Colors.warmGray400,
};

// Format time from date
export const formatTime = (date: any): string => {
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
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
