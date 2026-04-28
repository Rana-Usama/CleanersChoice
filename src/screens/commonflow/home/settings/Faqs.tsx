import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StatusBar,
  Platform,
  Linking
} from 'react-native';
import React, {useState} from 'react';
import {Colors, Fonts} from '../../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Entypo from 'react-native-vector-icons/Entypo';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Data {
  id: number;
  q: string;
  e: string;
  icon: string;
}

const data: Data[] = [
  {
    id: 1,
    q: 'What is Cleaner Choice?',
    e: 'Cleaner Choice is a mobile app that connects customers seeking cleaning services with professional cleaners offering their services.',
    icon: 'information-outline',
  },
  {
    id: 2,
    q: 'Can users communicate within the app?',
    e: 'Yes! Cleaner Choice includes a built-in chat feature allowing customers and cleaners to communicate directly, discuss service details, and manage expectations before or after a booking.',
    icon: 'message-text-outline',
  },
  {
    id: 3,
    q: 'Can I update my profile and service?',
    e: 'Absolutely. Both customers and cleaners can update their profile details, including photos, descriptions, locations, and services directly from their account settings.',
    icon: 'account-edit-outline',
  },
  {
    id: 4,
    q: 'Can I post a job for a cleaner?',
    e: 'Yes, customers can post specific job requests with details like location, timing, and type of cleaning. Cleaners will see these jobs and can apply to fulfill them.',
    icon: 'briefcase-plus-outline',
  },
  {
    id: 5,
    q: 'Is there a fee for customers to use the app?',
    e: 'No, customers can use Cleaner Choice for free. You only pay for the cleaning services you book.',
    icon: 'cash-remove',
  },
  {
    id: 6,
    q: 'How do I join as a cleaner?',
    e: 'To register as a cleaner, choose the "Cleaner" role during sign-up. You\'ll be prompted to create a profile, post your services, and complete verification steps.',
    icon: 'account-plus-outline',
  },
  {
    id: 7,
    q: 'Can I post my own cleaning services?',
    e: 'Yes. Cleaners can post detailed service listings, including pricing, available times, and specialties (e.g., deep cleaning, office cleaning, move-in/move-out services).',
    icon: 'post-outline',
  },
  {
    id: 8,
    q: 'How do I get paid for services?',
    e: 'Payments are arranged directly with the customer. In future updates, we may introduce secure in-app payment options to streamline the process.',
    icon: 'cash-multiple',
  },
];

