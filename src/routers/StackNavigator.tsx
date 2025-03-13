import { StyleSheet, Text, View } from 'react-native'
import React, { useState, useEffect } from 'react'
import { DarkTheme, NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Splash from '../screens/splashscreens/Splash';
import OnBoarding from '../screens/onboarding/OnBoarding';
import OnBoardingTwo from '../screens/onboarding/OnBoardingTwo';
import SignIn from '../screens/authscreens/SignIn';
import SignUp from '../screens/authscreens/SignUp';
import ResetPassword from '../screens/authscreens/ResetPassword';
import Verify from '../screens/authscreens/Verify';
import ChangePassword from '../screens/authscreens/ChangePassword';
// import BottomNavigation from './BottomNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import OrderCompleted from '../screens/homescreens/home/OrderCompleted';
// import OrderFuel from '../screens/homescreens/home/OrderFuel';
// import PaymentMethod from '../screens/homescreens/home/PaymentMethod';
// import PlaceOrder from '../screens/homescreens/home/PlaceOrder';
// import EditProfile from '../screens/homescreens/profile/EditProfile';
// import ChangePasswordScreen from '../screens/homescreens/profile/ChangePassword';
// import Cards from '../screens/homescreens/profile/Cards';
// import AddCard from '../screens/homescreens/profile/AddCard';
// import FAQS from '../screens/homescreens/settings/FAQ';
// import Terms from '../screens/homescreens/settings/Terms';
// import Privacy from '../screens/homescreens/settings/Privacy';
// import AddVehicle from '../screens/homescreens/vehicles/AddVehicle';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import messaging from '@react-native-firebase/messaging';
// import VitalsDetails from '../screens/chart/VitalsDetails';
// import BarChartScreen from '../screens/chart/BarChart';
// import { navigationRef } from '../../index'

export type RootStackParamList = {
    Splash: undefined;
    OnBoarding: undefined;
    OnBoardingTwo: undefined;
    SignIn: undefined;
    SignUp: undefined;
    ResetPassword: undefined;
    Verify: undefined;
    ChangePassword: undefined;
    // Home: undefined;
    // OrderCompleted: undefined;
    // FuelOrder: undefined;
    // PaymentMethod: undefined;
    // PlaceOrder: undefined;
    // EditProfile: undefined;
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
                    <Stack.Screen name='OnBoardingTwo' component={OnBoardingTwo} />
                    <Stack.Screen name='SignUp' component={SignUp} />
                    <Stack.Screen name='SignIn' component={SignIn} />
                    <Stack.Screen name='ResetPassword' component={ResetPassword} />
                    <Stack.Screen name='Verify' component={Verify} />
                    <Stack.Screen name='ChangePassword' component={ChangePassword} />
                    {/* <Stack.Screen name='Home' component={BottomNavigation} /> */}
                    {/* <Stack.Screen name='OrderCompleted' component={OrderCompleted} />
                    <Stack.Screen name='FuelOrder' component={OrderFuel} />
                    <Stack.Screen name='PaymentMethod' component={PaymentMethod} />
                    <Stack.Screen name='PlaceOrder' component={PlaceOrder} />
                    <Stack.Screen name='EditProfile' component={EditProfile} />
                    <Stack.Screen name='ChangePasswordScreen' component={ChangePasswordScreen} />
                    <Stack.Screen name='Cards' component={Cards} />
                    <Stack.Screen name='AddCard' component={AddCard} />
                    <Stack.Screen name='FAQS' component={FAQS} />
                    <Stack.Screen name='Terms' component={Terms} />
                    <Stack.Screen name='Privacy' component={Privacy} />
                    <Stack.Screen name='AddVehicle' component={AddVehicle} />
                    <Stack.Screen name='VitalsDetails' component={VitalsDetails} />
                    <Stack.Screen name='BarChartScreen' component={BarChartScreen} /> */}
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>

    )
}

export default StackNavigator

const styles = StyleSheet.create({})