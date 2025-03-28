import {
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {Fonts, IMAGES, Colors, Icons} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../routers/StackNavigator';
import SelectionButton from '../../../components/SelectionButton';
import HeaderComponent from '../../../components/HeaderComponent';
import {useDispatch} from 'react-redux';
import { setUserFlow } from '../../../redux/Actions';

const UserSelection: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'UserSelection'>
    >();

  const dispatch = useDispatch();

  const handleNext = () => {
    dispatch(setUserFlow('Customer'))
    navigation.navigate('SignUp')
  }

  const handleNext2 = () => {
    dispatch(setUserFlow('Cleaner'))
    navigation.navigate('SignUp')
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <View style={styles.container}>
        <HeaderComponent />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Register Yourself As</Text>
        </View>
        <View style={styles.selectionContainer}>
          <SelectionButton
            title="Customer / Get Cleaning Service"
            onPress={handleNext}
            icon={Icons.customer}
          />
        </View>
        <View style={styles.selectionContainer}>
          <SelectionButton
            title="Business Owner /Cleaner"
            onPress={handleNext2}
            icon={Icons.owner}
          />
        </View>
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Let us know how you would like to register yourself!
          </Text>
        </View>
      </View>
      <View style={styles.imageContainer}>
        <Image
          source={IMAGES.stars}
          resizeMode="contain"
          style={styles.image}
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
    backgroundColor: Colors.background,
  },
  titleContainer: {
    marginTop: RFPercentage(9),
    alignSelf: 'center',
    width: '90%',
    justifyContent: 'center',
  },
  title: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.2),
    textAlign: 'center',
  },
  selectionContainer: {
    marginTop: RFPercentage(3.5),
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  descriptionContainer: {
    marginTop: RFPercentage(4.6),
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  description: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    textAlign: 'center',
    width: '80%',
  },
  imageContainer: {
    position: 'absolute',
    bottom: RFPercentage(14),
    right: RFPercentage(1.5),
  },
  image: {
    width: RFPercentage(8),
    height: RFPercentage(8),
  },
});
