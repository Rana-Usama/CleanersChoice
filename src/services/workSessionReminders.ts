import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TriggerType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {WorkSession} from '../types/workSession';

const KEY = 'work-session-reminder';
// Serialize schedules/cancellations so an old async completion cannot resurrect a reminder.
let tail: Promise<unknown> = Promise.resolve();
export const syncWorkReminder = (
  uid: string | null,
  session: WorkSession | null,
): Promise<boolean> => {
  const task = tail
    .catch(() => {})
    .then(async () => {
      const saved = await AsyncStorage.getItem(KEY);
      const reminder =
        session?.status === 'active' &&
        session.expectedEndAt !== null &&
        session.expectedEndAt > Date.now() &&
        session.expectedEndAt < session.autoStopAt
          ? session
          : null;
      const id = reminder ? `work-reminder-${uid}-${reminder.id}` : null;
      if (saved) {
        await notifee.cancelNotification(saved);
      }
      await AsyncStorage.removeItem(KEY);
      if (!reminder || !id) {
        return true;
      }
      const settings = await notifee.getNotificationSettings();
      if (
        settings.authorizationStatus !== AuthorizationStatus.AUTHORIZED &&
        settings.authorizationStatus !== AuthorizationStatus.PROVISIONAL
      ) {
        return false;
      }
      const channelId = await notifee.createChannel({
        id: 'work-hours',
        name: 'Work reminders',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });
      // Save the cancellation ID first, including if scheduling is interrupted.
      await AsyncStorage.setItem(KEY, id);
      await notifee.createTriggerNotification(
        {
          id,
          title: 'Still working?',
          body: 'Your job’s expected finish has arrived. Open the app to check your timer.',
          data: {
            screen: 'worktracking',
            type: 'work_session_reminder',
            workSessionId: reminder.id,
          },
          android: {
            channelId,
            smallIcon: 'ic_notification',
            pressAction: {id: 'default'},
          },
          ios: {sound: 'default'},
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: reminder.expectedEndAt as number,
        },
      );
      return true;
    });
  tail = task;
  return task;
};
