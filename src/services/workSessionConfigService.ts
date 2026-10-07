import firestore from '@react-native-firebase/firestore';
import type {WorkSessionConfig} from '../types/workSession';
import {parseWorkSessionConfig} from '../utils/workSessionConfig';

/** Read fresh config; stale offline data must not override the kill switch. */
export const getWorkSessionConfig = async (): Promise<WorkSessionConfig> => {
  try {
    const snapshot = await firestore()
      .collection('AppConfig')
      .doc('workSessions')
      .get({source: 'server'});
    return parseWorkSessionConfig(snapshot.exists ? snapshot.data() : null);
  } catch {
    return parseWorkSessionConfig(null);
  }
};
