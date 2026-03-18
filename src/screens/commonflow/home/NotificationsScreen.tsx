import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import NotFound from '../../../components/NotFound';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';

interface NotificationItem {
  id: string;
  type: 'application' | 'confirmation' | 'cancellation' | 'completion' | 'completion_request' | 'auto_complete' | 'expired' | 'expiry_warning' | 'unconfirmed' | 'message';
  fromUserId: string;
  toUserId: string;
  jobId: string;
  title: string;
  body: string;
  timestamp: any;
  read: boolean;
  fromUserName?: string;
  fromUserProfile?: string;
  jobTitle?: string;
  applicantCount?: number;
}

const NotificationsScreen = ({navigation}: any) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExistingChatId = async (userId1: string, userId2: string) => {
    try {
      const chatsSnapshot = await firestore()
        .collection('Chats')
        .where('participants', 'array-contains', userId1)
        .get();
      for (const doc of chatsSnapshot.docs) {
        const participants = doc.data().participants || [];
        if (participants.includes(userId1) && participants.includes(userId2)) {
          return doc.id;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching existing chat ID:', error);
      return null;
    }
  };

  const fetchNotifications = useCallback(async () => {
    const user = auth().currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const snapshot = await firestore()
        .collection('Notifications')
        .where('toUserId', '==', user.uid)
        .orderBy('timestamp', 'desc')
        .get();

      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificationItem[];

      setNotifications(items);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications().finally(() => setRefreshing(false));
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await firestore()
        .collection('Notifications')
        .doc(notificationId)
        .update({read: true});
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    await markAsRead(item.id);

    // Update local state
    setNotifications(prev =>
      prev.map(n => (n.id === item.id ? {...n, read: true} : n)),
    );

    switch (item.type) {
      case 'application':
        // Customer taps → go to job management to see all applicants
        navigation.navigate('JobManagement', {
          jobId: item.jobId,
          jobTitle: item.jobTitle || '',
        });
        break;
      case 'confirmation':
        // Cleaner taps → go to job details
        try {
          const jobDoc = await firestore()
            .collection('Jobs')
            .doc(item.jobId)
            .get();
          if (jobDoc.exists) {
            navigation.navigate('JobDetails', {
              item: {id: jobDoc.id, ...jobDoc.data()},
            });
          }
        } catch (error) {
          console.error('Error fetching job:', error);
        }
        break;
      case 'cancellation':
        try {
          const jobDoc2 = await firestore()
            .collection('Jobs')
            .doc(item.jobId)
            .get();
          if (jobDoc2.exists) {
            navigation.navigate('JobDetails', {
              item: {id: jobDoc2.id, ...jobDoc2.data()},
            });
          }
        } catch (error) {
          console.error('Error fetching job:', error);
        }
        break;
      case 'completion':
        // Cleaner taps → go to job details (completed job)
        try {
          const completedJobDoc = await firestore()
            .collection('Jobs')
            .doc(item.jobId)
            .get();
          if (completedJobDoc.exists) {
            navigation.navigate('JobDetails', {
              item: {id: completedJobDoc.id, ...completedJobDoc.data()},
            });
          }
        } catch (error) {
          console.error('Error fetching job:', error);
        }
        break;
      case 'completion_request':
        // Customer taps → go to job details to confirm/reject
        try {
          const pendingJobDoc = await firestore()
            .collection('Jobs')
            .doc(item.jobId)
            .get();
          if (pendingJobDoc.exists) {
            navigation.navigate('JobDetails', {
              item: {id: pendingJobDoc.id, ...pendingJobDoc.data()},
            });
          }
        } catch (error) {
          console.error('Error fetching job:', error);
        }
        break;
      case 'auto_complete':
        // Navigate to completed job details
        try {
          const autoJobDoc = await firestore()
            .collection('Jobs')
            .doc(item.jobId)
            .get();
          if (autoJobDoc.exists) {
            navigation.navigate('JobDetails', {
              item: {id: autoJobDoc.id, ...autoJobDoc.data()},
            });
          }
        } catch (error) {
          console.error('Error fetching job:', error);
        }
        break;
      case 'expired':
        // Navigate to expired job details (repost/delete)
        try {
          const expiredJobDoc = await firestore()
            .collection('Jobs')
            .doc(item.jobId)
            .get();
          if (expiredJobDoc.exists) {
            navigation.navigate('JobDetails', {
              item: {id: expiredJobDoc.id, ...expiredJobDoc.data()},
            });
          }
        } catch (error) {
          console.error('Error fetching job:', error);
        }
        break;
      case 'unconfirmed':
        // Navigate to unconfirmed job details
        try {
          const unconfirmedJobDoc = await firestore()
            .collection('Jobs')
            .doc(item.jobId)
            .get();
          if (unconfirmedJobDoc.exists) {
            navigation.navigate('JobDetails', {
              item: {id: unconfirmedJobDoc.id, ...unconfirmedJobDoc.data()},
            });
          }
        } catch (error) {
          console.error('Error fetching job:', error);
        }
        break;
      case 'expiry_warning':
        // Navigate to job management to confirm applicants
        navigation.navigate('JobManagement', {
          jobId: item.jobId,
          jobTitle: item.jobTitle || '',
        });
        break;
      case 'message':
        // Navigate to chat
        const user = auth().currentUser;
        if (user) {
          try {
            const fromUserDoc = await firestore()
              .collection('Users')
              .doc(item.fromUserId)
              .get();
            const fromUserData = fromUserDoc.data();
            const currentUserDoc = await firestore()
              .collection('Users')
              .doc(user.uid)
              .get();
            const currentUserData = currentUserDoc.data();

            // Find existing chat between users
            const existingChatId = await fetchExistingChatId(
              user.uid,
              item.fromUserId,
            );
            const chatId =
              existingChatId || `${user.uid}_${item.fromUserId}`;

            navigation.navigate('Chat', {
              chatId,
              senderId: user.uid,
              senderName: currentUserData?.name || '',
              receiver: item.fromUserId,
              receiverName: fromUserData?.name || '',
              receiverProfile: fromUserData?.profile || '',
              senderProfile: currentUserData?.profile || '',
              fcmToken: fromUserData?.fcmToken || '',
            });
          } catch (error) {
            console.error('Error navigating to chat:', error);
          }
        }
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
        return {name: 'briefcase-plus-outline', color: Colors.gradient1};
      case 'confirmation':
        return {name: 'check-circle-outline', color: Colors.success};
      case 'cancellation':
        return {name: 'close-circle-outline', color: Colors.red500};
      case 'completion':
        return {name: 'check-decagram', color: Colors.success};
      case 'completion_request':
        return {name: 'clipboard-check-outline', color: Colors.amber500};
      case 'auto_complete':
        return {name: 'clock-check-outline', color: Colors.amber500};
      case 'expired':
        return {name: 'clock-alert-outline', color: Colors.orange600};
      case 'expiry_warning':
        return {name: 'alert-circle-outline', color: Colors.amber500};
      case 'unconfirmed':
        return {name: 'account-alert-outline', color: Colors.orange600};
      case 'message':
        return {name: 'message-text-outline', color: Colors.primaryBlue};
      default:
        return {name: 'bell-outline', color: Colors.gradient1};
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return moment(date).format('MMM DD');
  };

  const renderNotification = ({item}: {item: NotificationItem}) => {
    const icon = getNotificationIcon(item.type);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.notificationCard,
          !item.read && styles.unreadCard,
        ]}
        onPress={() => handleNotificationPress(item)}>
        <View
          style={[
            styles.iconContainer,
            {backgroundColor: `${icon.color}15`},
          ]}>
          <MaterialCommunityIcons
            name={icon.name}
            size={RFPercentage(2.8)}
            color={icon.color}
          />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.notificationHeader}>
            <Text
              style={[
                styles.notificationTitle,
                !item.read && styles.unreadTitle,
              ]}
              numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
          </View>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.body}
          </Text>
          {item.jobTitle && (
            <View style={styles.jobTag}>
              <MaterialCommunityIcons
                name="briefcase-outline"
                size={RFPercentage(1.4)}
                color={Colors.gradient1}
              />
              <Text style={styles.jobTagText} numberOfLines={1}>
                {item.jobTitle}
              </Text>
            </View>
          )}
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent={true}
      />
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <HeaderBack
          title="Notifications"
          textStyle={styles.headerText}
          left={true}
          arrowColor={Colors.white}
          style={{backgroundColor: 'transparent'}}
        />
      </LinearGradient>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons
            name="notifications"
            size={RFPercentage(2)}
            color={Colors.gradient1}
          />
          <Text style={styles.unreadBannerText}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {loading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gradient1} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <NotFound text="No notifications yet" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.gradient1}
            />
          }
        />
      )}
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueBg,
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1),
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(2),
    borderRadius: RFPercentage(1),
    gap: RFPercentage(0.8),
  },
  unreadBannerText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.gradient1,
  },
  listContent: {
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(1),
    paddingBottom: RFPercentage(10),
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(1.5),
    padding: RFPercentage(1.5),
    marginTop: RFPercentage(1),
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
  },
  unreadCard: {
    borderColor: Colors.gradient1,
    borderWidth: 1,
    backgroundColor: Colors.skyBlueBg100 || '#f0f7ff',
  },
  iconContainer: {
    width: RFPercentage(5.5),
    height: RFPercentage(5.5),
    borderRadius: RFPercentage(2.75),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFPercentage(1.2),
  },
  contentContainer: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RFPercentage(0.3),
  },
  notificationTitle: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
    color: Colors.primaryText,
    flex: 1,
    marginRight: RFPercentage(1),
  },
  unreadTitle: {
    fontFamily: Fonts.semiBold,
  },
  timeText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
    color: Colors.secondaryText,
  },
  notificationBody: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
    lineHeight: RFPercentage(2),
  },
  jobTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueBg,
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.3),
    borderRadius: RFPercentage(0.5),
    marginTop: RFPercentage(0.5),
    gap: RFPercentage(0.3),
    alignSelf: 'flex-start',
  },
  jobTagText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.2),
    color: Colors.gradient1,
  },
  unreadDot: {
    width: RFPercentage(1),
    height: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
    backgroundColor: Colors.gradient1,
    marginLeft: RFPercentage(0.5),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.secondaryText,
    marginTop: RFPercentage(1),
  },
});
