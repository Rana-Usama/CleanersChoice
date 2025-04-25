import {StyleSheet, View, Image, Platform} from 'react-native';
import React from 'react';
import {IMAGES} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';

const HeaderComponent: React.FC = () => {
  return (
    <View style={styles.container}>
      <Image source={IMAGES.logo} resizeMode="contain" style={styles.logo} />
    </View>
  );
};

export default HeaderComponent;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: Platform.OS == 'android' ? RFPercentage(4) : RFPercentage(0),
  },
  logo: {
    width: RFPercentage(13.5),
    height: RFPercentage(13.5),
  },
});
