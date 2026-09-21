import {useCallback, useEffect, useRef} from 'react';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import {getReceiptIOS} from 'react-native-iap';

const API_BASE = 'https://cleaners-choice-server.vercel.app';

const MIN_INTERVAL_MS = 6 * 60 * 60 * 1000;
const LAST_RUN_KEY = (uid: string) => `apple_receipt_refresh_at_${uid}`;

export const useAppleReceiptRefresh = (
  options: {onRefreshed?: (isActive: boolean) => void; enabled?: boolean} = {},
) => {
  const {onRefreshed, enabled = true} = options;
  const onRefreshedRef = useRef(onRefreshed);
  const inFlight = useRef(false);

  useEffect(() => {
    onRefreshedRef.current = onRefreshed;
  }, [onRefreshed]);

  const refresh = useCallback(async (force = false) => {
    if (Platform.OS !== 'ios') return;
    if (inFlight.current) return;

    const user = auth().currentUser;
    if (!user?.uid) return;

    inFlight.current = true;
    try {
      if (!force) {
        const last = await AsyncStorage.getItem(LAST_RUN_KEY(user.uid));
        const lastRun = last ? Number(last) : 0;
        if (Number.isFinite(lastRun) && Date.now() - lastRun < MIN_INTERVAL_MS) {
          return;
        }
      }

      let receipt: string | null = null;
      try {
        receipt = (await getReceiptIOS({forceRefresh: false})) ?? null;
      } catch (err) {
        return;
      }
      if (!receipt) return;

      await AsyncStorage.setItem(LAST_RUN_KEY(user.uid), String(Date.now()));

      const response = await fetch(`${API_BASE}/api/apple-validate`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({receipt, uid: user.uid}),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        return;
      }

      onRefreshedRef.current?.(!!result.isActive);
    } catch (err) {
      console.log('[useAppleReceiptRefresh] skipped:', err);
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    refresh();
  }, [enabled, refresh]);

  return {refreshReceipt: refresh};
};

export default useAppleReceiptRefresh;
