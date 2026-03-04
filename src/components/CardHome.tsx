import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts, Icons} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';

const HomeCard = ({onPostJob}: any) => {
  return (
    <LinearGradient
      colors={[Colors.gradient1, 'rgba(92, 141, 255, 0.53)']}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.gradientCard}>
      <View style={styles.content}>
        <View style={styles.textSection}>
          <Text style={styles.title}>Cleaning Services</Text>
          <Text style={styles.subtitle}>
            Available for service or post your job requirements
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.button}
            onPress={onPostJob}>
            <Text style={styles.buttonText}>Post a Job</Text>
            <Icon name="arrow-right" size={18} color={Colors.gradient1} />
          </TouchableOpacity>
        </View>
        <Image
          source={Icons.clean}
          resizeMode="contain"
          style={{width: RFPercentage(12), height: RFPercentage(12)}}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientCard: {
    marginHorizontal: 20,
    marginTop: RFPercentage(3),
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.gradient1,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 100,
    // elevation: 8,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 100,
  },
  textSection: {
    marginRight: 15,
    width: '60%',
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: RFPercentage(2.3),
    color: Colors.background,
    fontFamily: Fonts.semiBold,
  },
  subtitle: {
    fontSize: RFPercentage(1.8),
    color: Colors.buttonColor,
    lineHeight: 18,
    marginTop: 8,
    fontFamily: Fonts.fontRegular,
  },
  button: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 100,
    width: 130,
    justifyContent: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.7),
    marginRight: 6,
    fontFamily: Fonts.semiBold,
    lineHeight: RFPercentage(2),
  },
});

export default HomeCard;
