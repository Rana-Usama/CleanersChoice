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
import NextButton from '../../../components/NextButton';
import LinearGradient from 'react-native-linear-gradient';
import {Fonts, IMAGES, Colors} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import HeaderComponent from '../../../components/HeaderComponent';

const {width, height} = Dimensions.get('window');

const stepsData = [
  {
    image: IMAGES.onBoarding1,
    title: 'Offer Your Cleaning Services',
    description:
      'Create a detailed listing so customers can discover and book your cleaning expertise.',
  },
  {
    image: IMAGES.onBoarding2,
    title: 'Book Trusted Cleaners',
    description:
      'Connect with verified cleaning professionals to refresh your home or workspace.',
  },
  {
    image: IMAGES.onBoarding3,
    title: 'Post a Cleaning Job',
    description:
      'Share your cleaning needs and receive personalized offers from nearby businesses.',
  },
];

const OnBoarding = ({navigation}: any) => {
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
        duration: 1200,
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
              marginTop: RFPercentage(2),
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
              <TouchableOpacity
                activeOpacity={0.8}
                key={index}
                onPress={() => setStep(index)}>
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
      </View>
      <View style={styles.starContainer}>
        <Image source={IMAGES.stars} resizeMode="contain" style={styles.star} />
      </View>
      {/* </ScrollView> */}
      <View style={styles.buttonWrapper}>
        <NextButton
          title="Skip"
          onPress={() => navigation.navigate('UserSelection')}
        />
        <View style={{marginLeft: RFPercentage(2)}}>
          <NextButton title="Next" onPress={nextPress} />
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
    backgroundColor: Colors.background,
  },
  content: {
    alignSelf: 'center',
    alignItems: 'center',
    width: '90%',
    marginTop: RFPercentage(10),
  },
  image: {
    width: width * 0.8,
    height: height * 0.2,
  },
  title: {
    color: Colors.primaryText,
    fontSize: RFPercentage(2),
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    marginTop: RFPercentage(2),
  },
  descriptionContainer: {
    width: '80%',
    marginVertical: RFPercentage(1.2),
  },
  description: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontRegular,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFPercentage(1),
  },
  activeDot: {
    width: RFPercentage(1),
    height: RFPercentage(1),
    borderRadius: RFPercentage(2),
    marginHorizontal: 3,
  },
  inactiveDot: {
    width: RFPercentage(1),
    height: RFPercentage(1),
    borderRadius: RFPercentage(2),
    marginHorizontal: 3,
    backgroundColor: Colors.gray300,
  },
  buttonWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    position: 'absolute',
    bottom: RFPercentage(8),
  },
  starContainer: {
    right: RFPercentage(1.5),
    alignSelf: 'flex-end',
    top: RFPercentage(6),
  },
  star: {
    width: RFPercentage(8),
    height: RFPercentage(8),
  },
});
