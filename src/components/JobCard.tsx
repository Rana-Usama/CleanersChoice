import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons} from '../constants/Themes';
import EvilIcons from 'react-native-vector-icons/EvilIcons';

const JobCard = props => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
      onPress={props.onPress2}
        style={{position: 'absolute', right: -5, top: RFPercentage(-1.3)}}>
        <Image
          source={Icons.delete}
          resizeMode="contain"
          style={{
            width: RFPercentage(2.3),
            height: RFPercentage(2.3),
          }}
        />
      </TouchableOpacity>

      <View style={styles.innerView}>
        <Text
          style={{
            color: 'rgba(55, 65, 81, 1)',
            fontFamily: Fonts.fontMedium,
            fontSize: RFPercentage(1.5),
          }}>
          {props.name}
        </Text>
        <Text
          style={{
            color: Colors.placeholderColor,
            fontFamily: Fonts.fontRegular,
            fontSize: RFPercentage(1.2),
          }}>
          Due Date & Time: {props.date}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: RFPercentage(1),
        }}>
        <EvilIcons
          name="location"
          size={RFPercentage(1.8)}
          style={{bottom: 1.5, right: 4}}
        />
        <Text
          style={{
            color: Colors.placeholderColor,
            fontFamily: Fonts.fontRegular,
            fontSize: RFPercentage(1.4),
            left: -2,
          }}>
          {props.location}
        </Text>
      </View>
      <View style={[styles.innerView, {marginTop: RFPercentage(1)}]}>
        <Text
          style={{
            color: Colors.placeholderColor,
            fontFamily: Fonts.fontRegular,
            fontSize: RFPercentage(1.4),
          }}>
          Price Range:
          <Text style={{color: Colors.gradient1, fontFamily: Fonts.fontMedium}}>
            {`\t`} {props.price}
          </Text>
        </Text>
        <TouchableOpacity onPress={props.onPress}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Text
              style={{
                color: 'rgba(55, 65, 81, 1)',
                fontFamily: Fonts.fontRegular,
                fontSize: RFPercentage(1.4),
                right: 5,
              }}>
              Details
            </Text>
            <TouchableOpacity onPress={props.onPress}>
              <Image
                source={Icons.arrowRight}
                resizeMode="contain"
                style={{
                  width: RFPercentage(1.8),
                  height: RFPercentage(1.8),
                  bottom: 1,
                }}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default JobCard;

const styles = StyleSheet.create({
  container: {
    width: '98%',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 1)',
    borderRadius: RFPercentage(1),
    padding: RFPercentage(1.3),
    marginTop: RFPercentage(2.5),
  },
  innerView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // width: '100%',
  },
});
