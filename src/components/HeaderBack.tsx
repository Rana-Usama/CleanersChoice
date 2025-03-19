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
import {Colors, Fonts, Icons} from '../constants/Themes';
import {useNavigation} from '@react-navigation/native';

const  HeaderBack: React.FC = props => {
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
        {props.logo ? (
          <>
            <Image
              source={Icons.homeLogo}
              resizeMode="contain"
              style={styles.logo}
            />
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Entypo
                name="chevron-thin-left"
                color={Colors.secondaryText}
                size={RFPercentage(2)}
              />
            </TouchableOpacity>
          </>
        )}
      </View>
      <Text style={[styles.headerText, props.textStyle]}>{props.title}</Text>
      {props.right && (
        <View style={{position: 'absolute', right: 0}}>
          <TouchableOpacity onPress={props.onPress}>
            <Text
              style={{
                color: Colors.gradient1,
                fontFamily: Fonts.fontMedium,
                fontSize: RFPercentage(1.5),
              }}>
              {props.rightText}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  logo: {
    width: RFPercentage(7),
    height: RFPercentage(7),
  },
});
