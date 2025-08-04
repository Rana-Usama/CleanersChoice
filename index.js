/**
 * @format
 */

import {AppRegistry, Linking} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {FirebaseApp, initializeApp} from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

const handleNotificationNavigation = screen => {
  if (!screen) return;

  const supportedScreens = ['messages'];
  if (supportedScreens.includes(screen.toLowerCase())) {
    Linking.openURL(`cleanerChoiceApp://${screen.toLowerCase()}`);
  }
};

// Foreground/background notification tap handler
messaging().onNotificationOpenedApp(remoteMessage => {
  handleNotificationNavigation(remoteMessage?.data?.screen);
});

// App opened from quit state
messaging()
  .getInitialNotification()
  .then(remoteMessage => {
    if (remoteMessage) {
      handleNotificationNavigation(remoteMessage?.data?.screen);
    }
  });

initializeApp();

AppRegistry.registerComponent(appName, () => App);
