import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons} from '../constants/Themes';
import EvilIcons from 'react-native-vector-icons/EvilIcons';

interface props {
  delete? : boolean;
  onPress2 : ()=> void;
  name : string;
  date : string;
  location : string;
  price : string;
  onPress : ()=> void

}

const JobCard = (props:props) => {
  return (
    <TouchableOpacity style={styles.container} onPress={props.onPress}>
      {props.delete && (
        <TouchableOpacity onPress={props.onPress2} style={styles.deleteButton}>
          <Image source={Icons.delete} resizeMode="contain" style={styles.deleteIcon} />
        </TouchableOpacity>
      )}

      <View style={styles.innerView}>
        <Text style={styles.nameText}>{props.name}</Text>
        <Text style={styles.dateText}>Due Date & Time: {props.date}</Text>
      </View>
      
      <View style={styles.locationContainer}>
        <EvilIcons name="location" size={RFPercentage(2)} style={styles.locationIcon} />
        <Text style={styles.locationText}>{props.location}</Text>
      </View>
      
      <View style={[styles.innerView, styles.priceContainer]}>
        <Text style={styles.priceText}>
          Budget:
          <Text style={styles.priceHighlight}>{`	`} {props.price}$</Text>
        </Text>
        <TouchableOpacity onPress={props.onPress}>
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsText}>Details</Text>
            <TouchableOpacity onPress={props.onPress}>
              <Image source={Icons.arrowRight} resizeMode="contain" style={styles.arrowIcon} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default JobCard;

const styles = StyleSheet.create({
  container: {
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.5)',
    borderRadius: RFPercentage(1),
    padding: RFPercentage(1.3),
    marginTop: RFPercentage(2.5),
    alignSelf:'center'
  },
  deleteButton: {
    position: 'absolute',
    right: -5,
    top: RFPercentage(-1.3),
  },
  deleteIcon: {
    width: RFPercentage(2.4),
    height: RFPercentage(2.4),
  },
  innerView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    color: 'rgba(55, 65, 81, 1)',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
  },
  dateText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFPercentage(1),
  },
  locationIcon: {
    bottom: RFPercentage(0.1),
    right: RFPercentage(0.5),
  },
  locationText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    // left: -2,
  },
  priceContainer: {
    marginTop: RFPercentage(1),
  },
  priceText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
  },
  priceHighlight: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),

  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    color: 'rgba(55, 65, 81, 1)',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    right: 5,
  },
  arrowIcon: {
    width: RFPercentage(1.8),
    height: RFPercentage(1.8),
    bottom: 1,
  },
});
