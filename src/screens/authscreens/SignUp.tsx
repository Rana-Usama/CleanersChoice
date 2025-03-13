import {
    Dimensions,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity
} from 'react-native';
import React, { useState } from 'react';
import NextButton from '../../components/NextButton';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Fonts, IMAGES, Colors, Icons } from '../../constants/Themes';
import { RFPercentage } from "react-native-responsive-fontsize";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../routers/StackNavigator';
import { RadioButton, RadioButtonInput } from 'react-native-simple-radio-button';
import HeaderComponent from '../../components/HeaderComponent';
import InputField from '../../components/InputField';
import PasswordField from '../../components/PasswordField';
import GradientButton from '../../components/GradientButton';
import ImagePicker from 'react-native-image-crop-picker';

const { width, height } = Dimensions.get('window');

const SignUp: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'SignUp'>>();
    const [selected, setSelected] = useState<boolean>(false);
    const [img, setImg] = useState(null)
    console.log('img................',img)

    const uploadImg = () => {
        console.log("Opening Image Picker...");
        ImagePicker.openPicker({
            width: 1000,
            height: 1000,
            cropping: true
        }).then(image => {
            console.log("Selected Image:", image);
            setImg(image);
        }).catch(error => {
            console.log("Image Picker Error:", error);
        });
    };
    

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={'dark-content'} translucent backgroundColor="transparent" />
            <HeaderComponent />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    <View style={styles.container}>
                        <View style={{ alignSelf: 'center' }}>
                            <Text style={{ color: Colors.primaryText, fontFamily: Fonts.fontMedium, fontSize: RFPercentage(1.9), textAlign: 'center' }}>
                                Create an account
                            </Text>
                        </View>

                        <View style={{ marginTop: RFPercentage(3) }}>
                            <TouchableOpacity onPress={uploadImg}>
                                <View style={styles.pictureContainer}>
                                    {
                                        img ?
                                            <>
                                                <Image source={img?.path} resizeMode='cover' style={{
                                                    width: RFPercentage(14),
                                                    height: RFPercentage(14),
                                                    borderRadius: RFPercentage(10),
                                                }} />
                                            </>
                                            :
                                            <>
                                                <Text style={{ color: Colors.secondaryText, fontFamily: Fonts.fontRegular, fontSize: RFPercentage(1.3) }}>
                                                    Upload Picture
                                                </Text>
                                            </>
                                    }

                                </View>
                                {
                                    img && (
                                        <>
                                            <TouchableOpacity onPress={uploadImg}>
                                                <Image source={Icons.edit} resizeMode='contain' style={{ width: RFPercentage(3), height: RFPercentage(3), position: 'absolute', left: RFPercentage(10), bottom: RFPercentage(0.6) }} />
                                            </TouchableOpacity>
                                        </>
                                    )
                                }
                            </TouchableOpacity>
                        </View>

                        <View style={{ alignSelf: 'center', marginTop: RFPercentage(1.5), width: '100%', alignItems: 'center' }}>
                            <InputField placeholder='Username' />
                            <InputField placeholder='Email' />
                            <PasswordField placeholder='Password' />
                            <PasswordField placeholder='Confirm Password' />
                            <InputField placeholder='Phone Number' />
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginLeft: RFPercentage(1) }}>
                            <RadioButton>
                                <RadioButtonInput
                                    obj={{ value: 0 }}
                                    index={0}
                                    isSelected={selected}
                                    onPress={() => setSelected(!selected)}
                                    borderWidth={1}
                                    buttonInnerColor={Colors.gradient1}
                                    buttonOuterColor={selected ? Colors.gradient1 : 'rgba(229, 231, 235, 1)'}
                                    buttonSize={6}
                                    buttonOuterSize={12}
                                />
                            </RadioButton>
                            <Text style={{ color: Colors.primaryText, fontSize: RFPercentage(1.4), fontFamily: Fonts.fontRegular, bottom: 2, marginLeft: RFPercentage(0.8) }}>I agree to terms and conditions</Text>
                        </View>

                        <View style={{ alignSelf: 'flex-end', position: 'absolute', top: RFPercentage(65) }}>
                            <Image
                                source={IMAGES.stars}
                                resizeMode='contain'
                                style={{ width: RFPercentage(10), height: RFPercentage(10) }}
                            />
                        </View>
                        <View style={{ alignSelf: 'center', marginTop: RFPercentage(5) }}>
                            <View style={{ left: RFPercentage(1.5) }}>
                                <GradientButton title='Sign Up' />
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: RFPercentage(1) }}>
                                <Text style={{ color: Colors.secondaryText, fontSize: RFPercentage(1.2), fontFamily: Fonts.fontRegular }}>Already have an account?</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                                    <Text style={{ color: Colors.gradient1, fontSize: RFPercentage(1.2), fontFamily: Fonts.fontRegular, left: 3 }}> Signin</Text>
                                </TouchableOpacity>

                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignUp;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
        paddingHorizontal: width * 0.05,
        backgroundColor: Colors.background,
        alignItems: 'center',
    },
    pictureContainer: {
        width: RFPercentage(14),
        height: RFPercentage(14),
        borderRadius: RFPercentage(10),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(243, 244, 246, 1)',
        borderWidth: 1,
        borderColor: 'rgba(64, 123, 255, 1)',
        shadowColor: 'rgba(0, 0, 0, 0.15)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 40,
    }

});
