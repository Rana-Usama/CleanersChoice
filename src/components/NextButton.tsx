import {
    StyleSheet,
    Text,
    View,
    ImageBackground,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient'
import { Fonts, Colors } from '../constants/Themes';
import { RFPercentage } from "react-native-responsive-fontsize";


interface Props {
    onPress: () => void,
    disabled?: boolean,
    color?: string,
    title: string,
    style?: object,
    loading? : boolean
}

const NextButton: React.FC<Props> = (props: Props) => {
    return (
        <TouchableOpacity onPress={props.onPress} style={{ flex: 1 }} disabled={props.disabled} >
            <View style={[styles.nextButton, { ...props.style }]}>
                <Text style={[styles.nextButtonText]}>{props.loading ? <ActivityIndicator size={'small'} color={Colors.background} /> : props.title}</Text>
            </View>
        </TouchableOpacity>
    )
}

export default NextButton

const styles = StyleSheet.create({
    nextButton: {
        height: RFPercentage(5),
        borderRadius: RFPercentage(5),
        alignItems: 'center',
        justifyContent: 'center',
        width: RFPercentage(16.5),
        borderWidth:1.4,
        borderColor:Colors.gradient2,
        backgroundColor : Colors.buttonColor
    },
    nextButtonText: {
        fontSize: RFPercentage(1.6),
        fontFamily: Fonts.fontMedium,
        color: Colors.primaryText
    },
})