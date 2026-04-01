/**
 * @format
 */
import 'react-native-get-random-values';

import {AppRegistry, Linking, Platform} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {FirebaseApp, initializeApp} from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import notifee, {EventType} from '@notifee/react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

const handleNotificationNavigation = screen => {
  if (!screen) return;

  const supportedScreens = ['messages', 'notifications'];
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

// Handle notifee notification tap in background/quit state
notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.PRESS && detail.notification?.data?.type === 'invoice_download') {
    const {contentUri, mimeType} = detail.notification.data;
    if (contentUri && Platform.OS === 'android') {
      try {
        await ReactNativeBlobUtil.android.actionViewIntent(
          String(contentUri),
          String(mimeType || 'application/pdf'),
        );
      } catch (_) {}
    }
  }
});

initializeApp();

AppRegistry.registerComponent(appName, () => App);
