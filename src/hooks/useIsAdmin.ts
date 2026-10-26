import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

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
