import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import React, {useEffect} from 'react';
import StackNavigator from './src/routers/StackNavigator';
import {Provider} from 'react-redux';
import store from './src/redux/Store';
import Toast from 'react-native-toast-message';
import {StripeProvider} from '@stripe/stripe-react-native';
import {PUBLISHABLE_KEY} from '@env';
import {ThemeProvider} from '@rneui/themed';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import {UnreadMessagesProvider} from './src/utils/UnreadMessagesContext';
import {toastConfig} from './src/utils/toastConfig';

const App: React.FC = () => {
  // Notification Permission
  useEffect(() => {
    const requestNotificationPermission = async () => {
      try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('POST_NOTIFICATIONS permission denied.');
          }
        }

        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          await messaging().registerDeviceForRemoteMessages();
          const fcmToken = await messaging().getToken();
          console.log('Notification permission granted.');
        } else {
          console.log('Notification permission denied.');
        }
      } catch (error) {
        console.log('Error requesting permission:', error);
      }
    };

    requestNotificationPermission();

    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      try {
        onDisplayNotification(remoteMessage);
      } catch (error) {
        console.log('Error handling notification:', error);
      }
    });

    return () => {
      unsubscribeOnMessage();
    };
  }, []);

  // Display foreground Notifications
  const displayedMessageIds = new Set();
  const onDisplayNotification = async (remoteMessage: any) => {
    const messageId =
      remoteMessage.messageId || remoteMessage.data?.messageId || null;
    if (messageId && displayedMessageIds.has(messageId)) {
      return; // skip duplicate
    }
    if (messageId) displayedMessageIds.add(messageId);
    try {
      if (!remoteMessage || !remoteMessage.notification) {
        return;
      }
      await notifee.requestPermission({
        sound: true,
      });
      const channelId = await notifee.createChannel({
        id: 'default',
        sound: 'default',
        name: 'Default Channel',
      });
      if (!channelId) {
        return;
      }
      await notifee.cancelAllNotifications();

      const {title, body} = remoteMessage.notification;

      await notifee.displayNotification({
        id: 'single-notification',
        title: title || 'No Title',
        body: body || 'No Body',
        android: {
          channelId,
          smallIcon: 'ic_notification',
          pressAction: {id: 'default'},
        },
      });
    } catch (error) {
      console.log('Error displaying notification:', error);
    }
  };

  // console.log('PUBLISHABLE_KEY.............', PUBLISHABLE_KEY)

  return (
    <StripeProvider publishableKey={PUBLISHABLE_KEY}>
      <ThemeProvider>
        <Provider store={store}>
          <StatusBar
            barStyle={'dark-content'}
            translucent
            backgroundColor="transparent"
          />
          <UnreadMessagesProvider>
            <StackNavigator />
          </UnreadMessagesProvider>
          <Toast config={toastConfig} />
        </Provider>
      </ThemeProvider>
    </StripeProvider>
  );
};

export default App;

const styles = StyleSheet.create({});
