import { StyleSheet, Text, TextInput, View, NativeSyntheticEvent, TextInputFocusEventData } from 'react-native'
import React from 'react'
import { Fonts, Colors } from '../constants/Themes'
import { RFPercentage } from "react-native-responsive-fontsize";

interface Props {
    placeholder: string,
    onChangeText: (text: string) => void,
    value: string,
    handleBlur?: (event: any) => void;
    customStyle?: object
}

const InputField: React.FC<Props> = (props: Props) => {
    return (
        <View style={[styles.container, props.customStyle]} >
            <TextInput placeholder={props.placeholder} placeholderTextColor={Colors.placeholderColor} style={{ color: Colors.secondaryText, fontFamily: Fonts.fontRegular,  fontSize: RFPercentage(1.4), }} value={props.value} onChangeText={props.onChangeText} onBlur={props.handleBlur} />
        </View>
    )
}

export default InputField

const styles = StyleSheet.create({
    container: {
        width: RFPercentage(41),
        height: RFPercentage(5),
        borderWidth: 1,
        borderColor: Colors.inputFieldColor,
        borderRadius:RFPercentage(0.8),
        paddingHorizontal:RFPercentage(1),
        marginVertical:RFPercentage(1.5)
    }
})