import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import React from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

type CheckAvailableProps = {
  day: string;
  fromTime: any;
  toTime: any;
  isToday?: boolean;
  onPress?: () => void;
};

const CheckAvailable: React.FC<CheckAvailableProps> = ({
  day,
  fromTime,
  toTime,
  isToday = false,
  onPress,
}) => {
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '--:--';

    // Handle both Unix timestamp (seconds) and Date objects
    const date = timestamp._seconds
      ? new Date(timestamp._seconds * 1000)
      : new Date(timestamp);

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format day abbreviation
  const getDayAbbreviation = () => {
    const abbreviations: {[key: string]: string} = {
      Monday: 'Mon',
      Tuesday: 'Tue',
      Wednesday: 'Wed',
      Thursday: 'Thu',
      Friday: 'Fri',
      Saturday: 'Sat',
      Sunday: 'Sun',
    };
    return abbreviations[day] || day.slice(0, 3);
  };

  // Get day number for calendar view
  const getDayNumber = () => {
    const dayMap: {[key: string]: number} = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };
    return dayMap[day] || 0;
  };

  // Get icon based on day
  const getDayIcon = () => {
    if (isToday) return 'star';

    const dayIcons: {[key: string]: string} = {
      Monday: 'calendar-blank',
      Tuesday: 'calendar-blank',
      Wednesday: 'calendar-blank',
      Thursday: 'calendar-blank',
      Friday: 'calendar-blank',
      Saturday: 'palm-tree',
      Sunday: 'weather-sunny',
    };
    return dayIcons[day] || 'calendar-blank';
  };

  const ComponentWrapper = onPress ? TouchableOpacity : View;

  return (
    <ComponentWrapper
      style={[styles.container, isToday && styles.todayContainer]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Left: Calendar-style day indicator */}
      <View style={styles.daySection}>
        <View style={styles.dayInfo}>
          <Text
            style={[styles.dayFullName, isToday && styles.todayDayFullName]}>
            {getDayAbbreviation()}
          </Text>
          {/* {isToday && (
            <View style={styles.todayBadge}>
              <Feather name="zap" size={10} color="#FFFFFF" />
              <Text style={styles.todayBadgeText}>Today</Text>
            </View>
          )} */}
        </View>
      </View>

      {/* Center: Time Slot */}
      <View style={styles.timeSection}>
        <View style={styles.timeSlot}>
          <View style={styles.timeIconContainer}>
            <Ionicons
              name="time-outline"
              size={16}
              color={isToday ? Colors.gradient1 : Colors.secondaryText}
            />
          </View>
          <View style={styles.timeRange}>
            <Text style={[styles.timeText, isToday && styles.todayTimeText]}>
              {formatTime(fromTime)}
            </Text>
            <Feather
              name="arrow-right"
              size={12}
              color={isToday ? Colors.gradient1 : Colors.secondaryText}
              style={styles.arrowIcon}
            />
            <Text style={[styles.timeText, isToday && styles.todayTimeText]}>
              {formatTime(toTime)}
            </Text>
          </View>
        </View>
      </View>

      {/* Right: Status Indicator */}
      <View style={styles.statusSection}>
        <LinearGradient
          colors={[Colors.gradient1, Colors.gradient2]}
          style={styles.availableBadge}>
          <MaterialCommunityIcons
            name="check-circle"
            size={14}
            color={Colors.white}
          />
          <Text style={styles.availableText}>Available</Text>
        </LinearGradient>
      </View>
    </ComponentWrapper>
  );
};

export default CheckAvailable;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: RFPercentage(1.5),
    marginBottom: RFPercentage(1),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
    justifyContent: 'space-between',
  },
  todayContainer: {
    backgroundColor: Colors.skyBlueBg,
    borderColor: Colors.gradient1,
    borderWidth: 1.5,
    shadowColor: Colors.gradient1,
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  daySection: {
    // backgroundColor:"red",
    width: RFPercentage(4),
  },
  dayCircle: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(2.5),
    backgroundColor: Colors.lightGrayBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFPercentage(1),
  },
  todayDayCircle: {
    backgroundColor: Colors.gradient1,
  },
  dayAbbreviation: {
    fontSize: RFPercentage(1.2),
    fontFamily: Fonts.fontMedium,
    color: Colors.secondaryText,
    marginBottom: -2,
  },
  todayDayText: {
    color: Colors.white,
  },
  dayNumber: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.semiBold,
    color: Colors.primaryText,
  },
  todayDayNumber: {
    color: Colors.white,
  },
  dayInfo: {
    flexDirection: 'column',
  },
  dayFullName: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
    marginBottom: RFPercentage(0.2),
  },
  todayDayFullName: {
    color: Colors.gradient1,
    fontFamily: Fonts.semiBold,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.amberBg100,
    paddingHorizontal: RFPercentage(0.6),
    paddingVertical: RFPercentage(0.2),
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 2,
    position:"absolute"
  },
  todayBadgeText: {
    color: Colors.amberDarkText,
    fontSize: RFPercentage(1),
    fontFamily: Fonts.fontMedium,
  },
  timeSection: {
    // flex: 1,
    // alignItems: 'center',
    marginLeft: RFPercentage(1.5),
    // backgroundColor:"red"
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.8),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  timeIconContainer: {
    marginRight: RFPercentage(0.5),
  },
  timeRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
  },
  todayTimeText: {
    color: Colors.gradient1,
    fontFamily: Fonts.semiBold,
  },
  arrowIcon: {
    marginHorizontal: RFPercentage(0.5),
  },
  statusSection: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: RFPercentage(0.5),
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.4),
    borderRadius: 12,
    gap: RFPercentage(0.3),
  },
  availableText: {
    color: Colors.white,
    fontSize: RFPercentage(1.1),
    fontFamily: Fonts.fontMedium,
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.greenBg75,
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.4),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.successBg,
    gap: RFPercentage(0.3),
  },
  scheduledText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.1),
    fontFamily: Fonts.fontMedium,
  },
  chevronIcon: {
    marginLeft: RFPercentage(0.3),
  },
});
