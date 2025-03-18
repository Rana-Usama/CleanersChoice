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
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import GradientButton from '../../../components/GradientButton';
import NextButton from '../../../components/NextButton';
import {useNavigation} from '@react-navigation/native';
const JobDetails = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={{paddingBottom: RFPercentage(10)}}
        showsVerticalScrollIndicator={false}>
        <HeaderBack
          title="Posted Job Details"
          textStyle={{fontSize: RFPercentage(1.8)}}
        />
        <View style={styles.container}>
          <View style={{marginTop: RFPercentage(4)}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                source={Icons.verify}
                resizeMode="contain"
                style={{
                  width: RFPercentage(2.1),
                  height: RFPercentage(2.1),
                  bottom: 0.7,
                }}
              />
              <Text
                style={{
                  color: Colors.placeholderColor,
                  fontFamily: Fonts.fontMedium,
                  fontSize: RFPercentage(1.5),
                  left: 5,
                }}>
                Job Title:
              </Text>
            </View>
            <Text
              style={{
                color: 'rgba(75, 85, 99, 1)',
                fontFamily: Fonts.fontRegular,
                fontSize: RFPercentage(1.4),
                marginTop: 4,
              }}>
              Garden Cleaning
            </Text>
          </View>
          <View style={{marginTop: RFPercentage(3)}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                source={Icons.bars}
                resizeMode="contain"
                style={{
                  width: RFPercentage(2.1),
                  height: RFPercentage(2.1),
                  bottom: 0.7,
                }}
              />
              <Text
                style={{
                  color: Colors.placeholderColor,
                  fontFamily: Fonts.fontMedium,
                  fontSize: RFPercentage(1.5),
                  left: 5,
                }}>
                Description:
              </Text>
            </View>
            <Text
              style={{
                color: 'rgba(75, 85, 99, 1)',
                fontFamily: Fonts.fontRegular,
                fontSize: RFPercentage(1.4),
                marginTop: 4,
                textAlign: 'justify',
                lineHeight: 18,
              }}>
              My garden is a mess...I want some good cleaning company to pick
              this job and clean up my garden so I can do further gardening in
              it.
            </Text>
          </View>

          <View style={{marginTop: RFPercentage(3)}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                source={Icons.location}
                resizeMode="contain"
                style={{
                  width: RFPercentage(2.1),
                  height: RFPercentage(2.1),
                  bottom: 0.7,
                }}
              />
              <Text
                style={{
                  color: Colors.placeholderColor,
                  fontFamily: Fonts.fontMedium,
                  fontSize: RFPercentage(1.5),
                  left: 5,
                }}>
                Location:
              </Text>
            </View>
            <Text
              style={{
                color: 'rgba(75, 85, 99, 1)',
                fontFamily: Fonts.fontRegular,
                fontSize: RFPercentage(1.4),
                marginTop: 4,
              }}>
              Blumenwag 5, 8008 Zürich, Ohio
            </Text>
          </View>

          <View style={{marginTop: RFPercentage(3)}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                source={Icons.verify}
                resizeMode="contain"
                style={{
                  width: RFPercentage(2.1),
                  height: RFPercentage(2.1),
                  bottom: 0.7,
                }}
              />
              <Text
                style={{
                  color: Colors.placeholderColor,
                  fontFamily: Fonts.fontMedium,
                  fontSize: RFPercentage(1.5),
                  left: 5,
                }}>
                Service Type:
              </Text>
            </View>
            <Text
              style={{
                color: 'rgba(75, 85, 99, 1)',
                fontFamily: Fonts.fontRegular,
                fontSize: RFPercentage(1.4),
                marginTop: 4,
              }}>
              Residential
            </Text>
          </View>
          <View style={{marginTop: RFPercentage(3)}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                source={Icons.priceRange}
                resizeMode="contain"
                style={{
                  width: RFPercentage(2.1),
                  height: RFPercentage(2.1),
                  bottom: 0.7,
                }}
              />
              <Text
                style={{
                  color: Colors.placeholderColor,
                  fontFamily: Fonts.fontMedium,
                  fontSize: RFPercentage(1.5),
                  left: 5,
                }}>
                Price Range:
              </Text>
            </View>
            <Text
              style={{
                color: 'rgba(75, 85, 99, 1)',
                fontFamily: Fonts.fontMedium,
                fontSize: RFPercentage(1.4),
                marginTop: 4,
              }}>
              50$-200$
            </Text>
          </View>

          <View style={{marginTop: RFPercentage(3)}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                source={Icons.calendar}
                resizeMode="contain"
                style={{
                  width: RFPercentage(2.1),
                  height: RFPercentage(2.1),
                  bottom: 0.7,
                }}
              />
              <Text
                style={{
                  color: Colors.placeholderColor,
                  fontFamily: Fonts.fontMedium,
                  fontSize: RFPercentage(1.5),
                  left: 5,
                }}>
                Due Date & Time:
              </Text>
            </View>
            <Text
              style={{
                color: 'rgba(75, 85, 99, 1)',
                fontFamily: Fonts.fontRegular,
                fontSize: RFPercentage(1.4),
                marginTop: 4,
              }}>
              26 April, 2024 | 5PM
            </Text>
          </View>
        </View>
        <View style={styles.buttonWrapper}>
          <NextButton
            title="Edit Job Post"
            onPress={() => navigation.navigate('PostJob')}
            textStyle={{fontSize: RFPercentage(1.4)}}
          />
          <View style={{marginLeft: RFPercentage(2)}}>
            <GradientButton
              title="Mark as complete"
              textStyle={{fontSize: RFPercentage(1.4)}}
            />
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
  container: {
    backgroundColor: Colors.background,
    width: '88%',
    alignSelf: 'center',
  },
  buttonWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: RFPercentage(14),
  },
});
