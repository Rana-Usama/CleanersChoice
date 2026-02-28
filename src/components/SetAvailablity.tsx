import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import DatePicker from 'react-native-date-picker';
import {useSelector} from 'react-redux';
import CheckBox from 'react-native-check-box';

/* -------------------- Types -------------------- */

type SetAvailabilityProps = {
  day: string;
  fullName: string;
  fromTime: Date;
  toTime: Date;
  checked: boolean;
  onToggleCheckBox: (day: string) => void;
  onUpdateAvailability: (day: string, fromTime: Date, toTime: Date) => void;
};

type RootState = {
  profile: {
    profileData: {
      role: 'Customer' | 'Cleaner' | string;
    };
  };
};

/* -------------------- Component -------------------- */

const SetAvailability: React.FC<SetAvailabilityProps> = ({
  day,
  fromTime,
  toTime,
  onUpdateAvailability,
  checked,
  onToggleCheckBox,
}) => {
  const profileRole = useSelector(
    (state: RootState) => state.profile.profileData.role,
  );

  const [openFromPicker, setOpenFromPicker] = useState<boolean>(false);
  const [openToPicker, setOpenToPicker] = useState<boolean>(false);

  const isDisabled = profileRole === 'Customer';

  return (
    <View style={styles.container}>
      <CheckBox
        disabled={false}
        isChecked={checked}
        onClick={() => onToggleCheckBox(day)}
        checkedCheckBoxColor={Colors.gradient1}
        uncheckedCheckBoxColor={Colors.checkboxGray}
      />

      <View style={styles.dayView}>
        <Text style={styles.dayText}>{day}</Text>
      </View>

      <Text style={styles.label}>From</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpenFromPicker(true)}
        disabled={isDisabled}
        style={styles.timeView}>
        <Text style={styles.timeText}>
          {fromTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>To</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpenToPicker(true)}
        disabled={isDisabled}
        style={styles.timeView}>
        <Text style={styles.timeText}>
          {toTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}
        </Text>
      </TouchableOpacity>

      {/* From Time Picker */}
      <DatePicker
        modal
        mode="time"
        open={openFromPicker}
        date={fromTime}
        onConfirm={(date: Date) => {
          onUpdateAvailability(day, date, toTime);
          setOpenFromPicker(false);
        }}
        onCancel={() => setOpenFromPicker(false)}
        theme="light"
        buttonColor={Colors.gradient1}
        dividerColor={Colors.gradient1}
      />

      {/* To Time Picker */}
      <DatePicker
        modal
        mode="time"
        open={openToPicker}
        date={toTime}
        onConfirm={(date: Date) => {
          onUpdateAvailability(day, fromTime, date);
          setOpenToPicker(false);
        }}
        onCancel={() => setOpenToPicker(false)}
        theme="light"
        buttonColor={Colors.gradient1}
        dividerColor={Colors.gradient1}
      />
    </View>
  );
};

export default SetAvailability;

/* -------------------- Styles -------------------- */

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginTop: RFPercentage(1.8),
  },
  dayView: {
    width: RFPercentage(9),
    height: RFPercentage(3.8),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.checkboxGrayOverlay50,
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
    width: RFPercentage(9),
    height: RFPercentage(3.8),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.timePickerBg,
  },
  timeText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
  },
});
