import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import Feather from 'react-native-vector-icons/Feather';
import {Fonts, Colors} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';

interface Props {
  placeholder: string;
  onChangeText: (text: string) => void;
  value: string;
  customStyle?: object;
}

const SearchField: React.FC<Props> = (props: Props) => {
  return (
    <View style={[styles.container, props.customStyle]}>
      <View style={styles.innerContainer}>
        <TextInput
          placeholder={props.placeholder}
          placeholderTextColor={Colors.placeholderColor}
          style={styles.input}
          value={props.value}
          onChangeText={props.onChangeText}
        />
        <TouchableOpacity   activeOpacity={0.8} style={styles.iconContainer}>
          <Feather name={'search'} size={RFPercentage(2.2)} color={Colors.secondaryText} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SearchField;

const styles = StyleSheet.create({
  container: {
    width: '82%',
    height: RFPercentage(6),
    borderWidth: 1,
    borderColor: Colors.inputFieldColor,
    borderRadius: RFPercentage(1.4),
    marginVertical: RFPercentage(1.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContainer: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  input: {
    color: Colors.inputTextColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.8),
    paddingVertical: 0,
    marginVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
    width:"90%"
  },
  iconContainer: {
    position: 'absolute',
    right: 0,
  },
});