const FAQS: React.FC = ({navigation}: any) => {
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    if (expandedItems.includes(id)) {
      setExpandedItems(expandedItems.filter(itemId => itemId !== id));
    } else {
      setExpandedItems([...expandedItems, id]);
    }
  };

  const renderFAQItem = ({item}: {item: Data}) => {
    const isExpanded = expandedItems.includes(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}
        onPress={() => toggleItem(item.id)}>
        {/* Question Header */}
        <View style={styles.questionHeader}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={item.icon as any}
              size={RFPercentage(2.2)}
              color={Colors.gradient1}
            />
          </View>
          <Text style={styles.questionText} numberOfLines={2}>
            {item.q}
          </Text>
          <Entypo
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={RFPercentage(2.2)}
            color={Colors.gradient1}
          />
        </View>

        {/* Answer Content */}
        {isExpanded && (
          <View style={styles.answerContent}>
            <View style={styles.answerIndicator}>
              <MaterialCommunityIcons
                name="lightbulb-on-outline"
                size={RFPercentage(1.8)}
                color={Colors.gradient1}
              />
            </View>
            <Text style={styles.answerText}>{item.e}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent
      />

      {/* Header with Gradient */}
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Feather
              name="arrow-left"
              color={Colors.white}
              size={RFPercentage(2.4)}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Frequently Asked Questions</Text>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {/* Introduction Section */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <MaterialCommunityIcons
              name="help-circle"
              size={RFPercentage(3.5)}
              color={Colors.gradient1}
            />
          </View>
          <Text style={styles.introTitle}>How can we help you?</Text>
          <Text style={styles.introText}>
            Find answers to the most common questions about using Cleaner
            Choice. Can't find what you're looking for? Contact our support
            team.
          </Text>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <View style={styles.categoryBadge}>
            <MaterialCommunityIcons
              name="account-group"
              size={RFPercentage(1.6)}
              color={Colors.white}
            />
            <Text style={styles.categoryText}>For Everyone</Text>
          </View>
          <View style={styles.categoryBadge}>
            <MaterialCommunityIcons
              name="account"
              size={RFPercentage(1.6)}
              color={Colors.white}
            />
            <Text style={styles.categoryText}>For Customers</Text>
          </View>
          <View style={styles.categoryBadge}>
            <MaterialCommunityIcons
              name="account-hard-hat"
              size={RFPercentage(1.6)}
              color={Colors.white}
            />
            <Text style={styles.categoryText}>For Cleaners</Text>
          </View>
        </View>

        {/* FAQ List */}
        <View style={styles.faqsContainer}>
          <FlatList
            scrollEnabled={false}
            data={data}
            keyExtractor={item => item.id.toString()}
            renderItem={renderFAQItem}
            contentContainerStyle={styles.faqListContent}
          />
        </View>

        {/* Still Need Help Section */}
        <View style={styles.helpCard}>
          <MaterialCommunityIcons
            name="chat-question"
            size={RFPercentage(3)}
            color={Colors.gradient1}
            style={styles.helpIcon}
          />
          <Text style={styles.helpTitle}>Still need help?</Text>
          <Text style={styles.helpText}>
            Can't find the answer you're looking for? Our support team is here
            to help you.
          </Text>
          <TouchableOpacity
            onPress={async () => {
              const email = 'harrisonscleaningservice2033s@gmail.com';
              const subject = 'Support';
              const body = 'Hello..,';

              if (Platform.OS === 'android') {
                const url = `mailto:${email}?subject=${encodeURIComponent(
                  subject,
                )}&body=${encodeURIComponent(body)}`;

                try {
                  await Linking.openURL(url);
                } catch (err) {
                  console.log('Error opening Gmail:', err);
                }
              } else {
                const url = `mailto:${email}?subject=${encodeURIComponent(
                  subject,
                )}&body=${encodeURIComponent(body)}`;
                await Linking.openURL(url);
              }
            }}
            activeOpacity={0.8}
            style={styles.contactInfo}>
            <MaterialCommunityIcons
              name="email"
              size={RFPercentage(1.8)}
              color={Colors.gradient1}
            />
            <Text style={styles.contactText}>
              harrisonscleaningservice2033s@gmail.com
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default FAQS;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  placeholderView: {
    width: RFPercentage(4.5),
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? RFPercentage(7) : RFPercentage(7),
    paddingBottom: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.whiteOverlay20,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: RFPercentage(1),
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: RFPercentage(20),
  },
  introCard: {
    backgroundColor: Colors.white,
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(2),
    borderRadius: 16,
    padding: RFPercentage(2.5),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
    alignItems: 'center',
  },
  introIcon: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(3),
    backgroundColor: Colors.blueTintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFPercentage(1.5),
    borderWidth: 2,
    borderColor: Colors.blueTintBorder,
  },
  introTitle: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2.0),
    marginBottom: RFPercentage(1),
    textAlign: 'center',
  },
  introText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    textAlign: 'justify',
    lineHeight: RFPercentage(2.2),
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
    gap: RFPercentage(1),
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gradient1,
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.6),
    borderRadius: 20,
    gap: RFPercentage(0.5),
  },
  categoryText: {
    color: Colors.white,
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontMedium,
  },
  faqsContainer: {
    marginTop: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
  },
  faqListContent: {
    gap: RFPercentage(1.2),
  },
  faqCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // elevation: 2,
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
    overflow: 'hidden',
  },
  faqCardExpanded: {
    borderColor: Colors.lavenderSoft,
    shadowColor: Colors.gradient1,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RFPercentage(2),
    gap: RFPercentage(1.5),
  },
  iconContainer: {
    width: RFPercentage(3.5),
    height: RFPercentage(3.5),
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.blueTintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
    flex: 1,
    lineHeight: RFPercentage(2.2),
  },
  answerContent: {
    flexDirection: 'row',
    paddingHorizontal: RFPercentage(2),
    paddingBottom: RFPercentage(2),
    paddingTop: RFPercentage(0.5),
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrayBg,
    gap: RFPercentage(1.5),
  },
  answerIndicator: {
    width: RFPercentage(3),
    alignItems: 'center',
    paddingTop: RFPercentage(0.3),
  },
  answerText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    lineHeight: RFPercentage(2.2),
    flex: 1,
  },
  helpCard: {
    backgroundColor: Colors.skyBlueBg,
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(2),
    borderRadius: 16,
    padding: RFPercentage(2.5),
    borderWidth: 1,
    borderColor: Colors.skyBlue200,
    alignItems: 'center',
    marginBottom: RFPercentage(2),
  },
  helpIcon: {
    marginBottom: RFPercentage(1.5),
  },
  helpTitle: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.9),
    marginBottom: RFPercentage(0.8),
  },
  helpText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    textAlign: 'center',
    lineHeight: RFPercentage(2.2),
    marginBottom: RFPercentage(1.5),
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: RFPercentage(1.2),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    gap: RFPercentage(0.8),
  },
  contactText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
});
