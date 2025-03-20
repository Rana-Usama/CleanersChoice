import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import GradientButton from '../../../components/GradientButton';
import NextButton from '../../../components/NextButton';
import {useNavigation} from '@react-navigation/native';

const JobDetails = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <HeaderBack title="Posted Job Details" textStyle={styles.headerText} />
        <View style={styles.container}>
          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <Image source={Icons.verify} resizeMode="contain" style={styles.icon} />
              <Text style={styles.label}>Job Title:</Text>
            </View>
            <Text style={styles.value}>Garden Cleaning</Text>
          </View>
          
          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <Image source={Icons.bars} resizeMode="contain" style={styles.icon} />
              <Text style={styles.label}>Description:</Text>
            </View>
            <Text style={styles.description}>
              My garden is a mess...I want some good cleaning company to pick
              this job and clean up my garden so I can do further gardening in
              it.
            </Text>
          </View>
          
          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <Image source={Icons.location} resizeMode="contain" style={styles.icon} />
              <Text style={styles.label}>Location:</Text>
            </View>
            <Text style={styles.value}>Blumenwag 5, 8008 Zürich, Ohio</Text>
          </View>
          
          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <Image source={Icons.verify} resizeMode="contain" style={styles.icon} />
              <Text style={styles.label}>Service Type:</Text>
            </View>
            <Text style={styles.value}>Residential</Text>
          </View>
          
          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <Image source={Icons.priceRange} resizeMode="contain" style={styles.icon} />
              <Text style={styles.label}>Price Range:</Text>
            </View>
            <Text style={styles.value}>50$-200$</Text>
          </View>
          
          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <Image source={Icons.calendar} resizeMode="contain" style={styles.icon} />
              <Text style={styles.label}>Due Date & Time:</Text>
            </View>
            <Text style={styles.value}>26 April, 2024 | 5PM</Text>
          </View>
        </View>
        
        <View style={styles.buttonWrapper}>
          <NextButton title="Edit Job Post" onPress={() => navigation.navigate('PostJob')} textStyle={styles.buttonText} />
          <View style={styles.buttonSpacing}>
            <GradientButton title="Mark as complete" textStyle={styles.buttonText} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default JobDetails;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollViewContent: {
    paddingBottom: RFPercentage(10),
  },
  container: {
    backgroundColor: Colors.background,
    width: '88%',
    alignSelf: 'center',
  },
  sectionContainer: {
    marginTop: RFPercentage(3),
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: RFPercentage(2.1),
    height: RFPercentage(2.1),
    bottom: 0.7,
  },
  label: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    left: 5,
  },
  value: {
    color: 'rgba(75, 85, 99, 1)',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    marginTop: 4,
  },
  description: {
    color: 'rgba(75, 85, 99, 1)',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    marginTop: 4,
    textAlign: 'justify',
    lineHeight: 18,
  },
  buttonWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: RFPercentage(8),
  },
  buttonSpacing: {
    marginLeft: RFPercentage(2),
  },
  buttonText: {
    fontSize: RFPercentage(1.4),
  },
  headerText: {
    fontSize: RFPercentage(1.8),
  },
});