import { FlatList, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { Colors, Fonts } from '../constants/Themes';

interface Service {
  id: number;
  name: string;
}

interface props {
  name : string,
  services : Service[];
  price : string;
}

const Package = (props:props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.packageName}>{props.name}</Text>
      <View style={styles.dividerContainer}>
        <View>
          <FlatList
            data={props.services}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              return (
                <View style={styles.serviceItem}>
                  <View style={styles.bulletPoint}></View>
                  <Text style={styles.serviceText}>{item.name}</Text>
                </View>
              );
            }}
          />
          <Text style={styles.priceText}>Starts at {props.price}</Text>
        </View>
      </View>
    </View>
  );
};

export default Package;

const styles = StyleSheet.create({
  container: {
    width: RFPercentage(18),
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 1)',
    borderRadius: RFPercentage(1),
    marginHorizontal: RFPercentage(1),
  },
  packageName: {
    textAlign: 'center',
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    paddingVertical: RFPercentage(0.8),
  },
  dividerContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 163, 175, 1)',
    paddingVertical: RFPercentage(1),
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(0.5),
    margin: RFPercentage(0.8),
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
    fontSize: RFPercentage(1.2),
    left: 5,
  },
  priceText: {
    textAlign: 'center',
    color: Colors.gradient1,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    marginTop: RFPercentage(0.6),
  },
});
