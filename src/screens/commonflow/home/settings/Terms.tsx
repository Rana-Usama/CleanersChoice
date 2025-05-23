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
    q: '1. Service Description',
    e: 'Our service enables customers to order and receive fuel delivery directly to their specified location.',
  },
  {
    id: 2,
    q: '2. Eligibility',
    e: 'To use our services, you must be of legal age in your jurisdiction and capable of entering into a binding agreement. By using our services, you represent and warrant that you meet these eligibility requirements.',
  },
  {
    id: 3,
    q: '3. Ordering',
    e: 'Customers can place orders for fuel delivery through our App. By placing an order, you agree to provide accurate and complete information about your location, contact details, and payment information.',
  },
  {
    id: 4,
    q: '4. Delivery',
    e: 'We will make best efforts to deliver fuel orders within the requested time slot. However, delivery times may vary depending on factors such as weather conditions, traffic, and operational constraints. We do not guarantee specific delivery times and are not liable for any delays.',
  },
];


const Terms: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        <HeaderBack title={`T&C’s`} textStyle={styles.headerText} left={true} />
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
    fontSize: RFPercentage(2),
  },
  listItemText: {
    color: Colors.heading,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    marginTop: 5,
    textAlign: 'justify',
    lineHeight: RFPercentage(2.9),
  },
});