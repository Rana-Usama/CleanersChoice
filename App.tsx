import {
  StyleSheet,
  StatusBar,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import React, {useCallback, useEffect, useRef} from 'react';
import StackNavigator from './src/routers/StackNavigator';
import {Provider} from 'react-redux';
import store, {hydrateStore} from './src/redux/Store';
import Toast from 'react-native-toast-message';
import {StripeProvider} from '@stripe/stripe-react-native';
import {PUBLISHABLE_KEY} from '@env';
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
 * Mirror the FCM token onto the user's profile so the push functions can
 * target this device.
 *
 * Deliberately `.update()` and NOT `.set({...}, {merge: true})`.
 *
 * onAuthStateChanged fires the moment Firebase Auth has a user, which is
 * BEFORE SignUp.tsx writes Users/{uid}. A merge-write would create the
 * document there -- and firestore.rules only allows `role`, `admin` and
 * `accountStatus` to be written on CREATE ("no prior document to diff
 * against"). SignUp's own `.set(userData)` would then be an UPDATE touching
 * those locked fields and be rejected, breaking every new sign-up. Creating
 * the profile is SignUp's job alone.
 *
 * So `not-found` here is the expected pre-profile state, not a failure: the
 * document is about to be created with `fcmToken` already in it
 * (SignUp.tsx writes `fcmToken: fcmToken || null`). Anything else is real.
 */
const persistFcmToken = async (token?: string | null) => {
  const user = auth().currentUser;
  if (!user || !token) return;
  try {
    await firestore().collection('Users').doc(user.uid).update({
      fcmToken: token,
    });
    console.log('[FCM] token persisted for', user.uid);
  } catch (error: any) {
    if (error?.code === 'firestore/not-found') {
      console.log(
        '[FCM] profile not created yet - skipping token write.',
        'Sign-up writes the token with the document; a later launch re-syncs it.',
      );
      return;
    }
    console.log('[FCM] Error persisting FCM token:', error);
  }
};

const App: React.FC = () => {
  console.log('Running in', __DEV__ ? 'DEBUG' : 'RELEASE');
  const displayedMessageIds = useRef(new Set<string>()).current;

  // Restore the persisted location filter before the first screen can read it.
  useEffect(() => {
    hydrateStore();
  }, []);

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
          id: messageId || 'single-notification',
          title: title || 'No Title',
          body: body || 'No Body',
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
      handleNotificationTap(data);
    });
  }, []);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      {/*
        @rneui's <ThemeProvider> used to wrap everything below and was removed:
        it provided nothing (no @rneui themed component is rendered anywhere in
        this app) and it re-rendered the entire tree forever.

        Its signature is `({ theme = createTheme({}), children })`. With no
        `theme` prop the default parameter is re-evaluated on every render and
        createTheme({}) returns a NEW object each time, so its
        `useEffect(() => setThemeState(theme), [theme, theme.mode])` saw
        changed deps every render, set state, re-rendered, and repeated --
        "Maximum update depth exceeded", reported against ThemeProvider.

        If an @rneui themed component is ever added, bring the provider back
        with a MODULE-SCOPE theme (`const appTheme = createTheme({...})`
        outside the component) so the reference stays stable.
      */}
      <StripeProvider publishableKey={PUBLISHABLE_KEY}>
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
