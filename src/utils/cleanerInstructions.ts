import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {CLEANER_INSTRUCTIONS_VERSION} from '../constants/cleanerInstructions';

/**
 * Tracks whether a Cleaner has accepted the "How It Works" instructions.
 *
 * Firestore is the only store, so the acknowledgement survives a reinstall and
 * follows the account across devices — unlike the coach-marks flag in
 * `utils/coachMarks.ts`, which is device-local by design.
 *
 * No AsyncStorage mirror here (`utils/introVideo.ts` has one): every caller
 * already holds, or is already fetching, the user document to decide routing,
 * so a mirror would add a second source of truth for no saved read.
 *
 * Fields written on `Users/{uid}`:
 *   instructionsAccepted: boolean
 *   instructionsVersionAccepted: number
 *   instructionsAcceptedAt: server timestamp
 */

/**
 * Pure check against an already-fetched user document.
 *
 * A stored version lower than the current one counts as NOT accepted, which is
 * how bumping CLEANER_INSTRUCTIONS_VERSION re-shows revised terms to everyone.
 */
export const hasAcceptedInstructions = (
  userData?: Record<string, any> | null,
  currentVersion: number = CLEANER_INSTRUCTIONS_VERSION,
): boolean => {
  if (!userData) return false;

  const accepted = userData.instructionsAccepted === true;
  const acceptedVersion =
    typeof userData.instructionsVersionAccepted === 'number'
      ? userData.instructionsVersionAccepted
      : 0;

  return accepted && acceptedVersion >= currentVersion;
};

/**
 * Records the acknowledgement. Throws on Firestore failure so the screen can
 * keep the cleaner in place and let them retry — silently swallowing here
 * would let a cleaner through without the step being recorded, and they would
 * be shown the screen again on the next launch with no explanation.
 */
export const markInstructionsAccepted = async (
  currentVersion: number = CLEANER_INSTRUCTIONS_VERSION,
): Promise<void> => {
  const uid = auth().currentUser?.uid;
  if (!uid) throw new Error('No signed-in user to record acceptance for');

  await firestore().collection('Users').doc(uid).update({
    instructionsAccepted: true,
    instructionsVersionAccepted: currentVersion,
    instructionsAcceptedAt: firestore.FieldValue.serverTimestamp(),
  });
};
