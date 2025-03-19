import {StyleSheet, Text, View} from 'react-native';
import React, {useState, useEffect} from 'react';
import {DarkTheme, NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Splash from '../screens/splashscreens/Splash';
import OnBoarding from '../screens/onboarding/OnBoarding';
import UserSelection from '../screens/onboarding/UserSelection';
import SignIn from '../screens/authscreens/SignIn';
import SignUp from '../screens/authscreens/SignUp';
import ResetPassword from '../screens/authscreens/ResetPassword';
import Verify from '../screens/authscreens/Verify';
import ChangePassword from '../screens/authscreens/ChangePassword';
import CustomerNavigator from './CustomerNavigator';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import ServiceDetails from '../screens/homescreens/home/ServiceDetails';
import PostJob from '../screens/homescreens/home/PostJob';
import JobPosted from '../screens/homescreens/home/JobPosted';
import EditProfile from '../screens/homescreens/profile/EditProfile';
import JobDetails from '../screens/homescreens/jobBoard/JobDetails';
import FAQS from '../screens/homescreens/settings/Faqs';
import Terms from '../screens/homescreens/settings/Terms';
import Privacy from '../screens/homescreens/settings/PrivacyPolicy';
import ChangePasswordV2 from '../screens/homescreens/settings/ChangePassword';
import Premium from '../screens/cleanerflow/premium/Premium';
import CleanerNavigator from './CleanerNavigator';
import ServiceOne from '../screens/cleanerflow/homescreens/home/ServiceOne';
import ServiceTwo from '../screens/cleanerflow/homescreens/home/ServiceTwo';
import ServiceThree from '../screens/cleanerflow/homescreens/home/ServiceThree';
import HomeScreen from '../screens/cleanerflow/homescreens/home/Home';

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
  JobDetails: undefined;
  EditProfile: undefined;
  ChangePasswordV2: undefined;
  FAQS: undefined;
  Terms: undefined;
  Privacy: undefined;
  Premium: undefined;
  CleanerNavigator: undefined;
  ServiceOne : undefined;
  ServiceTwo : undefined;
  ServiceThree : undefined;
  HomeScreen : undefined;
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
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
          initialRouteName={'Splash'}>
          <Stack.Screen name="Splash" component={Splash} />
          <Stack.Screen name="OnBoarding" component={OnBoarding} />
          <Stack.Screen name="UserSelection" component={UserSelection} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="SignIn" component={SignIn} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} />
          <Stack.Screen name="Verify" component={Verify} />
          <Stack.Screen name="ChangePassword" component={ChangePassword} />
          <Stack.Screen name="Home" component={CustomerNavigator} />
          <Stack.Screen name="ServiceDetails" component={ServiceDetails} />
          <Stack.Screen name="PostJob" component={PostJob} />
          <Stack.Screen name="JobPosted" component={JobPosted} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="JobDetails" component={JobDetails} />
          <Stack.Screen name="FAQS" component={FAQS} />
          <Stack.Screen name="Terms" component={Terms} />
          <Stack.Screen name="Privacy" component={Privacy} />
          <Stack.Screen name="ChangePasswordV2" component={ChangePasswordV2} />

          {/* ----------------- Cleaner Flow ---------------- */}
          <Stack.Screen name="Premium" component={Premium} />
          <Stack.Screen name="CleanerNavigator" component={CleanerNavigator} />
          <Stack.Screen name="ServiceOne" component={ServiceOne} />
          <Stack.Screen name="ServiceTwo" component={ServiceTwo} />
          <Stack.Screen name="ServiceThree" component={ServiceThree} />
          <Stack.Screen name="HomeScreen" component={HomeScreen} />

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default StackNavigator;

const styles = StyleSheet.create({});
