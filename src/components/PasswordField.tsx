import {
  StyleSheet,
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
  onChangeText?: (text: string) => void;
  value?: string;
  handleBlur?: (event: any) => void;
  customStyle?: object;
}

const PasswordField: React.FC<Props> = (props: Props) => {
  const [visible, setVisible] = useState<boolean>(false);

  const togglePasswordVisibility = () => {
    setVisible(!visible);
  };

  return (
    <View style={[styles.container, props.customStyle]}>
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder={props.placeholder}
          placeholderTextColor={Colors.placeholderColor}
          style={styles.textInput}
          secureTextEntry={!visible}
          value={props.value}
          onChangeText={props.onChangeText}
          onBlur={props.handleBlur}
        />
        <TouchableOpacity onPress={togglePasswordVisibility} style={styles.iconWrapper}>
          <Feather
            name={visible ? 'eye' : 'eye-off'}
            size={RFPercentage(1.8)}
            color={Colors.secondaryText}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PasswordField;

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
  inputWrapper: {
    width: '92%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  textInput: {
    color: Colors.inputTextColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.8),
    paddingVertical: 0,
    marginVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '80%',
  },
  iconWrapper: {
    position: 'absolute',
    right: 0,
  },
});
