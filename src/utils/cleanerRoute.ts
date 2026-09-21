import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {hasAcceptedInstructions} from './cleanerInstructions';
import {hasActiveSubscriptionAccess} from './cleanerVisibility';

/**
 * Where a Cleaner belongs right now.
 *
 * The precedence is defined ONCE here because four call sites need it and they
 * previously drifted: SignUp, SignIn, StackNavigator's initialRoute, and the
 * instructions screen's accept handler.
 *
 *   1. Instructions not accepted  → CleanerInstructions
 *   2. No active subscription     → Premium
 *   3. Otherwise                  → CleanerNavigator
 *
 * Instructions come BEFORE the paywall: a cleaner should understand what the
 * membership is before being asked to pay for it.
 *
 * Active-subscription test is delegated to `hasActiveSubscriptionAccess`
 * (utils/cleanerVisibility.ts), which is the single definition of "valid
 * subscription access right now" shared with StackNavigator's gate and with the
 * customer-facing visibility rule. It is still `subscriptionEndDate > now` at
 * heart; centralising it means the paywall and the customer side can never
 * disagree about whether a cleaner is live.
 */

export type CleanerRoute =
  | 'CleanerInstructions'
  | 'Premium'
  | 'CleanerNavigator';

export const resolveCleanerRoute = (
  userData?: Record<string, any> | null,
): CleanerRoute => {
  if (!hasAcceptedInstructions(userData)) {
    return 'CleanerInstructions';
  }

  return hasActiveSubscriptionAccess(userData) ? 'CleanerNavigator' : 'Premium';
};

/**
 * Same decision for call sites without a user document in hand — currently the
 * instructions screen, which needs to know where to send the cleaner directly
 * after recording the acknowledgement.
 *
 * Falls back to Premium on a failed read: the paywall re-checks subscription
 * state itself, so it is the safe place to land when we cannot tell.
 */
export const resolveCleanerRouteAsync = async (): Promise<CleanerRoute> => {
  const uid = auth().currentUser?.uid;
  if (!uid) return 'Premium';

  try {
    const doc = await firestore().collection('Users').doc(uid).get();
    return resolveCleanerRoute(doc.data());
  } catch {
    return 'Premium';
  }
};
