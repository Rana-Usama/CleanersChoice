import React, {createContext, useContext, useState, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const UnreadMessagesContext = createContext({unreadCount: 0});

export const useUnreadMessages = () => useContext(UnreadMessagesContext);

export const UnreadMessagesProvider = ({children}: any) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged(user => {
      setUserId(user?.uid || null);
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = firestore()
      .collection('Chats')
      .where('participants', 'array-contains', userId)
      .onSnapshot(async snapshot => {
        let count = 0;
        snapshot.forEach(doc => {
          const data = doc.data();
          const msg = data.lastMessage;
          if (
            msg?.unread &&
            msg?.receiver === userId &&
            msg?.senderId !== userId
          ) {
            count += 1;
          }
        });
        setUnreadCount(count);
      });

    return () => unsubscribe();
  }, [userId]);

  return (
    <UnreadMessagesContext.Provider value={{unreadCount}}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
