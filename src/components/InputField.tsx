import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import React from 'react';
import { Fonts, Colors } from '../constants/Themes';
import { RFPercentage } from 'react-native-responsive-fontsize';

interface Props {
  placeholder: string;
  onChangeText?: (text: string) => void;
  value?: string;
  handleBlur?: (event: any) => void;
  customStyle?: object;
  type? : any;
  length? : any
}

const InputField: React.FC<Props> = (props: Props) => {
  return (
    <View style={[styles.container, props.customStyle]}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder={props.placeholder}
          placeholderTextColor={Colors.placeholderColor}
          style={styles.textInput}
          value={props.value}
          onChangeText={props.onChangeText}
          onBlur={props.handleBlur}
          keyboardType={props.type}
          maxLength={props.length}
          
        />
      </View>
    </View>
  );
};

export default InputField;

const styles = StyleSheet.create({
  container: {
    width: '90%',
    height: RFPercentage(6.5),
    borderWidth: 1,
    borderColor: Colors.inputFieldColor,
    borderRadius: RFPercentage(1),
    marginVertical: RFPercentage(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    width: '95%',
  },
  textInput: {
    color: Colors.inputTextColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.8),
    paddingVertical: 0,
    marginVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});
