import AsyncStorage from '@react-native-async-storage/async-storage';

export type CoachMarksRole = 'cleaner' | 'customer';

export const getCoachMarksSeenKey = (role: CoachMarksRole): string =>
  `coachMarksSeen_${role}`;

export const shouldShowCoachMarksForRole = async (
  role: CoachMarksRole,
): Promise<boolean> => {
  try {
    const seen = await AsyncStorage.getItem(getCoachMarksSeenKey(role));
    return seen !== 'true';
  } catch {
    return true;
  }
};

export const markCoachMarksSeenForRole = async (
  role: CoachMarksRole,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(getCoachMarksSeenKey(role), 'true');
  } catch {}
};