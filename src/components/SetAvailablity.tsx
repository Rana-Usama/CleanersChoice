import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import DatePicker from 'react-native-date-picker';
import {useSelector} from 'react-redux';

interface Props {
  day: string;
}

const SetAvailability = ({ day, fromTime, toTime, onUpdateAvailability }) => {
  const userFlow = useSelector(state => state.userFlow.userFlow);
  // const [fromTime, setFromTime] = useState(() => {
  //   const date = new Date();
  //   date.setHours(9, 0, 0, 0);
  //   return date;
  // });

  // const [toTime, setToTime] = useState(() => {
  //   const date = new Date();
  //   date.setHours(18, 0, 0, 0);
  //   return date;
  // });

  const [openFromPicker, setOpenFromPicker] = useState(false);
  const [openToPicker, setOpenToPicker] = useState(false);




  return (
    <View style={styles.container}>
      {/* Day View */}
      <View style={styles.dayView}>
        <Text style={styles.dayText}>{day}</Text>
      </View>

      {/* From Time */}
      <Text style={styles.label}>From</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpenFromPicker(true)}
        disabled={userFlow === 'Customer' ? true : false}
        style={styles.timeView}>
        <Text
          style={[
            styles.timeText,
          ]}>
          {new Date(fromTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </Text>
      </TouchableOpacity>

      {/* To Time */}
      <Text style={styles.label}>To</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpenToPicker(true)}
        disabled={userFlow === 'Customer' ? true : false}
        style={styles.timeView}>
        <Text style={[styles.timeText]}>
        {new Date(toTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </Text>
      </TouchableOpacity>

      {/* Time Pickers */}
      <DatePicker
        modal
        mode="time"
        open={openFromPicker}
        date={new Date(fromTime)}
        onConfirm={(date) => {
          onUpdateAvailability(day, date, toTime);
          setOpenFromPicker(false);
        }}
        onCancel={() => setOpenFromPicker(false)}
      />

      <DatePicker
        modal
        mode="time"
        open={openToPicker}
        date={new Date(toTime)}
        onConfirm={(date) => {
          onUpdateAvailability(day, fromTime, date);
          setOpenToPicker(false);
        }}
        onCancel={() => setOpenToPicker(false)}
      />
    </View>
  );
};

export default SetAvailability;

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
    backgroundColor: 'rgba(164, 172, 188, 0.5)'
  },
  dayText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
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
    fontSize: RFPercentage(1.4),
  },
  boldText: {
    fontFamily: Fonts.bold, // Assuming you have a bold font variant
  },
});
