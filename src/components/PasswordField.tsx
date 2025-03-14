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

const PasswordField: React.FC<Props> = (props: Props) => {
  const [visible, setVisible] = useState<boolean>(true);

  const togglePasswordVisibility = () => {
    setVisible(!visible);
  };

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
            paddingVertical: 0,
            marginVertical: 0,
            textAlignVertical: 'center',
            includeFontPadding: false,
            width: '80%',
          }}
          secureTextEntry={!visible}
          value={props.value}
          onChangeText={props.onChangeText}
          onBlur={props.handleBlur}
        />
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          style={{position: 'absolute', right: 0}}>
          <Feather
            name={visible ? 'eye' : 'eye-off'}
            size={RFPercentage(1.5)}
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
    height: RFPercentage(5.4),
    borderWidth: 1,
    borderColor: Colors.inputFieldColor,
    borderRadius: RFPercentage(0.8),
    marginVertical: RFPercentage(1.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
