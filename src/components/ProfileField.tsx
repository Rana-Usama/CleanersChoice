import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { RFPercentage } from 'react-native-responsive-fontsize'
import { Colors, Fonts } from '../constants/Themes'
import Entypo from 'react-native-vector-icons/Entypo'

interface Props {
    onPress: () => void,
    icon: any,
    color?: string,
    text: string
}

const ProfileField: React.FC<Props> = (props: Props) => {
    return (
        <TouchableOpacity onPress={props.onPress}>
            <View style={styles.container}>
                <View style={styles.textContainer}>
                    <Image source={props.icon} resizeMode='contain' style={styles.icon} />
                    <Text style={[styles.text, props.color && { color: props.color }]}>{props.text}</Text>
                </View>
                <TouchableOpacity onPress={props.onPress}>
                    <Entypo name='chevron-thin-right' size={RFPercentage(1.6)} color={Colors.brown} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    )
}

export default ProfileField

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: RFPercentage(5.4),
        borderWidth: 1,
        borderColor: Colors.inputFieldColor,
        borderRadius: 8,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginVertical: 10,
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        width: RFPercentage(2),
        height: RFPercentage(2),
    },
    text: {
        color: Colors.brown,
        fontFamily: Fonts.fontRegular,
        fontSize: RFPercentage(1.5),
        left: 8,
        top: 1,
    }
})
