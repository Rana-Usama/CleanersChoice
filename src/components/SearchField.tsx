import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import Feather from 'react-native-vector-icons/Feather';
import {Fonts, Colors} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';

interface Props {
  placeholder: string;
  onChangeText: (text: string) => void;
  value: string;
  handleBlur?: (event: any) => void;
  customStyle?: object;
}

const SearchField: React.FC<Props> = (props: Props) => {

  return (
    <View style={[styles.container, props.customStyle]}>
      <View
        style={{
          width: '95%',
          alignItems: 'center',
          justifyContent: 'flex-start',
          flexDirection: 'row',
        }}>
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
        />
        <TouchableOpacity
          style={{position: 'absolute', right: 0}}>
          <Feather
            name={'search'}
            size={RFPercentage(1.8)}
            color={Colors.secondaryText}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SearchField;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: RFPercentage(5),
    borderWidth: 1,
    borderColor: Colors.inputFieldColor,
    borderRadius: RFPercentage(0.9),
    marginVertical: RFPercentage(1.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
