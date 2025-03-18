import {
  StyleSheet,
  View,
  Image,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Entypo from 'react-native-vector-icons/Entypo';
import {Colors, Fonts} from '../constants/Themes';
import {useNavigation} from '@react-navigation/native';


const HeaderBack: React.FC = props => {
  const navigation = useNavigation();

  return (
    <View
      style={{
        width: '90%',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: Platform.OS == 'android' ? RFPercentage(6) : RFPercentage(0),
      }}>
      <View style={{position: 'absolute', left: 0}}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Entypo
            name="chevron-thin-left"
            color={Colors.secondaryText}
            size={RFPercentage(2)}
          />
        </TouchableOpacity>
      </View>
      <Text style={[styles.headerText, props.textStyle]}>{props.title}</Text>
    </View>
  );
};

export default HeaderBack;

const styles = StyleSheet.create({
  headerText: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.3),
    textAlign: 'center',
  },
});
