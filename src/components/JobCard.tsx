import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons} from '../constants/Themes';

interface props {
  delete?: boolean;
  onPress2?: () => void;
  name: string;
  date: string;
  location: string;
  price: string;
  onPress: () => void;
}

const JobCard = (props: props) => {
  return (
    <View style={styles.shadowContainer}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.container}
        onPress={props.onPress}>
        {/* Header with delete button */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.nameText} numberOfLines={2}>
              {props.name}
            </Text>
            {props.delete && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={props.onPress2}
                style={styles.deleteButton}>
                <Image
                  source={Icons.delete}
                  resizeMode="contain"
                  style={styles.deleteIcon}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Date and Location */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Image
              source={Icons.calendar}
              resizeMode="contain"
              style={styles.detailIcon}
            />
            <Text style={styles.detailText}>{props.date}</Text>
          </View>

          <View style={styles.detailRow}>
             <Image
              source={Icons.location}
              resizeMode="contain"
              style={styles.detailIcon}
            />
            <Text style={styles.detailText} numberOfLines={1}>
              {props.location || 'Not Added'}
            </Text>
          </View>
        </View>

        {/* Footer with Price and CTA */}
        <View style={styles.footer}>
          <View style={styles.priceSection}>
            <Text style={styles.budgetText}>Budget</Text>
            <Text style={styles.priceText}>{props.price}$</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={props.onPress}
            style={styles.ctaButton}>
            <Text style={styles.ctaText}>View Details</Text>
            <Image
              source={Icons.arrowRight}
              resizeMode="contain"
              style={styles.arrowIcon}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default JobCard;

const styles = StyleSheet.create({
  shadowContainer: {
    width: '100%',
    alignSelf: 'center',
    shadowColor: Colors.shadowBlueGrayLight,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
    marginTop: RFPercentage(2),
    borderRadius: RFPercentage(2),
    backgroundColor: 'transparent',
  },
  container: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.blueBorderOverlay50,
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2),
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  header: {
    marginBottom: RFPercentage(1.5),
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameText: {
    color: Colors.slateText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.9),
    flex: 1,
    lineHeight: RFPercentage(2.4),
  },
  deleteButton: {
    padding: RFPercentage(0.5),
    backgroundColor: Colors.primaryBlueOverlay10,
    borderRadius: RFPercentage(1),
    marginLeft: RFPercentage(1),
  },
  deleteIcon: {
    width: RFPercentage(2),
    height: RFPercentage(2),
  },
  detailsSection: {
    backgroundColor: Colors.gray50Overlay90,
    borderRadius: RFPercentage(1),
    padding: RFPercentage(1.5),
    marginBottom: RFPercentage(1.5),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(0.8),
  },
  detailIcon: {
    width: RFPercentage(2),
    height: RFPercentage(2),
    marginRight: RFPercentage(1),
    tintColor: Colors.placeholderColor,
  },
  detailText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorderOverlay50,
    paddingTop: RFPercentage(1.5),
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  budgetText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    marginRight: RFPercentage(0.5),
  },
  priceText: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.8),
    top:1
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightBlueOverlay10,
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(1),
  },
  ctaText: {
    color: Colors.gradient1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.5),
    marginRight: RFPercentage(0.5),
  },
  arrowIcon: {
    width: RFPercentage(1.6),
    height: RFPercentage(1.6),
    tintColor: Colors.gradient1,
  },
});
