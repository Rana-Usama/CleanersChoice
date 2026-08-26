import {
  StyleSheet,
  StatusBar,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import React, {useCallback, useEffect, useRef} from 'react';
import StackNavigator from './src/routers/StackNavigator';
import {Provider} from 'react-redux';
import store from './src/redux/Store';
import Toast from 'react-native-toast-message';
import {StripeProvider} from '@stripe/stripe-react-native';
import {PUBLISHABLE_KEY} from '@env';
import {ThemeProvider} from '@rneui/themed';
import messaging from '@react-native-firebase/messaging';
import notifee, {EventType} from '@notifee/react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {handleNotificationTap} from './src/utils/notificationNavigation';
import {UnreadMessagesProvider} from './src/utils/UnreadMessagesContext';
import {AlertProvider} from './src/components/AlertProvider';
import {toastConfig} from './src/utils/toastConfig';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

/**
 * Persist the current FCM token against the signed-in user.
 *
 * Tokens rotate (reinstall, OS restore, long inactivity) and previously the
 * refreshed value was only logged, so those users silently stopped receiving
 * pushes. No-ops when signed out, which keeps logout's deleteField() intact.
 */
const persistFcmToken = async (token?: string | null) => {
  const user = auth().currentUser;
  if (!user || !token) return;
  try {
    await firestore().collection('Users').doc(user.uid).update({
      fcmToken: token,
    });
  } catch (error) {
    console.log('Error persisting FCM token:', error);
  }
};

const App: React.FC = () => {
  console.log('Running in', __DEV__ ? 'DEBUG' : 'RELEASE');
  const displayedMessageIds = useRef(new Set<string>()).current;

  // Display foreground notifications
  const onDisplayNotification = useCallback(
    async (remoteMessage: any) => {
      const messageId =
        remoteMessage.messageId || remoteMessage.data?.messageId || null;
      if (messageId && displayedMessageIds.has(messageId)) {
        return;
      }
      if (messageId) {
        displayedMessageIds.add(messageId);
      }
      try {
        if (!remoteMessage || !remoteMessage.notification) {
          return;
        }
        await notifee.requestPermission({sound: true});
        const channelId = await notifee.createChannel({
          id: 'default',
          sound: 'default',
          name: 'Default Channel',
        });
        if (!channelId) {
          return;
        }

        const {title, body} = remoteMessage.notification;
        await notifee.displayNotification({
          // Was a fixed id preceded by cancelAllNotifications(), which meant
          // only one foreground notification could ever be visible — two
          // nearby-job alerts in a row and the cleaner only saw the second.
          // A per-message id lets them stack while still de-duplicating
          // redelivery of the same message.
          id: messageId || 'single-notification',
          title: title || 'No Title',
          body: body || 'No Body',
          // Carried through so the tap handler below can route it the same way
          // an OS-rendered (background) notification is routed.
          data: remoteMessage.data || {},
          ios: {
            sound: 'default',
          },
          android: {
            channelId,
            smallIcon: 'ic_notification',
            pressAction: {id: 'default'},
          },
        });
      } catch (error) {
        console.log('Error displaying notification:', error);
      }
    },
    [displayedMessageIds],
  );

  useEffect(() => {
    const requestNotificationPermission = async () => {
      try {
        console.log('Requesting notification permission...');

        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          console.log('Android POST_NOTIFICATIONS result:', granted);
        }

        const authStatus = await messaging().requestPermission();
        console.log('messaging().requestPermission result:', authStatus);

        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Notification permission granted');
          await messaging().registerDeviceForRemoteMessages();
          console.log('📲 registerDeviceForRemoteMessages done');

          // Wait a bit for APNs token → FCM mapping
          const fcmToken = await messaging().getToken();
          console.log('FCM token from getToken():', fcmToken);
          await persistFcmToken(fcmToken);
        } else {
          console.log('Notification permission denied');
        }
      } catch (error) {
        console.log('Error requesting permission:', error);
      }
    };

    requestNotificationPermission();

    // Foreground messages
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      console.log('onMessage received:', remoteMessage);
      try {
        onDisplayNotification(remoteMessage);
      } catch (error) {
        console.log('Error handling notification:', error);
      }
    });

    // Token refresh listener
    const unsubscribeToken = messaging().onTokenRefresh(token => {
      console.log('FCM token refreshed (after APNs token linked):', token);
      persistFcmToken(token).catch(() => {});
    });

    return () => {
      unsubscribeOnMessage();
      unsubscribeToken();
    };
  }, [onDisplayNotification]);

  /**
   * At cold start `auth().currentUser` is usually still null when the token is
   * first read, so re-persist once auth restores. Fires with null on logout,
   * where it correctly does nothing and leaves the deleted token deleted.
   */
  useEffect(() => {
    return auth().onAuthStateChanged(async user => {
      if (!user) return;
      try {
        const token = await messaging().getToken();
        await persistFcmToken(token);
      } catch (error) {
        console.log('Error syncing FCM token on auth change:', error);
      }
    });
  }, []);

  // Handle notifee notification tap in foreground (e.g. invoice download)
  useEffect(() => {
    return notifee.onForegroundEvent(({type, detail}) => {
      if (type !== EventType.PRESS) return;

      const data = detail.notification?.data;

      if (data?.type === 'invoice_download') {
        const {contentUri, mimeType} = data;
        if (contentUri && Platform.OS === 'android') {
          ReactNativeBlobUtil.android
            .actionViewIntent(
              String(contentUri),
              String(mimeType || 'application/pdf'),
            )
            .catch(() => {});
        }
        return;
      }

      // Foreground pushes are re-displayed locally by Notifee, so their taps
      // arrive here rather than through messaging().onNotificationOpenedApp.
      // Without this, tapping a foreground notification did nothing at all.
      handleNotificationTap(data);
    });
  }, []);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <StripeProvider publishableKey={PUBLISHABLE_KEY}>
        <ThemeProvider>
          <Provider store={store}>
            <StatusBar
              barStyle={'dark-content'}
              translucent
              backgroundColor="transparent"
            />
            <AlertProvider>
              <UnreadMessagesProvider>
                <StackNavigator />
              </UnreadMessagesProvider>
            </AlertProvider>
            <Toast config={toastConfig} />
          </Provider>
        </ThemeProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
};

export default App;

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
});
