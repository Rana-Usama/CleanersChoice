import {
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import React, {useState, useRef, useEffect} from 'react';
import NextButton from '../../components/NextButton';
//   import SkipButton from '../../components/SkipButton';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {Fonts, IMAGES, Colors, Icons} from '../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../routers/StackNavigator';
import SelectionButton from '../../components/SelectionButton';
import HeaderComponent from '../../components/HeaderComponent';

const {width, height} = Dimensions.get('window');

const UserSelection: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'OnBoardingTwo'>
    >();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <View style={styles.container}>
        <HeaderComponent />
        <View
          style={{
            marginTop: RFPercentage(7),
            alignSelf: 'center',
            width: '90%',
          }}>
          <Text
            style={{
              color: Colors.primaryText,
              fontFamily: Fonts.semiBold,
              fontSize: RFPercentage(2.2),
              textAlign: 'center',
            }}>
            Register Yourself As
          </Text>
        </View>
        <View
          style={{
            marginTop: RFPercentage(4.8),
            width: '90%',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
          }}>
          <SelectionButton
            title="Customer / Get Cleaning Service"
            onPress={() => navigation.navigate('SignUp')}
            icon={Icons.customer}
          />
        </View>
        <View
          style={{
            marginTop: RFPercentage(3),
            width: '90%',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
          }}>
          <SelectionButton
            title="Business Owner /Cleaner"
            onPress={() => console.log('hi')}
            icon={Icons.owner}
          />
        </View>
        <View
          style={{
            marginTop: RFPercentage(4.8),
            width: '90%',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
          }}>
          <Text
            style={{
              color: Colors.primaryText,
              fontFamily: Fonts.fontRegular,
              fontSize: RFPercentage(1.5),
              textAlign: 'center',
              width: '80%',
            }}>
            Let us know how you would like to register yourself!
          </Text>
        </View>
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: RFPercentage(14),
          right: RFPercentage(1.5),
        }}>
        <Image
          source={IMAGES.stars}
          resizeMode="contain"
          style={{
            width: RFPercentage(8),
            height: RFPercentage(8),
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default UserSelection;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    // flex: 1,
    backgroundColor: Colors.background,
    // paddingTop: height * 0.02,
  },
  title: {
    color: Colors.primaryText,
    fontSize: RFPercentage(2.5),
    fontFamily: Fonts.fontBold,
    lineHeight: 27,
    textAlign: 'center',
  },
  descriptionContainer: {
    marginHorizontal: RFPercentage(6),
    marginVertical: RFPercentage(1.5),
  },
  description: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    lineHeight: 19,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFPercentage(1),
  },
  dot: {
    width: RFPercentage(1.5),
    height: RFPercentage(1.5),
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: height * 0.16,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: RFPercentage(2.6),
    marginLeft: RFPercentage(1.55),
    bottom: RFPercentage(2),
  },
});
