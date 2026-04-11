import React from 'react';
import {Bubble} from 'react-native-gifted-chat';
import {BUBBLE_WRAPPER, BUBBLE_TEXT, BUBBLE_SPACING, formatTime} from './chatStyles';
import ChatMessageTime from './ChatMessageTime';

interface ChatTextBubbleProps {
  bubbleProps: any;
  showTime?: boolean;
}

const ChatTextBubble: React.FC<ChatTextBubbleProps> = ({
  bubbleProps,
  showTime = true,
}) => (
  <Bubble
    {...bubbleProps}
    wrapperStyle={BUBBLE_WRAPPER}
    textStyle={BUBBLE_TEXT}
    containerStyle={{
      left: {marginBottom: BUBBLE_SPACING.messageBottomMargin},
      right: {marginBottom: BUBBLE_SPACING.messageBottomMargin},
    }}
    renderTime={
      showTime
        ? (timeProps: any) => (
            <ChatMessageTime
              time={formatTime(timeProps.currentMessage?.createdAt)}
              isRight={timeProps.position === 'right'}
              variant="internal"
              style={{marginHorizontal: 8, marginBottom: 3, marginTop: 2}}
            />
          )
        : () => null
    }
  />
);

export default ChatTextBubble;
