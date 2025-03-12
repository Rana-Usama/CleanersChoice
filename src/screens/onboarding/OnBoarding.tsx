import {
    Dimensions,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    Animated
  } from 'react-native';
  import React, { useState, useRef, useEffect } from 'react';
//   import NextButton from '../../components/NextButton';
//   import SkipButton from '../../components/SkipButton';
  import LinearGradient from 'react-native-linear-gradient';
  import { useNavigation } from '@react-navigation/native';
  import { Fonts, IMAGES, Colors } from '../../constants/Themes';
  import { RFPercentage } from "react-native-responsive-fontsize";
  import { NativeStackNavigationProp } from '@react-navigation/native-stack';
  import { RootStackParamList } from '../../routers/StackNavigator';
  
  const { width, height } = Dimensions.get('window');
  
  interface StepsData {
    image : any;
    title : string;
    description : string
  }
  
  const stepsData: StepsData[] = [
    {
      image: IMAGES.onBoarding1,
      title: 'Fueling Convenience',
      description: 'Experience the ease of fuel delivery right to your doorstep.',
    },
    {
      image: IMAGES.onBoarding2,
      title: 'Find Fueling Solution',
      description: 'Forget about the hassle of going to a gas stations.',
    },
    {
      image: IMAGES.onBoarding3,
      title: 'Get Fuel Delivered To You',
      description: 'Experience the convenience of direct fuel delivery',
    }
  ];
  
  
  const OnBoarding: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'OnBoarding'>>()
    const [step, setStep] = useState<number>(1);
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
  
    const nextPress = () => {
      if (step < 3) {
        setStep(step + 1);
      } else {
        // navigation.navigate('SignIn');
      }
    };
  
  
    const skipPress = () => {
      setStep(3)
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
        <StatusBar barStyle={'light-dark'} translucent backgroundColor="transparent" />
        <View style={styles.container}>

        <View style={{ alignSelf: 'flex-start' }}>
            <Image
              source={IMAGES.stars}
              resizeMode='contain'
              style={{ width: 140, height: 90 }}
            />
          </View>
  
          <View style={{ alignSelf: 'center' }}>
            <Image
              source={IMAGES.logo}
              resizeMode='contain'
              style={{ width: 140, height: 90 }}
            />
          </View>
  
          <View style={{ alignSelf: 'center', alignItems: 'center' }}>
            <View style={{ marginTop: height * 0.12 }}>
              {stepsData[step - 1] && (
                <Animated.Image
                  source={stepsData[step - 1].image}
                  resizeMode="contain"
                  style={{
                    width: width * 0.9,
                    height: height * 0.2,
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim,
                  }}
                />
              )}
            </View>
  
            <View style={{ marginTop: height * 0.13 }}>
              <Text style={styles.title}>{stepsData[step - 1].title}</Text>
              <View style={styles.descriptionContainer}>
                <Text style={styles.description}>{stepsData[step - 1].description}</Text>
              </View>
            </View>
  
            <View style={styles.dotsContainer}>
              {[1, 2, 3].map((index) => (
                step === index ? (
                  <LinearGradient
                    key={index}
                    colors={[Colors.gradient1, Colors.gradient2]}
                    style={{
                      width: 20,
                      height: 6,
                      borderRadius: 8,
                      marginHorizontal: 2,
                    }}
                  />
                ) : (
                  <View
                    key={index}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 8,
                      marginHorizontal: 2,
                      backgroundColor: 'rgba(209, 213, 219, 1)',
                    }}
                  />
                )
              ))}
            </View>
          </View>
  
          {/* <View style={styles.buttonContainer}>
            <SkipButton title={'Skip'} color={Colors.secondaryText} onPress={skipPress} />
            <NextButton title={step === 3 ? 'Get Started' : 'Next'} color={Colors.background} onPress={step === 4 ? ()=> navigation.navigate('SignIn') : nextPress} />
          </View> */}
  
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
      paddingTop: height * 0.05,
      alignItems: 'center'
    },
    title: {
      color: Colors.primaryText,
      fontSize: RFPercentage(2.5),
      fontFamily: Fonts.fontBold,
      lineHeight: 27,
      textAlign: 'center',
    },
    descriptionContainer: {
      marginHorizontal: 60,
      marginVertical: 18,
    },
    description: {
      color: Colors.secondaryText,
      fontSize: RFPercentage(1.5),
      fontFamily: Fonts.fontRegular,
      lineHeight: 19,
      textAlign: 'center',
    },
    dotsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
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
      marginLeft: 10,
      alignSelf: 'center',
    },
  });
  