import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

/**
 * Tracks whether a Cleaner has already seen the introductory video.
 *
 * The flag lives on the user's Firestore doc (not only AsyncStorage) so it
 * survives reinstalls and follows the account across devices — unlike the
 * coach-marks flag in `utils/coachMarks.ts`, which is device-local by design.
 *
 * AsyncStorage is kept as a mirror purely as a fast/offline path so the video
 * never flashes while the Firestore read is in flight.
 */

type IntroSeenMirror = {
  seen: boolean;
  version: number;
};

const mirrorKey = (uid: string) => `introVideoSeen_${uid}`;

const readMirror = async (uid: string): Promise<IntroSeenMirror | null> => {
  try {
    const raw = await AsyncStorage.getItem(mirrorKey(uid));
    return raw ? (JSON.parse(raw) as IntroSeenMirror) : null;
  } catch {
    return null;
  }
};

const writeMirror = async (
  uid: string,
  mirror: IntroSeenMirror,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(mirrorKey(uid), JSON.stringify(mirror));
  } catch {
    // Non-fatal — Firestore remains the source of truth.
  }
};

/**
 * True when the intro video should auto-play for the signed-in Cleaner.
 *
 * A version bump in `AppConfig/cleanerIntro` re-shows the video to everyone,
 * which is how the client re-releases a re-recorded video.
 *
 * Fails CLOSED (returns false) on error: a Firestore hiccup must never block
 * a cleaner from reaching the paywall.
 */
export const shouldShowIntroVideo = async (
  currentVersion: number,
): Promise<boolean> => {
  const uid = auth().currentUser?.uid;
  if (!uid) {
    return false;
  }

  // Fast path — if the mirror already covers this version, skip the read.
  const mirror = await readMirror(uid);
  if (mirror?.seen && mirror.version >= currentVersion) {
    return false;
  }

  try {
    const doc = await firestore().collection('Users').doc(uid).get();
    if (!doc.exists) {
      return false;
    }

    const data = doc.data() ?? {};
    const seen = data.introVideoSeen === true;
    const seenVersion = data.introVideoVersionSeen ?? 0;

    const alreadySeen = seen && seenVersion >= currentVersion;

    if (alreadySeen) {
      await writeMirror(uid, {seen: true, version: seenVersion});
    }

    return !alreadySeen;
  } catch (error) {
    console.log('[introVideo] shouldShowIntroVideo failed:', error);
    return false;
  }
};

/**
 * Records that the Cleaner has seen the video.
 *
 * `completed` distinguishes a full watch from a skip — useful later for
 * measuring whether the video is actually landing before the paywall.
 */
export const markIntroVideoSeen = async (
  version: number,
  completed: boolean,
): Promise<void> => {
  const uid = auth().currentUser?.uid;
  if (!uid) {
    return;
  }

  // Mirror first so the UI gate is correct immediately, even offline.
  await writeMirror(uid, {seen: true, version});

  try {
    await firestore().collection('Users').doc(uid).set(
      {
        introVideoSeen: true,
        introVideoVersionSeen: version,
        introVideoCompleted: completed,
        introVideoSeenAt: firestore.FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
  } catch (error) {
    console.log('[introVideo] markIntroVideoSeen failed:', error);
  }
};
