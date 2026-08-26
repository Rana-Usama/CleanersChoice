import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {navigationRef} from './navigationRef';

/**
 * Where a push notification tap lands.
 *
 * Previously this went through `Linking.openURL('cleanerChoiceApp://...')`,
 * which never worked: the `linking` config was declared in StackNavigator but
 * never passed to NavigationContainer, and iOS has no CFBundleURLSchemes entry
 * for the scheme. Everything now routes through `navigationRef` instead, which
 * works identically on both platforms and needs no native config.
 */

export interface NotificationPayload {
  screen?: string;
  type?: string;
  jobId?: string;
  [key: string]: any;
}

type Target = 'NotificationsScreen' | 'Messages';

/**
 * Taps that arrive from a cold start land here before NavigationContainer has
 * mounted. We stash the payload and StackNavigator flushes it once the stack
 * is actually rendered.
 */
let pendingPayload: NotificationPayload | null = null;

const resolveTarget = (screen?: string): Target | null => {
  const normalized = (screen || '').trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'messages') return 'Messages';
  // 'jobdetails' is accepted so a future payload change doesn't strand taps.
  if (normalized === 'notifications' || normalized === 'jobdetails') {
    return 'NotificationsScreen';
  }
  return null;
};

/**
 * Cleaners whose subscription has lapsed are held on the Premium paywall by
 * StackNavigator's initial-route logic and cannot open jobs, so their tap goes
 * to Premium instead of the (unreachable) notifications list.
 *
 * Uses the same predicate as StackNavigator/SignIn — `subscriptionEndDate`
 * against now — so the tap destination always agrees with where the app would
 * have put them on launch. Any failure resolves to `false`: a lookup error must
 * never trap an active cleaner on the paywall.
 */
const shouldRouteToPaywall = async (): Promise<boolean> => {
  const user = auth().currentUser;
  if (!user) return false;

  try {
    const doc = await firestore().collection('Users').doc(user.uid).get();
    const data = doc.data();
    if (data?.role !== 'Cleaner') return false;

    const endDate =
      typeof data?.subscriptionEndDate === 'number'
        ? data.subscriptionEndDate
        : null;

    return !(endDate !== null && endDate > Date.now());
  } catch (error) {
    console.log('Error resolving notification route:', error);
    return false;
  }
};

const navigateForPayload = async (payload: NotificationPayload) => {
  const target = resolveTarget(payload?.screen);
  if (!target || !navigationRef.isReady()) return;

  try {
    if (target === 'Messages') {
      navigationRef.navigate('Messages');
      return;
    }

    const paywalled = await shouldRouteToPaywall();
    if (!navigationRef.isReady()) return;

    if (paywalled) {
      navigationRef.navigate('Premium');
    } else {
      navigationRef.navigate('NotificationsScreen');
    }
  } catch (error) {
    console.log('Error navigating from notification:', error);
  }
};

/**
 * Entry point for every notification tap (foreground, background and quit).
 * Safe to call before the navigator exists — the payload is queued.
 */
export const handleNotificationTap = (payload?: NotificationPayload | null) => {
  if (!payload) return;
  if (!resolveTarget(payload.screen)) return;

  if (!navigationRef.isReady()) {
    pendingPayload = payload;
    return;
  }

  navigateForPayload(payload).catch(() => {});
};

/** Called by StackNavigator once the stack is mounted. */
export const flushPendingNotification = () => {
  if (!pendingPayload) return;
  const payload = pendingPayload;
  pendingPayload = null;
  navigateForPayload(payload).catch(() => {});
};
