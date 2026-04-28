import React from 'react';
import {Text, StyleSheet, TextStyle} from 'react-native';
import {TIME_STYLE} from './chatStyles';

interface ChatMessageTimeProps {
  time: string;
  isRight?: boolean;
  variant?: 'internal' | 'external';
  style?: TextStyle;
}

const ChatMessageTime: React.FC<ChatMessageTimeProps> = ({
  time,
  isRight = false,
  variant = 'external',
  style,
}) => (
  <Text
    style={[
      styles.base,
      variant === 'internal'
        ? {color: isRight ? TIME_STYLE.rightColor : TIME_STYLE.leftColor}
        : {color: TIME_STYLE.externalColor},
      isRight && styles.alignRight,
      style,
    ]}>
    {time}
  </Text>
);

const styles = StyleSheet.create({
  base: {
    fontSize: TIME_STYLE.fontSize,
    fontFamily: TIME_STYLE.fontFamily,
  },
  alignRight: {
    textAlign: 'right',
  },
});

export default ChatMessageTime;
