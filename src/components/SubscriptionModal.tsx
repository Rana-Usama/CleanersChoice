import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {Colors, Fonts} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import AntDesign from 'react-native-vector-icons/AntDesign';
import GradientButton from './GradientButton';

interface Props {
  text: string;
  icon: string;
  onPress: () => void;
  loading?: boolean;
}

const SubscriptionModal = (props: Props) => {
  return (
    <View style={styles.container}>
      <View style={{}}>
        <AntDesign
          name={props.icon}
          color={Colors.gradient1}
          size={RFPercentage(8)}
        />
      </View>

      <Text style={styles.text}>{props.text}</Text>
      <View>
        <GradientButton
          title="Ok"
          onPress={props.onPress}
          style={{width: RFPercentage(15)}}
          loading={props.loading}
        />
      </View>
    </View>
  );
};

export default SubscriptionModal;

const styles = StyleSheet.create({
  container: {
    width: '80%',
    height: '35%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderRadius: RFPercentage(2.5),
  },
  text: {
    marginVertical: RFPercentage(4),
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2),
    width: RFPercentage(34),
    textAlign: 'center',
    lineHeight: RFPercentage(2.4),
  },
});
