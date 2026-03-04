import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import CheckAvailable from '../../../components/CheckAvailable';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import {useSelector} from 'react-redux';
import CustomModal from '../../../components/CustomModal';
import {BlurView} from '@react-native-community/blur';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const CheckAvailability = ({route, navigation}: any) => {
  const {item} = route.params;
  const userFlow = useSelector((state: any) => state.userFlow.userFlow);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const profileData = useSelector((state: any) => state.profile.profileData);

  // Filter only checked days
  const availableDays = item.availability.filter(
    (day: any) => day.checked === true,
  );

  const [selectedFilter, setSelectedFilter] = useState('all');

  // Map day abbreviations to full names
  const dayMap: {[key: string]: string} = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday',
  };

  // Convert day abbreviations to full names
  const processedDays = availableDays.map((day: any) => ({
    ...day,
    fullDay: dayMap[day.day] || day.day,
  }));

  // Sort days in chronological order
  const sortedDays = [...processedDays].sort((a, b) => {
    const daysOrder = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return daysOrder.indexOf(a.fullDay) - daysOrder.indexOf(b.fullDay);
  });

  // Format Firebase Timestamp to readable time
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '--:--';

    try {
      // Check if it's a Firebase Timestamp
      if (timestamp._seconds) {
        const date = new Date(timestamp._seconds * 1000);
        return moment(date).format('h:mm A');
      } else if (timestamp.toDate) {
        // If it has toDate method
        const date = timestamp.toDate();
        return moment(date).format('h:mm A');
      } else if (
        typeof timestamp === 'string' ||
        typeof timestamp === 'number'
      ) {
        // If it's already a string or number
        return moment(timestamp).format('h:mm A');
      }
      return '--:--';
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '--:--';
    }
  };

  // Format date from timestamp
  const formatDateFromTimestamp = (timestamp: any) => {
    if (!timestamp) return '';

    try {
      if (timestamp._seconds) {
        const date = new Date(timestamp._seconds * 1000);
        return moment(date).format('MMM D, YYYY');
      }
      return '';
    } catch (error) {
      return '';
    }
  };

  // Group days by time slots
  const groupDaysByTime = () => {
    const groups: {[key: string]: any[]} = {};

    sortedDays.forEach(day => {
      const fromTime = formatTimestamp(day.fromTime);
      const toTime = formatTimestamp(day.toTime);
      const key = `${fromTime}-${toTime}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push({
        ...day,
        formattedFromTime: fromTime,
        formattedToTime: toTime,
      });
    });

    return groups;
  };

  const timeGroups = groupDaysByTime();
  const timeGroupEntries = Object.entries(timeGroups);

  // Get current day abbreviation and full name
  const getCurrentDay = () => {
    const dayAbbr = moment().format('ddd');
    return {
      abbr: dayAbbr,
      full: dayMap[dayAbbr] || dayAbbr,
    };
  };

  // Check if a day is today
  const isToday = (dayAbbr: string) => {
    const currentDay = getCurrentDay();
    return dayAbbr === currentDay.abbr;
  };

  // Get next available day
  const getNextAvailableDay = () => {
    const today = getCurrentDay();
    const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const todayIndex = daysOrder.indexOf(today.abbr);

    // Check from today onwards
    for (let i = 0; i < daysOrder.length; i++) {
      const checkDayAbbr = daysOrder[(todayIndex + i) % daysOrder.length];
      const availableDay = sortedDays.find(day => day.day === checkDayAbbr);

      if (availableDay) {
        const fromTime = formatTimestamp(availableDay.fromTime);
        const toTime = formatTimestamp(availableDay.toTime);

        return {
          day: checkDayAbbr,
          fullDay: dayMap[checkDayAbbr] || checkDayAbbr,
          time: `${fromTime} - ${toTime}`,
          isToday: i === 0,
        };
      }
    }

    return null;
  };

  const nextAvailable = getNextAvailableDay();

  // Filter days based on selection
  const getFilteredDays = () => {
    if (selectedFilter === 'today') {
      const today = getCurrentDay();
      return sortedDays.filter(day => day.day === today.abbr);
    } else if (selectedFilter === 'weekdays') {
      return sortedDays.filter(day =>
        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day.day),
      );
    } else if (selectedFilter === 'weekend') {
      return sortedDays.filter(day => ['Sat', 'Sun'].includes(day.day));
    }
    return sortedDays;
  };

  const filteredDays = getFilteredDays();

  // Get unique time slots count
  const getUniqueTimeSlotsCount = () => {
    const uniqueTimes = new Set();
    sortedDays.forEach(day => {
      const key = `${formatTimestamp(day.fromTime)}-${formatTimestamp(
        day.toTime,
      )}`;
      uniqueTimes.add(key);
    });
    return uniqueTimes.size;
  };

  // Calculate total available hours per week
  const calculateTotalHours = () => {
    let totalMinutes = 0;

    sortedDays.forEach(day => {
      if (
        day.fromTime &&
        day.toTime &&
        day.fromTime._seconds &&
        day.toTime._seconds
      ) {
        const from = new Date(day.fromTime._seconds * 1000);
        const to = new Date(day.toTime._seconds * 1000);
        const diffMs = to.getTime() - from.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        // Handle overnight shifts (if end time is next day)
        if (diffMinutes < 0) {
          totalMinutes += 24 * 60 + diffMinutes; // Add 24 hours
        } else {
          totalMinutes += diffMinutes;
        }
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    return {hours, minutes};
  };

  const totalHours = calculateTotalHours();



   const user = auth().currentUser;
  const userId = user?.uid;
  const generateChatId = () => {
    return `${userId}_${item.id}`;
  };
  const chatId = generateChatId();
  const [existingChatId, setExistingChatId] = useState<string | null>(null);

  const fetchExistingChatId = async (userId1: any, userId2: any) => {
    try {
      const chatsSnapshot = await firestore()
        .collection('Chats')
        .where('participants', 'array-contains', userId1)
        .get();

      for (const doc of chatsSnapshot.docs) {
        const chatData = doc.data();
        const participants = chatData.participants || [];

        if (participants.includes(userId1) && participants.includes(userId2)) {
          return doc.id;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const tryToFindChat = async () => {
      if (user?.uid && item?.jobId) {
        const chatId = await fetchExistingChatId(userId, item.id);
        if (chatId) {
          setExistingChatId(chatId);
        }
      }
    };
    tryToFindChat();
  }, [userId, item?.id]);

  const [token, setFcmToken] = useState<string>('');
  useEffect(() => {
    fetchToken(item.id);
  }, []);

  const fetchToken = async (id: any) => {
    try {
      const userDoc = await firestore().collection('Users').doc(id).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setFcmToken(userData?.fcmToken);
      }
    } catch (error) {}
  };


  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent
      />

      {/* Header with Gradient */}
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Feather
              name="arrow-left"
              color={Colors.white}
              size={RFPercentage(2.4)}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Availability Schedule</Text>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Provider Info Card */}
        <View style={styles.providerCard}>
          <View style={styles.profileContainer}>
            <View style={styles.imageWrapper}>
              <Image
                source={item.image ? {uri: item.image} : IMAGES.defaultPic}
                style={styles.providerImage}
                resizeMode="cover"
              />
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={12}
                  color={Colors.white}
                />
              </View>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{item.name}</Text>
              <Text style={styles.providerTag}>Service Provider</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.nextAvailableContainer}>
            <View style={styles.nextAvailableHeader}>
              <Ionicons
                name="time-outline"
                size={18}
                color={Colors.gradient1}
              />
              <Text style={styles.nextAvailableTitle}>Next Available</Text>
            </View>
            {nextAvailable ? (
              <View style={styles.nextAvailableTime}>
                <View
                  style={[
                    styles.nextDayBadge,
                    nextAvailable.isToday && styles.todayBadge,
                  ]}>
                  <MaterialCommunityIcons
                    name={
                      nextAvailable.isToday ? 'calendar-star' : 'calendar-blank'
                    }
                    size={16}
                    color={Colors.white}
                  />
                  <Text style={styles.nextDayText}>
                    {nextAvailable.isToday ? 'Today' : nextAvailable.fullDay}
                  </Text>
                </View>
                <Text style={styles.nextTimeText}>{nextAvailable.time}</Text>
              </View>
            ) : (
              <Text style={styles.noAvailabilityText}>
                No availability scheduled
              </Text>
            )}
          </View>
        </View>

        {/* Filter Options */}
        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>Filter by</Text>
          <ScrollView
            horizontal
            contentContainerStyle={{paddingHorizontal:RFPercentage(2)}}
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}>
            {[
              {id: 'all', label: 'All Days', icon: 'calendar-month'},
              {id: 'today', label: 'Today', icon: 'calendar-today'},
              {id: 'weekdays', label: 'Weekdays', icon: 'briefcase-outline'},
              {id: 'weekend', label: 'Weekend', icon: 'palm-tree'},
            ].map(filter => (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setSelectedFilter(filter.id)}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.id && styles.filterButtonActive,
                ]}>
                <MaterialCommunityIcons
                  name={filter.icon}
                  size={16}
                  color={
                    selectedFilter === filter.id ? Colors.white : Colors.gradient1
                  }
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === filter.id &&
                      styles.filterButtonTextActive,
                  ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Availability Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <MaterialCommunityIcons
              name="calendar-check"
              size={20}
              color={Colors.gradient1}
            />
            <Text style={styles.summaryTitle}>Availability Summary</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{filteredDays.length}</Text>
              <Text style={styles.statLabel}>Days</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getUniqueTimeSlotsCount()}</Text>
              <Text style={styles.statLabel}>Time Slots</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {totalHours.hours}
                {totalHours.minutes > 0 && (
                  <Text style={styles.statValueMinutes}>
                    .{Math.round(totalHours.minutes / 6)}
                  </Text>
                )}
              </Text>
              <Text style={styles.statLabel}>Hours/Week</Text>
            </View>
          </View>
        </View>

        {/* Grouped Time Slots */}
        {timeGroupEntries.length > 0 ? (
          <View style={styles.timeSlotsCard}>
            <View style={styles.timeSlotsHeader}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={Colors.gradient1}
              />
              <Text style={styles.timeSlotsTitle}>Available Time Slots</Text>
            </View>

            {timeGroupEntries.map(([timeKey, days], index) => {
              const firstDay = days[0];
              return (
                <View key={index} style={styles.timeSlotGroup}>
                  <LinearGradient
                    colors={[Colors.slateBlueLight, Colors.slateBlue]}
                    style={styles.timeSlotHeader}>
                    <View style={styles.timeSlotTime}>
                      <Ionicons name="time" size={16} color={Colors.white} />
                      <Text style={styles.timeSlotText}>
                        {firstDay.formattedFromTime} -{' '}
                        {firstDay.formattedToTime}
                      </Text>
                    </View>
                    <View style={styles.daysCountBadge}>
                      <Text style={styles.daysCountText}>
                        {days.length} days
                      </Text>
                    </View>
                  </LinearGradient>

                  <View style={styles.daysList}>
                    {days.map((day, dayIndex) => (
                      <View key={dayIndex} style={styles.dayItem}>
                        <View style={styles.dayInfo}>
                          <View
                            style={[
                              styles.dayBadge,
                              isToday(day.day) && styles.todayDayBadge,
                            ]}>
                            <MaterialCommunityIcons
                              name={
                                isToday(day.day) ? 'star' : 'calendar-blank'
                              }
                              size={14}
                              color={
                                isToday(day.day) ? Colors.white : Colors.gradient1
                              }
                            />
                            <Text
                              style={[
                                styles.dayText,
                                isToday(day.day) && styles.todayDayText,
                              ]}>
                              {day.fullDay}
                            </Text>
                          </View>
                          {isToday(day.day) && (
                            <View style={styles.todayIndicator}>
                              <Text style={styles.todayIndicatorText}>
                                Today
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.timeIndicator}>
                          <Feather
                            name="clock"
                            size={14}
                            color={Colors.secondaryText}
                          />
                          <Text style={styles.timeIndicatorText}>
                            {day.formattedFromTime} - {day.formattedToTime}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="calendar-remove"
              size={60}
              color={Colors.secondaryText}
            />
            <Text style={styles.emptyStateTitle}>No Availability</Text>
            <Text style={styles.emptyStateText}>
              This provider hasn't set their availability schedule yet.
            </Text>
          </View>
        )}

        {/* Detailed Day List */}
        {/* {filteredDays.length > 0 && (
          <View style={styles.detailedListCard}>
            <View style={styles.detailedListHeader}>
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={20}
                color={Colors.gradient1}
              />
              <Text style={styles.detailedListTitle}>Detailed Schedule</Text>
            </View>
            <FlatList
              data={filteredDays}
              scrollEnabled={false}
              keyExtractor={(item, index) => `${item.day}-${index}`}
              renderItem={({item: day}) => (
                <View style={styles.checkAvailableWrapper}>
                  <CheckAvailable
                    day={day.fullDay}
                    fromTime={day.fromTime}
                    toTime={day.toTime}
                    isToday={isToday(day.day)}
                  />
                </View>
              )}
            />
          </View>
        )} */}

        {/* Bottom Action */}
        <View style={styles.bottomActionCard}>
          <Text style={styles.bottomActionTitle}>Need a different time?</Text>
          <Text style={styles.bottomActionText}>
            Contact the provider to discuss custom scheduling options
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => {
              if (userFlow === 'Guest') {
                setShowAuthModal(true);
                return;
              }

              navigation.navigate('Chat', {
                chatId: existingChatId ? existingChatId : chatId,
                senderId: profileData.uid,
                senderName: profileData.name,
                receiver: item.id,
                receiverName: item.name,
                receiverProfile: item.image,
                senderProfile: profileData.profile,
                fcmToken: token,
              });
            }}>
            <LinearGradient
              colors={[Colors.gradient1, Colors.gradient2]}
              style={styles.contactGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Feather name="message-circle" size={18} color={Colors.white} />
              <Text style={styles.contactButtonText}>Contact Provider</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showAuthModal && (
        <TouchableWithoutFeedback onPress={() => setShowAuthModal(false)}>
          <View style={styles.authModalContainer}>
            <BlurView style={styles.blurView} blurType="dark" blurAmount={10} />
            <CustomModal
              title="Login Required"
              subTitle="You need to sign in or create an account to contact service providers and get custom offers."
              onPress={() => setShowAuthModal(false)}
              onPress2={() => {
                setShowAuthModal(false);
                navigation.navigate('UserSelection');
              }}
              buttonTitle="Continue to Login"
            />
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

export default CheckAvailability;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? RFPercentage(7) : RFPercentage(6),
    paddingBottom: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
    // borderBottomLeftRadius: 30,
    // borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.whiteOverlay20,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.semiBold,
  },
  placeholderView: {
    width: RFPercentage(4.5),
  },
  scrollContent: {
    paddingHorizontal: RFPercentage(2),
    paddingBottom: RFPercentage(4),
  },
  providerCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: RFPercentage(2),
    marginTop: RFPercentage(2),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    // elevation: 5,
     borderWidth: 1,
    borderColor: Colors.lightGrayBg,
    borderBottomWidth: 2,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1.5),
  },
  imageWrapper: {
    position: 'relative',
    marginRight: RFPercentage(1.5),
  },
  providerImage: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(3),
    borderWidth: 2,
    borderColor: Colors.gradient1,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.gradient1,
    borderRadius: 10,
    width: RFPercentage(2.5),
    height: RFPercentage(2.5),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.semiBold,
    color: Colors.primaryText,
    marginBottom: RFPercentage(0.3),
  },
  providerTag: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGrayBg,
    marginVertical: RFPercentage(1.5),
  },
  nextAvailableContainer: {
    alignItems: 'center',
  },
  nextAvailableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1),
    gap: RFPercentage(0.5),
  },
  nextAvailableTitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
  },
  nextAvailableTime: {
    alignItems: 'center',
  },
  nextDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gradient1,
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: 16,
    gap: RFPercentage(0.3),
    marginBottom: RFPercentage(0.5),
  },
  todayBadge: {
    backgroundColor: Colors.amber500,
  },
  nextDayText: {
    color: Colors.white,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
  },
  nextTimeText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.gradient1,
  },
  noAvailabilityText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    fontStyle: 'italic',
  },
  filterCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: RFPercentage(2),
    marginTop: RFPercentage(2),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
     borderWidth: 1,
    borderColor: Colors.lightGrayBg,
    borderBottomWidth: 2,
  },
  filterTitle: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
    marginBottom: RFPercentage(1),
  },
  filterScroll: {
    marginHorizontal: -RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.8),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginRight: RFPercentage(1),
    gap: RFPercentage(0.5),
  },
  filterButtonActive: {
    backgroundColor: Colors.gradient1,
    borderColor: Colors.gradient1,
  },
  filterButtonText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    color: Colors.gradient1,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: RFPercentage(2),
    marginTop: RFPercentage(2),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
     borderWidth: 1,
    borderColor: Colors.lightGrayBg,
    borderBottomWidth: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(0.8),
  },
  summaryTitle: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: RFPercentage(2.6),
    fontFamily: Fonts.semiBold,
    color: Colors.gradient1,
  },
  statValueMinutes: {
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.fontMedium,
  },
  statLabel: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    marginTop: RFPercentage(0.3),
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: Colors.lightGrayBg,
  },
  timeSlotsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: RFPercentage(2),
    marginTop: RFPercentage(2),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
     borderWidth: 1,
    borderColor: Colors.lightGrayBg,
    borderBottomWidth: 2,
  },
  timeSlotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(0.8),
  },
  timeSlotsTitle: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
  },
  timeSlotGroup: {
    marginBottom: RFPercentage(1.5),
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: RFPercentage(1.2),
  },
  timeSlotTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.5),
  },
  timeSlotText: {
    color: Colors.white,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
  },
  daysCountBadge: {
    backgroundColor: Colors.whiteOverlay20,
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.3),
    borderRadius: 12,
  },
  daysCountText: {
    color: Colors.white,
    fontSize: RFPercentage(1.2),
    fontFamily: Fonts.fontMedium,
  },
  daysList: {
    padding: RFPercentage(1.2),
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: RFPercentage(0.8),
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.8),
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGrayBg,
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.3),
    borderRadius: 12,
    gap: RFPercentage(0.3),
  },
  todayDayBadge: {
    backgroundColor: Colors.gradient1,
  },
  dayText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
  },
  todayDayText: {
    color: Colors.white,
  },
  todayIndicator: {
    backgroundColor: Colors.orangeBg50,
    paddingHorizontal: RFPercentage(0.6),
    paddingVertical: RFPercentage(0.2),
    borderRadius: 8,
  },
  todayIndicatorText: {
    color: Colors.orange600,
    fontSize: RFPercentage(1.1),
    fontFamily: Fonts.fontMedium,
  },
  timeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.3),
  },
  timeIndicatorText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: RFPercentage(3),
    marginTop: RFPercentage(2),
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
  },
  emptyStateTitle: {
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
    marginTop: RFPercentage(1),
  },
  emptyStateText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginTop: RFPercentage(0.5),
    lineHeight: RFPercentage(2),
  },
  detailedListCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: RFPercentage(2),
    marginTop: RFPercentage(2),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
  },
  detailedListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(0.8),
  },
  detailedListTitle: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
  },
  checkAvailableWrapper: {
    marginBottom: RFPercentage(1),
  },
  bottomActionCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: RFPercentage(2),
    marginTop: RFPercentage(2),
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
  },
  bottomActionTitle: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
    marginBottom: RFPercentage(0.5),
  },
  bottomActionText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: RFPercentage(1.5),
    lineHeight: RFPercentage(2),
  },
  contactButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  contactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RFPercentage(1.5),
    gap: RFPercentage(0.8),
  },
  contactButtonText: {
    color: Colors.white,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
  authModalContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
});
