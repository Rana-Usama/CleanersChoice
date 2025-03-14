import {StyleSheet, Text, View, Image} from 'react-native';
import React from 'react';
import {Fonts, Colors, IMAGES} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';

const HeaderComponent: React.FC = () => {
  return (
    <View
      style={{
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf:'center',
        marginTop:RFPercentage(2)
      }}>
      <View style={{position: "absolute",left:0}}>
        <Image
          source={IMAGES.stars}
          resizeMode="contain"
          style={{
            width: RFPercentage(10),
            height: RFPercentage(10),
          }}
        />
      </View>

      <View style={{}}>
        <Image
          source={IMAGES.logo}
          resizeMode="contain"
          style={{width: RFPercentage(13), height: RFPercentage(12)}}
        />
      </View>
      <View></View>
    </View>
  );
};

export default HeaderComponent;

const styles = StyleSheet.create({});
