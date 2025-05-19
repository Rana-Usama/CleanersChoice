/**
 * @format
 */

import {AppRegistry, Linking} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {FirebaseApp, initializeApp} from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

const handleNotificationNavigation = screen => {
  if (!screen) return;

  const supportedScreens = ['messages'];
  if (supportedScreens.includes(screen.toLowerCase())) {
    Linking.openURL(`cleanerChoiceApp://${screen.toLowerCase()}`);
  }
};

const displayedMessageIds = new Set();

messaging().setBackgroundMessageHandler(async remoteMessage => {
  const messageId =
    remoteMessage.messageId || remoteMessage.data?.messageId || null;

  if (messageId && displayedMessageIds.has(messageId)) {
    console.log('Duplicate background notification skipped', messageId);
    return; // skip duplicate
  }

  if (messageId) displayedMessageIds.add(messageId);

  console.log('Background Notification:', remoteMessage);

  await notifee.requestPermission({sound: true});

  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    sound: 'default',
  });

  await notifee.cancelAllNotifications();

  await notifee.displayNotification({
    id: 'single-notification',
    title: remoteMessage.notification?.title || 'New Message',
    body: remoteMessage.notification?.body || 'You have a new notification',
    android: {
      channelId,
      smallIcon: 'ic_notification',
      sound: 'default',
      pressAction: {
        id: 'default',
      },
    },
  });

  handleNotificationNavigation(remoteMessage?.data?.screen);
});

// Foreground/background notification tap handler
messaging().onNotificationOpenedApp(remoteMessage => {
  console.log(
    'Notification caused app to open from background:',
    remoteMessage,
  );
  handleNotificationNavigation(remoteMessage?.data?.screen);
});

// App opened from quit state
messaging()
  .getInitialNotification()
  .then(remoteMessage => {
    if (remoteMessage) {
      console.log(
        'Notification caused app to open from quit state:',
        remoteMessage,
      );
      handleNotificationNavigation(remoteMessage?.data?.screen);
    }
  });

initializeApp();

AppRegistry.registerComponent(appName, () => App);
