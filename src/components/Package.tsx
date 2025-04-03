import {FlatList, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';

interface Service {
  id: number;
  name: string;
}

interface props {
  name: string;
  services?: Service[];
  price: string;
  detail: string;
}

const Package = (props: props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.packageName}>{props.name}</Text>

      <View style={styles.dividerContainer}>
        <View style={styles.contentContainer}>
          {/* <FlatList
            data={props.services}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
              <View style={styles.serviceItem}>
                <View style={styles.bulletPoint}></View>
                <Text style={styles.serviceText}>{item.name}</Text>
              </View>
            )}
            contentContainerStyle={{flexGrow: 1}} // Ensures list fills space
          />
           */}
          <Text style={styles.serviceText}>{props.detail}</Text>
        </View>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>Starts at {props.price}</Text>
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
    overflow: 'hidden',
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
    flex: 1,
  },
  contentContainer: {
    flex: 1,
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
    fontSize: RFPercentage(1.3),
    lineHeight: 18,
    paddingHorizontal: RFPercentage(1),
  },
  priceContainer: {
    paddingVertical: RFPercentage(0.5),
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  priceText: {
    textAlign: 'center',
    color: Colors.gradient1,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
  },
});
