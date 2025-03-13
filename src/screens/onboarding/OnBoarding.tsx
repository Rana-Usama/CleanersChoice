import {
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableOpacity,
} from 'react-native';
import React, {useState, useRef, useEffect} from 'react';
import NextButton from '../../components/NextButton';
//   import SkipButton from '../../components/SkipButton';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {Fonts, IMAGES, Colors} from '../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../routers/StackNavigator';
import HeaderComponent from '../../components/HeaderComponent';
const {width, height} = Dimensions.get('window');

interface StepsData {
  image: any;
  title: string;
  description: string;
}

const stepsData: StepsData[] = [
  {
    image: IMAGES.onBoarding1,
    title: 'List your services',
    description:
      'List your cleaning services with details for customers to contact you',
  },
  {
    image: IMAGES.onBoarding2,
    title: 'Get your space cleaned',
    description:
      'Reach best cleaning businesses to clean up your precious spaces',
  },
  {
    image: IMAGES.onBoarding3,
    title: 'Post Cleaning Jobs',
    description:
      'Post cleaning jobs for businesses to reach you with custom offers',
  },
];

const OnBoarding: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'OnBoarding'>
    >();
  const [step, setStep] = useState<number>(1);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const nextPress = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      navigation.navigate('OnBoardingTwo');
    }
  };

  const skipPress = () => {
    setStep(3);
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <HeaderComponent />
      <View style={styles.container}>
        <View
          style={{
            alignSelf: 'center',
            alignItems: 'center',
            marginTop: RFPercentage(9),
          }}>
          <View style={{}}>
            {stepsData[step - 1] && (
              <Animated.Image
                source={stepsData[step - 1].image}
                resizeMode="contain"
                style={{
                  width: width * 0.9,
                  height: height * 0.2,
                  transform: [{scale: scaleAnim}],
                  opacity: opacityAnim,
                }}
              />
            )}
          </View>

          <View style={{marginTop: height * 0.05}}>
            <Text style={styles.title}>{stepsData[step - 1].title}</Text>
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>
                {stepsData[step - 1].description}
              </Text>
            </View>
          </View>

          <View style={styles.dotsContainer}>
            {[1, 2, 3].map(index => (
              <TouchableOpacity key={index} onPress={() => setStep(index)}>
                {step === index ? (
                  <LinearGradient
                    colors={[Colors.gradient1, Colors.gradient2]}
                    style={{
                      width: RFPercentage(0.8),
                      height: RFPercentage(0.8),
                      borderRadius: 8,
                      marginHorizontal: 3,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: RFPercentage(0.8),
                      height: RFPercentage(0.8),
                      borderRadius: 8,
                      marginHorizontal: 3,
                      backgroundColor: 'rgba(209, 213, 219, 1)',
                    }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{alignSelf: 'flex-end'}}>
          <Image
            source={IMAGES.stars}
            resizeMode="contain"
            style={{
              width: RFPercentage(10),
              height: RFPercentage(10),
              top: RFPercentage(12),
              left: RFPercentage(2),
            }}
          />
        </View>

        <View style={styles.buttonContainer}>
          <NextButton title={'Skip'} onPress={skipPress} />
          <NextButton
            title={'Next'}
            onPress={
              step === 4
                ? () => navigation.navigate('OnBoardingTwo')
                : nextPress
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OnBoarding;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    backgroundColor: Colors.background,
    // paddingTop: height * 0.03,
    alignItems: 'center',
  },
  title: {
    color: Colors.primaryText,
    fontSize: RFPercentage(2.5),
    fontFamily: Fonts.semiBold,
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
    lineHeight: 20,
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
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: RFPercentage(3.2),
    // marginLeft: RFPercentage(1.55),
    bottom: RFPercentage(2),
  },
});
