import { StyleSheet, Text, View } from 'react-native'
import React, { useState, useEffect } from 'react'
import { DarkTheme, NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Splash from '../screens/splashscreens/Splash';
import OnBoarding from '../screens/onboarding/OnBoarding';
import UserSelection from '../screens/onboarding/UserSelection';
import SignIn from '../screens/authscreens/SignIn';
import SignUp from '../screens/authscreens/SignUp';
import ResetPassword from '../screens/authscreens/ResetPassword';
import Verify from '../screens/authscreens/Verify';
import ChangePassword from '../screens/authscreens/ChangePassword';
import BottomNavigation from './BottomTabNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ServiceDetails from '../screens/homescreens/home/ServiceDetails';
import PostJob from '../screens/homescreens/home/PostJob';
import JobPosted from '../screens/homescreens/home/JobPosted';
import EditProfile from '../screens/homescreens/profile/EditProfile';

export type RootStackParamList = {
    Splash: undefined;
    OnBoarding: undefined;
    UserSelection: undefined;
    SignIn: undefined;
    SignUp: undefined;
    ResetPassword: undefined;
    Verify: undefined;
    ChangePassword: undefined;
    Home: undefined;
    ServiceDetails: undefined;
    PostJob: undefined;
    JobPosted: undefined;
    // PlaceOrder: undefined;
    EditProfile: undefined;
    // ChangePasswordScreen: undefined;
    // Cards: undefined;
    // AddCard: undefined;
    // FAQS: undefined;
    // Terms: undefined;
    // Privacy: undefined;
    // AddVehicle: undefined;
    // VitalsDetails : undefined;
    // BarChartScreen : undefined
};


const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator: React.FC = () => {

    // const [email, setEmail] = useState<string | null>(null);
    // const [password, setPassword] = useState<string | null>(null);
    // const [loading, setLoading] = useState(true);
    // const [google, setGoogle] = useState<string | null>(null);
    // const [facebook, setFaceBook] = useState<string | null>(null);


    // useEffect(() => {
    //     const fetchCredentials = async () => {
    //         try {
    //             const storedEmail = await AsyncStorage.getItem('email');
    //             const storedPassword = await AsyncStorage.getItem('password');
    //             const storedGoogle = await AsyncStorage.getItem('google');
    //             const storedFacebook = await AsyncStorage.getItem('facebook');

    //             setFaceBook(storedFacebook);
    //             setGoogle(storedGoogle);
    //             setEmail(storedEmail);
    //             setPassword(storedPassword);
    //         } catch (error) {
    //             console.error('Error fetching credentials:', error);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     fetchCredentials();
    // }, []);

    // if (loading) return null;


    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator screenOptions={{
                    headerShown: false
                }}
                    initialRouteName={'Splash'}>
                    <Stack.Screen name='Splash' component={Splash} />
                    <Stack.Screen name='OnBoarding' component={OnBoarding} />
                    <Stack.Screen name='UserSelection' component={UserSelection} />
                    <Stack.Screen name='SignUp' component={SignUp} />
                    <Stack.Screen name='SignIn' component={SignIn} />
                    <Stack.Screen name='ResetPassword' component={ResetPassword} />
                    <Stack.Screen name='Verify' component={Verify} />
                    <Stack.Screen name='ChangePassword' component={ChangePassword} />
                    <Stack.Screen name='Home' component={BottomNavigation} />
                    <Stack.Screen name='ServiceDetails' component={ServiceDetails} />
                    <Stack.Screen name='PostJob' component={PostJob} />
                    <Stack.Screen name='JobPosted' component={JobPosted} />
                    <Stack.Screen name='EditProfile' component={EditProfile} />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>

    )
}

export default StackNavigator

const styles = StyleSheet.create({})