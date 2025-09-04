import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import React, {useState} from 'react';
import {Colors, Fonts} from '../../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Entypo from 'react-native-vector-icons/Entypo';
import HeaderBack from '../../../../components/HeaderBack';

interface Data {
  id: number;
  q: string;
  e: string;
}

const data: Data[] = [
  {
    id: 1,
    q: 'What is Cleaner Choice?',
    e: 'Cleaner Choice is a mobile app that connects customers seeking cleaning services with professional cleaners offering their services.',
  },
  {
    id: 2,
    q: 'Can users communicate within the app?',
    e: 'Yes! Cleaner Choice includes a built-in chat feature allowing customers and cleaners to communicate directly, discuss service details, and manage expectations before or after a booking',
  },
  {
    id: 3,
    q: 'Can I update my profile and service?',
    e: 'Absolutely. Both customers and cleaners can update their profile details, including photos, descriptions, locations, and services directly from their account settings.',
  },
  {
    id: 4,
    q: 'Can I post a job for a cleaner?',
    e: 'Yes, customers can post specific job requests with details like location, timing, and type of cleaning. Cleaners will see these jobs and can apply to fulfill them.',
  },
  {
    id: 5,
    q: 'Is there a fee for customers to use the app?',
    e: 'No, customers can use Cleaner Choice for free. You only pay for the cleaning services you book.',
  },
  {
    id: 6,
    q: 'How do I join as a cleaner?',
    e: 'To register as a cleaner, choose the "Cleaner" role during sign-up. You’ll be prompted to create a profile, post your services, and complete verification steps.',
  },
  {
    id: 7,
    q: 'Can I post my own cleaning services?',
    e: 'Yes. Cleaners can post detailed service listings, including pricing, available times, and specialties (e.g., deep cleaning, office cleaning, move-in/move-out services).',
  },
  {
    id: 8,
    q: 'How do I get paid for services?',
    e: 'Payments are arranged directly with the customer. In future updates, we may introduce secure in-app payment options to streamline the process.',
  },
];

const FAQS: React.FC = () => {
  const [explanation, setExplanation] = useState<number | null>(null);
  const [visible, setVisible] = useState<boolean>(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <HeaderBack title={`FAQ's`} textStyle={styles.headerText} left={true} />
        <View style={styles.container}>
          <FlatList
            data={data}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => {
              return (
                <>
                  <TouchableOpacity
                  activeOpacity={0.8}
                    style={styles.questionContainer}
                    onPress={() => {
                      setVisible(!visible);
                      setExplanation(item.id);
                    }}>
                    <Text style={styles.questionText}>{item.q}</Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setVisible(!visible);
                        setExplanation(item.id);
                      }}>
                      <Entypo
                        name={
                          visible && explanation === item.id
                            ? 'chevron-small-up'
                            : 'chevron-small-down'
                        }
                        color={Colors.secondaryText}
                        size={RFPercentage(3)}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                  {visible && explanation === item.id && (
                    <Text style={styles.answerText}>{item.e}</Text>
                  )}
                </>
              );
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FAQS;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.background,
  },
  scrollViewContent: {
    paddingBottom: RFPercentage(10),
  },
  headerText: {
    fontSize: RFPercentage(2),
  },
  container: {
    width: '90%',
    alignSelf: 'center',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: Colors.inputFieldColor,
    borderBottomWidth: 1,
    paddingBottom: RFPercentage(1),
    marginTop: RFPercentage(5),
  },
  questionText: {
    color: 'rgba(51, 65, 85, 1)',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
  },
  answerText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    marginTop: RFPercentage(1),
  },
});
