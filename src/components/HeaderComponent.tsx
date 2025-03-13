import {
    StyleSheet,
    Text,
    View,
    Image
} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient'
import { Fonts, Colors, IMAGES } from '../constants/Themes';
import { RFPercentage } from "react-native-responsive-fontsize";




const HeaderComponent: React.FC = () => {
    return (
        <View style={{ paddingHorizontal:RFPercentage(2), flexDirection:'row', alignItems:'center', justifyContent:'space-between', height:RFPercentage(20), top:RFPercentage(-1.8)}}>
            <View style={{}}>
                <Image
                    source={IMAGES.stars}
                    resizeMode='contain'
                    style={{ width: RFPercentage(10), height: RFPercentage(10), right: RFPercentage(2), top:RFPercentage(1) }}
                />
            </View>

            <View style={{top:RFPercentage(3), right:RFPercentage(4.5)}}>
                <Image
                    source={IMAGES.logo}
                    resizeMode='contain'
                    style={{ width: RFPercentage(13), height: RFPercentage(12) }}
                />
            </View>
            <View></View>
        </View>
    )
}

export default HeaderComponent

const styles = StyleSheet.create({
})