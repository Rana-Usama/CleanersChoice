import { StyleSheet, Text, View, TextInput } from 'react-native';
import React, { useState } from 'react';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { Colors, Fonts } from '../constants/Themes';

interface Props {
  style?: object;
  placeholder: string;
  count: boolean;
  onChangeText?: (text: string) => void;
  value?: string;
  maxLength? : number
}


const DescriptionField = (props: Props) => {
  const MAX_CHARACTERS = props.maxLength;


  const handleTextChange = (text: string) => {
    if (text.length <= MAX_CHARACTERS) {
      props.onChangeText?.(text);
    }
  };


  return (
    <View style={[styles.textArea, { ...props.style }]}>
      <TextInput
        placeholder={props.placeholder}
        placeholderTextColor={Colors.placeholderColor}
        style={styles.textInput}
        numberOfLines={20}
        multiline
        onChangeText={handleTextChange}
        value={props.value}
      />
      {props.count && (
        <Text
          style={[
            styles.charCount,
            { color: (props.value?.length ?? 0) === MAX_CHARACTERS ? 'red' : Colors.secondaryText },
          ]}
        >
          {props.value?.length ?? 0}/{MAX_CHARACTERS}
        </Text>
      )}
    </View>
  );
};

export default DescriptionField;

const styles = StyleSheet.create({
  textArea: {
    width: '100%',
    height: RFPercentage(13),
    borderWidth: 1,
    borderColor: Colors.inputFieldColor,
    borderRadius: RFPercentage(1.5),
    marginTop: RFPercentage(1),
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1),
  },
  textInput: {
    color: Colors.inputTextColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    paddingVertical: 0,
    marginVertical: 0,
    textAlign: 'left',
    textAlignVertical: 'top',
    includeFontPadding: false,
    flex: 1,
  },
  charCount: {
    position: 'absolute',
    bottom: RFPercentage(0.5),
    right: RFPercentage(1),
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
  },
});
