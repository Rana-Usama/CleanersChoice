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
    id : 1,
    name : 'Jane Smith',
    message : 'Hey, will be be available...'
  },
  {
    id : 2,
    name : 'Jane Smith',
    message : 'Hey, will be be available...'
  },
  {
    id : 3,
    name : 'Jane Smith',
    message : 'Hey, will be be available...'
  },
  {
    id : 4,
    name : 'Jane Smith',
    message : 'Hey, will be be available...'
  },
  {
    id : 5,
    name : 'Jane Smith',
    message : 'Hey, will be be available...'
  },
  {
    id : 6,
    name : 'Jane Smith',
    message : 'Hey, will be be available...'
  },
  {
    id : 7,
    name : 'Jane Smith',
    message : 'Hey, will be be available...'
  },
]

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
      <HeaderBack title="Messages" textStyle={{fontSize: RFPercentage(1.8)}} />
      <View style={styles.container}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity onPress={toggle1}>
            <View
              style={{
                width: RFPercentage(12),
                height: RFPercentage(4),
                borderRadius: RFPercentage(100),
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  all === true ? Colors.gradient1 : 'transparent',
                borderWidth: 1,
                borderColor:
                  all === true ? 'transparent' : Colors.inputFieldColor,
              }}>
              <Text
                style={{
                  color:
                    all === true ? Colors.background : Colors.placeholderColor,
                  fontFamily:
                    all === true ? Fonts.fontMedium : Fonts.fontRegular,
                  fontSize: RFPercentage(1.5),
                }}>
                All
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggle2} style={{left: RFPercentage(2.8)}}>
            <View
              style={{
                width: RFPercentage(12),
                height: RFPercentage(4),
                borderRadius: RFPercentage(100),
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  unread === true ? Colors.gradient1 : 'transparent',
                borderWidth: 1,
                borderColor:
                  unread === true ? 'transparent' : Colors.inputFieldColor,
              }}>
              <Text
                style={{
                  color:
                    unread === true
                      ? Colors.background
                      : Colors.placeholderColor,
                  fontFamily:
                    unread === true ? Fonts.fontMedium : Fonts.fontRegular,
                  fontSize: RFPercentage(1.5),
                }}>
                Unread
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={{marginTop:RFPercentage(2)}}>
          <FlatList 
          data={messages}
          keyExtractor={(item)=> item.id.toString()}
          renderItem={({item})=> {
            return (
              <Message name={item.name} message={item.message} />
            )
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
});
