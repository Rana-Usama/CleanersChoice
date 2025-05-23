import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { Colors, Fonts } from '../constants/Themes';

type CheckAvailableProps = {
  day: string;
  fromTime: any; // assuming Unix timestamp in seconds
  toTime: any;   // assuming Unix timestamp in seconds
};

const CheckAvailable: React.FC<CheckAvailableProps> = ({ day, fromTime, toTime }) => {
  const fromDate = new Date(fromTime * 1000);
  const toDate = new Date(toTime * 1000);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.dayView}>
        <Text style={styles.dayText}>{day}</Text>
      </View>

      <Text style={styles.label}>From</Text>
      <View style={styles.timeView}>
        <Text style={styles.timeText}>{formatTime(fromDate)}</Text>
      </View>

      <Text style={styles.label}>To</Text>
      <View style={styles.timeView}>
        <Text style={styles.timeText}>{formatTime(toDate)}</Text>
      </View>
    </View>
  );
};

export default CheckAvailable;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginTop: RFPercentage(1.8),
  },
  dayView: {
    width: RFPercentage(10),
    height: RFPercentage(3.8),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(164, 172, 188, 0.5)',
  },
  dayText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
  },
  label: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
  },
  timeView: {
    width: RFPercentage(10),
    height: RFPercentage(3.8),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(231, 239, 245)',
  },
  timeText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
  },
});
