import {StyleSheet, Text, View, TextInput} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';

const MAX_WORDS = 150;

const DescriptionField = props => {
  const [wordCount, setWordCount] = useState(0);

  const handleTextChange = text => {
    const words = text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
    setWordCount(words.length);
  };

  return (
    <View style={[styles.textArea,{...props.style}]}>
      <TextInput
        placeholder={props.placeholder}
        placeholderTextColor={Colors.placeholderColor}
        style={styles.textInput}
        numberOfLines={20}
        multiline
        onChangeText={handleTextChange}
      />
      {props.count && (
        <Text style={styles.wordCount}>
          {wordCount}/{MAX_WORDS}
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
    borderRadius: RFPercentage(0.8),
    marginVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.8),
  },
  textInput: {
    color: Colors.inputTextColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    paddingVertical: 0,
    marginVertical: 0,
    textAlign: 'left',
    textAlignVertical: 'top',
    includeFontPadding: false,
    flex: 1,
  },
  wordCount: {
    position: 'absolute',
    bottom: RFPercentage(0.5),
    right: RFPercentage(1),
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
  },
});
