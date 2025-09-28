import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
} from 'react-native';
import React from 'react';
import {Colors, Fonts} from '../../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import HeaderBack from '../../../../components/HeaderBack';

interface Data {
  id: number;
  q: string;
  e: string;
}

const data: Data[] = [
  {
    id: 1,
    q: '1. Introduction and Acceptance of Terms',
    e: 'Cleaner Choice ("Company," "we," "us," "our"), a company registered in Ohio, United States, operates the Cleaner Choice mobile application and related services ("Services"). By accessing or using the Services, you agree to be bound by these legal terms ("Legal Terms"). If you do not agree with all the terms, you are prohibited from using the Services and must stop immediately.',
  },
  {
    id: 2,
    q: '2. Overview of Services',
    e: 'Cleaner Choice offers a mobile application and related services designed to assist users in managing and accessing cleaning-related solutions. These services include all features, content, and functionality that refer or link to the Legal Terms.',
  },
  {
    id: 3,
    q: '3. Communication and Modifications',
    e: 'You can contact Cleaner Choice at harrisonscleaningservice2033s@gmail.com or by mail in Ohio, United States. We reserve the right to make changes to these Legal Terms and will notify you of scheduled changes by email. Continued use of our Services after changes take effect implies your agreement to the new terms.',
  },
  {
    id: 4,
    q: '4. Need Assistance? Contact Us',
    e: `For any questions, concerns, or to resolve a complaint regarding the Services, you may reach out to us at:
Cleaner Choice
Ohio, United States
📧 harrisonscleaningservice2033s@gmail.com`,
  },
];

const Terms: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack title={`T&C’s`} textStyle={styles.headerText} left={true} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.termsTextContainer}>
            <Text style={styles.termsText}>
              These Terms and Conditions ("Terms") govern your use of the fuel
              delivery services offered by Fueled Up ("Company," "we," "us," or
              "our") through our mobile application ("App"). By accessing or
              using our services, you agree to be bound by these Terms. If you
              do not agree with these Terms, you may not use our services.
            </Text>
          </View>
          <View style={styles.listContainer}>
            <FlatList
              data={data}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => (
                <View style={styles.listItem}>
                  <Text style={styles.listItemTitle}>{item.q}</Text>
                  <Text style={styles.listItemText}>{item.e}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Terms;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    paddingBottom: RFPercentage(10),
  },
  container: {
    width: '90%',
    alignSelf: 'center',
  },
  headerText: {
    fontSize: RFPercentage(2.2),
  },
  termsTextContainer: {
    marginTop: RFPercentage(3),
  },
  termsText: {
    color: Colors.heading,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    textAlign: 'justify',
    lineHeight: RFPercentage(2.9),
  },
  listContainer: {
    marginTop: 10,
  },
  listItem: {
    marginTop: RFPercentage(2),
  },
  listItemTitle: {
    color: Colors.brown,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.9),
  },
  listItemText: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    marginTop: 5,
    textAlign: 'justify',
    lineHeight: RFPercentage(2.9),
  },
});
