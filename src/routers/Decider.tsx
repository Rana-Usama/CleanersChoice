import {SafeAreaView, StatusBar, StyleSheet, Image} from 'react-native';
import React, {useEffect} from 'react';

import {IMAGES, Colors} from '../constants/Themes';

const Decider = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <Image source={IMAGES.logo} style={styles.image} resizeMode="contain" />
    </SafeAreaView>
  );
};

export default Decider;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.background,
    },
    image: {
      width: '40%',
      height: '40%',
      bottom: '4%',
    },
  });
  