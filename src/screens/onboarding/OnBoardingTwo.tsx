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
import NextButton from '../../components/NextButton';
//   import SkipButton from '../../components/SkipButton';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Fonts, IMAGES, Colors, Icons } from '../../constants/Themes';
import { RFPercentage } from "react-native-responsive-fontsize";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../routers/StackNavigator';
import SelectionButton from '../../components/SelectionButton';
import HeaderComponent from '../../components/HeaderComponent';

const { width, height } = Dimensions.get('window');



const OnBoardingTwo: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'OnBoardingTwo'>>()

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={'dark-content'} translucent backgroundColor="transparent" />
            <HeaderComponent />
            <View style={styles.container}>
                <View style={{ marginTop: RFPercentage(7), alignSelf: 'center' }}>
                    <Text style={{ color: Colors.primaryText, fontFamily: Fonts.semiBold, fontSize: RFPercentage(2.2), textAlign: 'center' }}>Register Yourself As</Text>
                </View>
                <View style={{ marginTop: RFPercentage(4.8) }}>
                    <SelectionButton title='Customer / Get Cleaning Service' onPress={() => console.log('hi')} icon={Icons.customer} />
                </View>
                <View style={{ marginTop: RFPercentage(4) }}>
                    <SelectionButton title='Business Owner /Cleaner' onPress={() => console.log('hi')} icon={Icons.owner} />
                </View>
                <View style={{ marginTop: RFPercentage(3.9), paddingHorizontal: RFPercentage(4) }}>
                    <Text style={{ color: Colors.primaryText, fontFamily: Fonts.fontRegular, fontSize: RFPercentage(1.5), textAlign: 'center' }}>Let us know how you would like to register yourself!</Text>

                </View>
                <View style={{ alignSelf: 'flex-end' }}>
                    <Image
                        source={IMAGES.stars}
                        resizeMode='contain'
                        style={{ width: RFPercentage(10), height: RFPercentage(10), top: RFPercentage(20), left: RFPercentage(2) }}
                    />
                </View>


            </View>

        </SafeAreaView>
    );
};

export default OnBoardingTwo;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
        paddingHorizontal: width * 0.05,
        backgroundColor: Colors.background,
        paddingTop: height * 0.03,
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
        marginTop: RFPercentage(1)
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
        bottom: RFPercentage(2)
    },
});
