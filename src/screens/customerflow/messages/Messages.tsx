import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import Message from '../../../components/Message';

const messages = [
  {
    id: 1,
    name: 'Jane Smith',
    message: 'Hey, will be be available...',
  },
  {
    id: 2,
    name: 'Jane Smith',
    message: 'Hey, will be be available...',
  },
  {
    id: 3,
    name: 'Jane Smith',
    message: 'Hey, will be be available...',
  },
  {
    id: 4,
    name: 'Jane Smith',
    message: 'Hey, will be be available...',
  },
  {
    id: 5,
    name: 'Jane Smith',
    message: 'Hey, will be be available...',
  },
  {
    id: 6,
    name: 'Jane Smith',
    message: 'Hey, will be be available...',
  },
  {
    id: 7,
    name: 'Jane Smith',
    message: 'Hey, will be be available...',
  },
];

const Messages = () => {
  const [all, setAll] = useState(true);
  const [unread, setUnread] = useState(false);

  const toggle1 = () => {
    setAll(true);
    setUnread(false);
  };
  const toggle2 = () => {
    setAll(false);
    setUnread(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack title="Messages" textStyle={styles.headerText} />
      <View style={styles.container}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity onPress={toggle1}>
            <View
              style={[
                styles.toggleButton,
                {
                  backgroundColor: all ? Colors.gradient1 : 'transparent',
                  borderColor: all ? 'transparent' : Colors.inputFieldColor,
                },
              ]}>
              <Text
                style={[
                  styles.toggleText,
                  {
                    color: all ? Colors.background : Colors.placeholderColor,
                    fontFamily: all ? Fonts.fontMedium : Fonts.fontRegular,
                  },
                ]}>
                All
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggle2} style={styles.unreadButton}>
            <View
              style={[
                styles.toggleButton,
                {
                  backgroundColor: unread ? Colors.gradient1 : 'transparent',
                  borderColor: unread ? 'transparent' : Colors.inputFieldColor,
                },
              ]}>
              <Text
                style={[
                  styles.toggleText,
                  {
                    color: unread ? Colors.background : Colors.placeholderColor,
                    fontFamily: unread ? Fonts.fontMedium : Fonts.fontRegular,
                  },
                ]}>
                Unread
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.messageList}>
          <FlatList
            data={messages}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => {
              return <Message name={item.name} message={item.message} />;
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Messages;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    width: '90%',
    alignSelf: 'center',
    paddingTop: RFPercentage(3),
  },
  headerText: {
    fontSize: RFPercentage(1.8),
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    width: RFPercentage(12),
    height: RFPercentage(4),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  toggleText: {
    fontSize: RFPercentage(1.5),
  },
  unreadButton: {
    left: RFPercentage(2.8),
  },
  messageList: {
    marginTop: RFPercentage(2),
  },
});
