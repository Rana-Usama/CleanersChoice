import React, {createContext, useContext, useState, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const UnreadMessagesContext = createContext({ unreadCount: 0 });

export const useUnreadMessages = () => useContext(UnreadMessagesContext);

export const UnreadMessagesProvider = ({children} : any) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const user = auth().currentUser;

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = firestore()
      .collection('Chats')
      .where('participants', 'array-contains', user.uid)
      .onSnapshot(async snapshot => {
        let count = 0;
        snapshot.forEach(doc => {
          const data = doc.data();
          const msg = data.lastMessage;
          if (
            msg?.unread &&
            msg?.receiver === user.uid &&
            msg?.senderId !== user.uid
          ) {
            count += 1;
          }
        });
        setUnreadCount(count);
      });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <UnreadMessagesContext.Provider value={{ unreadCount }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
