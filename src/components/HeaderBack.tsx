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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface props {
  logo?: boolean;
  textStyle?: object;
  title: string;
  right?: boolean;
  rightText?: string;
  onPress?: () => void;
  left?: boolean;
  style?: object;
  arrowColor? : any
  tintColor?:any
}

const HeaderBack = (props: props) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.container, props.style]}>
      <View
        style={{
          width: '90%',
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View style={styles.leftContainer}>
          {props.logo ? (
            <Image
              source={Icons.homeLogo}
              resizeMode="contain"
              style={styles.logo}
              tintColor={props?.tintColor}
            />
          ) : props.left ? (
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 10,
              }}
              onPress={() => navigation.goBack()}>
              <MaterialIcons
                name="keyboard-backspace"
                color={ props.arrowColor ? props?.arrowColor : Colors.secondaryText}
                size={RFPercentage(2.8)}
              />
              <Text
                style={[
                  styles.headerText,
                  props.textStyle,
                  {left: RFPercentage(1)},
                ]}>
                {props.title}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {props.logo && (
          <Text style={[styles.headerText, props.textStyle]}>
            {props.title}
          </Text>
        )}

        {props.right && (
          <View style={styles.rightContainer}>
            <TouchableOpacity activeOpacity={0.8} onPress={props.onPress}>
              <Text style={styles.rightText}>{props.rightText}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default HeaderBack;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    alignSelf: 'center',
    marginTop: Platform.OS === 'android' ? RFPercentage(0) : RFPercentage(0),
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder220,
    height:Platform.OS === 'ios' ? RFPercentage(8) : RFPercentage(13),
    paddingBottom: RFPercentage(1.8),
    backgroundColor: Colors.background,
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
    fontSize: RFPercentage(2.5),
    textAlign: 'center',
  },
  logo: {
    width: RFPercentage(7),
    height: RFPercentage(7),
    left:-20
  },
  rightText: {
    color: Colors.background,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
  },
});
