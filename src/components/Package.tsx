import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import {useNavigation} from '@react-navigation/native';

interface Service {
  id: number;
  name: string;
}

interface props {
  name: string;
  services?: Service[];
  price: string;
  detail: string;
  onPress: () => void;
}

const Package = (props: props) => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={props.onPress}
      style={styles.container}>
      <Text style={styles.packageName}>{props.name}</Text>

      <View style={styles.dividerContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.serviceText}>{props.detail}</Text>
        </View>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>Starts at {props.price}$</Text>
      </View>
    </TouchableOpacity>
  );
};

export default Package;

const styles = StyleSheet.create({
  container: {
    width: RFPercentage(20),
    borderWidth: 1,
    borderColor: 'rgba(207, 213, 223, 1)',
    borderRadius: RFPercentage(1),
    marginHorizontal: RFPercentage(1),
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  packageName: {
    textAlign: 'center',
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    paddingVertical: RFPercentage(1),
  },
  dividerContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 163, 175, 1)',
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingVertical: RFPercentage(1),
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(0.6),
    margin: RFPercentage(0.9),
  },
  bulletPoint: {
    width: 3,
    height: 3,
    borderRadius: 20,
    backgroundColor: Colors.placeholderColor,
  },
  serviceText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    lineHeight: RFPercentage(2.4),
    paddingHorizontal: RFPercentage(1),
    marginTop: RFPercentage(0.5),
  },
  priceContainer: {
    paddingVertical: RFPercentage(0.9),
    alignSelf: 'stretch',
    alignItems: 'center',
    // backgroundColor:'red'
  },
  priceText: {
    textAlign: 'center',
    color: Colors.gradient1,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
  },
});
