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
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {Fonts, IMAGES, Colors} from '../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../routers/StackNavigator';
import HeaderComponent from '../../components/HeaderComponent';

const {width, height} = Dimensions.get('window');

const stepsData = [
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

const OnBoarding = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'OnBoarding'>
    >();
  const [step, setStep] = useState(1);

  // Animations
  const imageAnim = useRef(new Animated.Value(-width)).current; // From left
  const textAnim = useRef(new Animated.Value(height * 0.1)).current; // From bottom
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const nextPress = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      navigation.navigate('UserSelection');
    }
  };

  useEffect(() => {
    // Reset animation values
    imageAnim.setValue(-width);
    textAnim.setValue(height * 0.1);
    opacityAnim.setValue(0);

    Animated.parallel([
      Animated.timing(imageAnim, {
        toValue: 0, 
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: 0, 
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <View style={styles.container}>
        <HeaderComponent />
        <View style={styles.content}>
          {/* Animated Image */}
          <Animated.Image
            source={stepsData[step - 1]?.image}
            resizeMode="contain"
            style={[
              styles.image,
              {
                transform: [{translateX: imageAnim}],
                opacity: opacityAnim,
              },
            ]}
          />

          {/* Animated Text */}
          <Animated.View
            style={{
              marginTop: height * 0.05,
              alignItems: 'center',
              transform: [{translateY: textAnim}],
              opacity: opacityAnim,
            }}>
            <Text style={styles.title}>{stepsData[step - 1]?.title}</Text>
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>
                {stepsData[step - 1]?.description}
              </Text>
            </View>
          </Animated.View>

          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            {[1, 2, 3].map(index => (
              <TouchableOpacity key={index} onPress={() => setStep(index)}>
                {step === index ? (
                  <LinearGradient
                    colors={[Colors.gradient1, Colors.gradient2]}
                    style={styles.activeDot}
                  />
                ) : (
                  <View style={styles.inactiveDot} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonWrapper}>
          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', width:'80%'}}>
            <NextButton title="Skip" onPress={() => setStep(3)} />
            <NextButton title="Next" onPress={nextPress} />
          </View>
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
            width: RFPercentage(10),
            height: RFPercentage(10),
          }}
        />
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
    backgroundColor: Colors.background,
    paddingTop: height * 0.02,
  },
  content: {
    alignSelf: 'center',
    alignItems: 'center',
    width: '90%',
    marginTop: RFPercentage(12),
  },
  image: {
    width: width * 0.9,
    height: height * 0.2,
  },
  title: {
    color: Colors.primaryText,
    fontSize: RFPercentage(2.5),
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  descriptionContainer: {
    width: '80%',
    marginVertical: RFPercentage(1.5),
  },
  description: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFPercentage(1),
  },
  activeDot: {
    width: RFPercentage(0.8),
    height: RFPercentage(0.8),
    borderRadius: 8,
    marginHorizontal: 3,
  },
  inactiveDot: {
    width: RFPercentage(0.8),
    height: RFPercentage(0.8),
    borderRadius: 8,
    marginHorizontal: 3,
    backgroundColor: 'rgba(209, 213, 219, 1)',
  },
  buttonWrapper: {
    width: '90%',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: height * 0.22,
    alignItems:'center'
  },
});
