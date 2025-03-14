import {
  StyleSheet,
  Text,
  TextInput,
  View,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';
import React from 'react';
import {Fonts, Colors} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';

interface Props {
  placeholder: string;
  onChangeText: (text: string) => void;
  value: string;
  handleBlur?: (event: any) => void;
  customStyle?: object;
}

const InputField: React.FC<Props> = (props: Props) => {
  return (
    <View style={[styles.container, props.customStyle]}>
      <View style={{width:'95%'}}>
        <TextInput
          placeholder={props.placeholder}
          placeholderTextColor={Colors.placeholderColor}
          style={{
            color: Colors.primaryText,
            fontFamily: Fonts.fontRegular,
            fontSize: RFPercentage(1.5),
            paddingVertical:0,
            marginVertical:0,
            textAlignVertical: 'center',
            includeFontPadding: false
          }}
          value={props.value}
          onChangeText={props.onChangeText}
          onBlur={props.handleBlur}
        />
      </View>
    </View>
  );
};

export default InputField;

const styles = StyleSheet.create({
  container: {
    width: '90%',
    height: RFPercentage(5),
    borderWidth: 1,
    borderColor: Colors.inputFieldColor,
    borderRadius: RFPercentage(0.8),
    marginVertical: RFPercentage(1.5),
    alignItems:'center',
    justifyContent:'center'
  },
});
