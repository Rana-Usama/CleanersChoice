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

const { width, height } = Dimensions.get('window');

const SignIn: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'SignIn'>>();
    const [selected, setSelected] = useState<boolean>(false);

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
                        <View style={{ alignSelf: 'center', marginVertical:RFPercentage(0.8) }}>
                            <Text style={{ color: Colors.primaryText, fontFamily: Fonts.fontMedium, fontSize: RFPercentage(1.9), textAlign: 'center' }}>
                            Welcome Back
                            </Text>
                        </View>

                        <View style={{ alignSelf: 'center', marginTop: RFPercentage(1.8), width: '100%', alignItems: 'center' }}>
                            <InputField placeholder='Username' />
                            <PasswordField placeholder='Password' />

                        </View>
                        <View style={styles.radioContainer}>
                                    <View style={styles.radioButtonRow}>
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
                                        <Text style={styles.radioLabel}>Remember me?</Text>
                                    </View>

                                    <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
                                        <Text style={styles.forgotPassword}>Forgot Password?</Text>
                                    </TouchableOpacity>
                                </View>

                        <View style={{alignSelf: 'center', marginTop:RFPercentage(5) }}>
                            <View style={{left:RFPercentage(1.5)}}>
                                <GradientButton title='Sign In' />
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop:RFPercentage(3.5) }}>
                                <Text style={{ color: Colors.secondaryText, fontSize: RFPercentage(1.3), fontFamily: Fonts.fontRegular }}>Don't have an account?</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                                    <Text style={{ color: Colors.gradient1, fontSize: RFPercentage(1.3), fontFamily: Fonts.fontRegular, left: 3 }}> Signup</Text>
                                </TouchableOpacity>

                            </View>
                        </View>

                        <View style={{ alignSelf: 'flex-end', position: 'absolute',top:RFPercentage(65) }}>
                            <Image
                                source={IMAGES.stars}
                                resizeMode='contain'
                                style={{ width: RFPercentage(10), height: RFPercentage(10), }}
                            />
                        </View>
                       
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignIn;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
        paddingHorizontal: width * 0.05,
        backgroundColor: Colors.background,
        // alignItems: 'center',
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
        // shadowColor: 'red',
        // shadowOffset: { width: 40, height: 40 },
        // shadowOpacity: 0,
        // shadowRadius: 0,
        // elevation: 8,
    },
    radioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: RFPercentage(0.3),
        paddingHorizontal:RFPercentage(1.4)
    },
    radioButtonRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioLabel: {
        fontSize: RFPercentage(1.4),
        color: Colors.primaryText,
        marginLeft: 5,
        fontFamily: Fonts.fontRegular,
        bottom: 1.5
    },
    forgotPassword: {
        fontSize: RFPercentage(1.4),
        color: Colors.primaryText,
        fontFamily: Fonts.fontRegular,
        bottom: 1.5
    },
    
});
