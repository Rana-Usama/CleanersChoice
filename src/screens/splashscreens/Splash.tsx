import {SafeAreaView, StatusBar, StyleSheet, Image} from 'react-native';
import React, {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {IMAGES, Colors} from '../../constants/Themes';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../routers/StackNavigator';

const Splash: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'SplashOne'>>();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.navigate('OnBoarding');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <Image source={IMAGES.logo} style={styles.image} resizeMode="contain" />
    </SafeAreaView>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  image: {
    width: '40%',
    height: '40%',
    bottom: '4%',
  },
});
