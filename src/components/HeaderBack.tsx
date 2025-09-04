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
import {Colors, Fonts, Icons} from '../constants/Themes';
import {useNavigation} from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign'

interface props {
  logo?: boolean;
  textStyle?: object;
  title: string;
  right?: boolean;
  rightText?: string;
  onPress?: () => void;
  left?: boolean;
}

const HeaderBack = (props: props) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {props.logo ? (
          <Image
            source={Icons.homeLogo}
            resizeMode="contain"
            style={styles.logo}
          />
        ) : props.left ? (
          <TouchableOpacity   activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <AntDesign
              name="arrowleft"
              color={Colors.secondaryText}
              size={RFPercentage(2.8)}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={[styles.headerText, props.textStyle]}>{props.title}</Text>
      {props.right && (
        <View style={styles.rightContainer}>
          <TouchableOpacity   activeOpacity={0.8} onPress={props.onPress}>
            <Text style={styles.rightText}>{props.rightText}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default HeaderBack;

const styles = StyleSheet.create({
  container: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop:
      Platform.OS === 'android' ? RFPercentage(7) : RFPercentage(1),
  },
  leftContainer: {
    position: 'absolute',
    left: 0,
  },
  rightContainer: {
    position: 'absolute',
    right: 0,
  },
  headerText: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.4),
    textAlign: 'center',
  },
  logo: {
    width: RFPercentage(7),
    height: RFPercentage(7),
  },
  rightText: {
    color: Colors.gradient1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
  },
});
