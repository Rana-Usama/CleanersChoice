import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

/**
 * Shared logic for starting a chat with another user.
 *
 * The rules were previously inlined (and duplicated three times) in
 * ServiceDetails.tsx: derive a deterministic chat id, but reuse the existing
 * conversation if one already exists between the two participants, and look up
 * the recipient's FCM token so Chat.tsx can push-notify them.
 *
 * Extracted here unchanged so the admin CTA on CleanerProfile lands in the same
 * conversation thread a customer would — not a duplicate one. ServiceDetails is
 * deliberately left untouched; it can be migrated to this later.
 */

export interface ChatNavParams {
  chatId: string;
  senderId?: string;
  senderName: string;
  receiver: string;
  receiverName: string;
  receiverProfile: string;
  senderProfile: any;
  fcmToken: string;
}

/** Same shape ServiceDetails generates: `${senderId}_${receiverId}`. */
export const buildChatId = (senderId: string, receiverId: string): string =>
  `${senderId}_${receiverId}`;

/**
 * Find an existing conversation between two users regardless of which of them
 * created it (so the `a_b` / `b_a` id ordering doesn't split the thread).
 */
export const findExistingChatId = async (
  userId1: string,
  userId2: string,
): Promise<string | null> => {
  try {
    const chatsSnapshot = await firestore()
      .collection('Chats')
      .where('participants', 'array-contains', userId1)
      .get();

    for (const doc of chatsSnapshot.docs) {
      const participants = doc.data()?.participants || [];
      if (participants.includes(userId1) && participants.includes(userId2)) {
        return doc.id;
      }
    }
    return null;
  } catch (error) {
    console.log('[chatService] findExistingChatId failed:', error);
    return null;
  }
};

interface BuildChatParamsArgs {
  receiverId?: string | null;
  receiverName?: string | null;
  receiverProfile?: string | null;
  /**
   * Sender details, when the caller already has them (e.g. from the Redux
   * profileData copy). Omit and they're read from `Users/{uid}`.
   */
  sender?: {name?: string; profile?: string | null} | null;
}

/**
 * Build the full param object for `navigation.navigate('Chat', ...)`.
 *
 * Returns null when a chat isn't possible — not signed in, no recipient, or the
 * recipient is the current user. Callers should treat null as "hide the CTA".
 */
export const buildChatParams = async ({
  receiverId,
  receiverName,
  receiverProfile,
  sender,
}: BuildChatParamsArgs): Promise<ChatNavParams | null> => {
  const currentUser = auth().currentUser;
  if (!currentUser?.uid || !receiverId) return null;
  // Can't message yourself.
  if (currentUser.uid === receiverId) return null;

  try {
    const needsSenderLookup = !sender?.name;

    const [existingChatId, receiverDoc, senderDoc] = await Promise.all([
      findExistingChatId(currentUser.uid, receiverId),
      firestore().collection('Users').doc(receiverId).get(),
      needsSenderLookup
        ? firestore().collection('Users').doc(currentUser.uid).get()
        : Promise.resolve(null),
    ]);

    const senderData = senderDoc?.exists ? senderDoc.data() : null;

    return {
      chatId: existingChatId ?? buildChatId(currentUser.uid, receiverId),
      senderId: currentUser.uid,
      senderName: sender?.name || senderData?.name || '',
      receiver: receiverId,
      receiverName: receiverName || receiverDoc.data()?.name || '',
      receiverProfile: receiverProfile || receiverDoc.data()?.profile || '',
      senderProfile: sender?.profile ?? senderData?.profile ?? null,
      // Absent when the recipient has logged out (logOut() deletes the field).
      // Chat.tsx tolerates an empty token; the message still sends.
      fcmToken: receiverDoc.data()?.fcmToken ?? '',
    };
  } catch (error) {
    console.log('[chatService] buildChatParams failed:', error);
    return null;
  }
};
