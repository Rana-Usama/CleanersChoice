import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

/**
 * Single source of truth for "is the signed-in user an admin".
 *
 * Admin is the boolean `admin` field on `Users/{uid}` (set to `false` at signup
 * in SignUp.tsx, flipped manually in the Firebase console).
 *
 * Why a hook rather than reading Redux directly: the existing CleanerJobs screen
 * does `useState(profileData?.admin)`, which only works because the Dashboard
 * mounts first and seeds Redux. Entering a screen cold — from a push
 * notification deep link, say — leaves `profileData` undefined, and because it's
 * captured in `useState` initial state it never recovers. This hook prefers the
 * Redux copy when it's there and self-fetches when it isn't.
 *
 * Existing screens are untouched; this is used by the new admin entry points.
 */
export const useIsAdmin = (): boolean => {
  const profileData = useSelector((state: any) => state?.profile?.profileData);
  const [isAdmin, setIsAdmin] = useState<boolean>(!!profileData?.admin);

  const fetchAdminFlag = useCallback(async () => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      const doc = await firestore().collection('Users').doc(user.uid).get();
      if (doc.exists) setIsAdmin(!!doc.data()?.admin);
    } catch (error) {
      // Never throw from a visibility check — worst case the admin CTA stays
      // hidden until the next focus.
      console.log('[useIsAdmin] lookup failed:', error);
    }
  }, []);

  useEffect(() => {
    if (profileData && profileData.admin !== undefined) {
      setIsAdmin(!!profileData.admin);
      return;
    }
    fetchAdminFlag();
  }, [profileData, fetchAdminFlag]);

  return isAdmin;
};

export default useIsAdmin;
