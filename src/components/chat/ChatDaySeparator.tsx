import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../constants/Themes';

interface ChatDaySeparatorProps {
  date: Date;
}

const formatDayLabel = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== today.getFullYear() && {year: 'numeric'}),
  });
};

const ChatDaySeparator: React.FC<ChatDaySeparatorProps> = ({date}) => (
  <View style={styles.container}>
    <View style={styles.line} />
    <Text style={styles.label}>{formatDayLabel(date)}</Text>
    <View style={styles.line} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(5),
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.warmGray400,
    opacity: 0.4,
  },
  label: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.warmGray400,
    marginHorizontal: RFPercentage(1.5),
    letterSpacing: 0.3,
  },
});

export default ChatDaySeparator;
