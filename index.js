/**
 * @format
 */
import 'react-native-get-random-values';

import {AppRegistry, Platform} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {FirebaseApp, initializeApp} from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import notifee, {EventType} from '@notifee/react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {applyGlobalFontScaleCap} from './src/utils/fontScaling';
import {handleNotificationTap} from './src/utils/notificationNavigation';

// Cap OS accessibility font scaling app-wide before anything renders.
applyGlobalFontScaleCap();

// Tap on an OS-rendered notification while the app is backgrounded.
messaging().onNotificationOpenedApp(remoteMessage => {
  handleNotificationTap(remoteMessage?.data);
});

// App opened from quit state. The navigator does not exist yet, so the payload
// is queued and replayed by StackNavigator once the stack is mounted.
messaging()
  .getInitialNotification()
  .then(remoteMessage => {
    if (remoteMessage) {
      handleNotificationTap(remoteMessage.data);
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
