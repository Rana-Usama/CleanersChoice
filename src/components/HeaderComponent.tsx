import {StyleSheet, View, Image, Platform} from 'react-native';
import React from 'react';
import {IMAGES} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';

const HeaderComponent: React.FC = () => {
  return (
    <View
      style={{
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop:
          Platform.OS == 'android' ? RFPercentage(4) : RFPercentage(-0.8),
      }}>
      <View style={{position: 'absolute', left: 0}}>
        <Image
          source={IMAGES.stars}
          resizeMode="contain"
          style={{
            width: RFPercentage(8),
            height: RFPercentage(8),
          }}
        />
      </View>

      <Image
        source={IMAGES.logo}
        resizeMode="contain"
        style={{width: RFPercentage(13), height: RFPercentage(12)}}
      />
    </View>
  );
};

export default HeaderComponent;

const styles = StyleSheet.create({});
