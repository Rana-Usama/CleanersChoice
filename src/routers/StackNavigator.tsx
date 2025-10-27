import {StyleSheet} from 'react-native';
import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Splash from '../screens/commonflow/splashscreens/Splash';
import OnBoarding from '../screens/commonflow/onboarding/OnBoarding';
import UserSelection from '../screens/commonflow/onboarding/UserSelection';
import SignIn from '../screens/commonflow/authscreens/SignIn';
import SignUp from '../screens/commonflow/authscreens/SignUp';
import ResetPassword from '../screens/commonflow/authscreens/ResetPassword';
import CustomerNavigator from './CustomerNavigator';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import ServiceDetails from '../screens/customerflow/home/ServiceDetails';
import PostJob from '../screens/customerflow/home/PostJob';
import JobPosted from '../screens/customerflow/home/JobPosted';
import EditProfile from '../screens/commonflow/home/profile/EditProfile';
import JobDetails from '../screens/commonflow/home/JobDetails';
import FAQS from '../screens/commonflow/home/settings/Faqs';
import Terms from '../screens/commonflow/home/settings/Terms';
import Privacy from '../screens/commonflow/home/settings/PrivacyPolicy';
import ChangePasswordV2 from '../screens/commonflow/home/settings/ChangePassword';
import Premium from '../screens/cleanerflow/premium/Premium';
import CleanerNavigator from './CleanerNavigator';
import ServiceOne from '../screens/cleanerflow/homescreens/home/ServiceOne';
import ServiceTwo from '../screens/cleanerflow/homescreens/home/ServiceTwo';
import ServiceThree from '../screens/cleanerflow/homescreens/home/ServiceThree';
import CancelSubscription from '../screens/cleanerflow/premium/CancelSubscription';
import Availability from '../screens/commonflow/home/Availability';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CheckAvailability from '../screens/customerflow/home/CheckAvailablity';
import Jobs from '../screens/customerflow/jobBoard/Jobs';
import Chat from '../screens/commonflow/home/Chat';
import Messages from '../screens/commonflow/home/Messages';
import firestore from '@react-native-firebase/firestore';
import Decider from './Decider';
import Location from '../screens/commonflow/location/Location';

export type RootStackParamList = {
  SplashOne: undefined;
  OnBoarding: undefined;
  UserSelection: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ResetPassword: undefined;
  Home: undefined;
  ServiceDetails: {item: any};
  PostJob: {jobId: string | null};
  JobPosted: undefined;
  JobDetails: {item: any};
  EditProfile: undefined;
  ChangePasswordV2: undefined;
  FAQS: undefined;
  Terms: undefined;
  Privacy: undefined;
  Premium: undefined;
  CleanerNavigator: undefined;
  ServiceOne: undefined;
  ServiceTwo: undefined;
  ServiceThree: undefined;
  HomeScreen: undefined;
  CancelSubscription: undefined;
  Availability: undefined;
  Settings: undefined;
  CheckAvailability: {item: any};
  Jobs: undefined;
  Chat: {
    chatId: string;
    senderId?: string;
    senderName: string;
    receiver: string;
    receiverName: string;
    receiverProfile: string;
    fcmToken: string;
  };
  Messages: undefined;
  Location:undefined
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator: React.FC = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [loggedOut, setLoggedOut] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredentialsAndUserData = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('email');
        const storedPassword = await AsyncStorage.getItem('password');
        const storedUser = await AsyncStorage.getItem('role');
        const logOut = await AsyncStorage.getItem('logout');

        setEmail(storedEmail);
        setPassword(storedPassword);
        setUser(storedUser);
        setLoggedOut(logOut);

        if (storedEmail) {
          const userQuery = await firestore()
            .collection('Users')
            .where('email', '==', storedEmail)
            .get();

          if (!userQuery.empty) {
            const userDoc = userQuery.docs[0].data();
            setUserData(userDoc);
          }
        }
      } catch (error) {
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
    };

    fetchCredentialsAndUserData();
  }, []);

  const linking = {
    prefixes: ['cleanerChoiceApp://'],
    config: {
      screens: {
        Home: {
          screens: {
            Messages: 'messages',
          },
        },
        CleanerNavigator: {
          screens: {
            Messages: 'messages',
          },
        },
      },
    },
  };

  console.log(email, password, user);

  const now = Date.now();
  const expiry = userData?.subscriptionEndDate;

  const hasActiveSub = expiry && expiry > now;

  let initialRoute: keyof RootStackParamList = 'SplashOne';

  if (email && password && user === 'Customer') {
    initialRoute = 'Home';
  } else if (email && password && user === 'Cleaner' && hasActiveSub) {
    initialRoute = 'CleanerNavigator';
  } else if (user === 'Cleaner') {
    initialRoute = 'Premium';
  } else if (loggedOut === 'yes') {
    initialRoute = 'SignIn';
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isLoading ? (
          <Decider />
        ) : (
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
            initialRouteName={initialRoute}>
            {/* -------Common Screens----- */}
            <Stack.Screen name="SplashOne" component={Splash} />
            <Stack.Screen name="OnBoarding" component={OnBoarding} />
            <Stack.Screen name="UserSelection" component={UserSelection} />
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="SignIn" component={SignIn} />
            <Stack.Screen name="ResetPassword" component={ResetPassword} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen name="JobDetails" component={JobDetails} />
            <Stack.Screen name="FAQS" component={FAQS} />
            <Stack.Screen name="Terms" component={Terms} />
            <Stack.Screen name="Privacy" component={Privacy} />
            <Stack.Screen
              name="ChangePasswordV2"
              component={ChangePasswordV2}
            />
            <Stack.Screen name="Availability" component={Availability} />
            <Stack.Screen name="Chat" component={Chat} />
            <Stack.Screen name="Messages" component={Messages} />
            <Stack.Screen name="Location" component={Location} />

            {/* ------------------Customer Flow------------- */}
            <Stack.Screen name="Home" component={CustomerNavigator} />
            <Stack.Screen name="ServiceDetails" component={ServiceDetails} />
            <Stack.Screen name="PostJob" component={PostJob} />
            <Stack.Screen name="JobPosted" component={JobPosted} />
            <Stack.Screen
              name="CheckAvailability"
              component={CheckAvailability}
            />
            <Stack.Screen name="Jobs" component={Jobs} />

            {/* ----------------- Cleaner Flow ---------------- */}
            <Stack.Screen name="Premium" component={Premium} />
            <Stack.Screen
              name="CleanerNavigator"
              component={CleanerNavigator}
            />
            <Stack.Screen name="ServiceOne" component={ServiceOne} />
            <Stack.Screen name="ServiceTwo" component={ServiceTwo} />
            <Stack.Screen name="ServiceThree" component={ServiceThree} />
            <Stack.Screen
              name="CancelSubscription"
              component={CancelSubscription}
            />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default StackNavigator;

const styles = StyleSheet.create({});
