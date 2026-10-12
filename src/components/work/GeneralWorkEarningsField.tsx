import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {Colors, Fonts} from '../../constants/Themes';

export const GeneralWorkEarningsField = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange(value: string): void;
  disabled?: boolean;
}) => (
  <View style={styles.group}>
    <Text style={styles.label}>Expected earnings</Text>
    <View style={styles.field}>
      <Text style={styles.currency}>$</Text>
      <TextInput
        accessibilityLabel="Expected earnings"
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor={Colors.secondaryText}
        maxLength={12}
        style={styles.input}
      />
    </View>
    {/* <Text style={styles.hint}>Total for this work · editable later</Text> */}
  </View>
);
const styles = StyleSheet.create({
  group: {gap: 6},
  label: {fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.primaryText},
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.gray50,
    paddingHorizontal: 12,
  },
  currency: {fontFamily: Fonts.semiBold, fontSize: 16, color: Colors.gradient1},
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    fontFamily: Fonts.fontRegular,
    fontSize: 15,
    color: Colors.primaryText,
  },
  hint: {
    fontFamily: Fonts.fontRegular,
    fontSize: 11,
    color: Colors.secondaryText,
  },
});
