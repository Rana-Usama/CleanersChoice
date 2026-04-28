import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import React, {useState} from 'react';
import {Colors, Fonts} from '../../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import HeaderBack from '../../../../components/HeaderBack';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';

interface Data {
  id: number;
  q: string;
  e: string;
}

const data: Data[] = [
  {
    id: 1,
    q: 'Personal Data',
    e: `While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:
• Email address
• First name and last name
• Phone number
• Usage Data`,
  },
  {
    id: 2,
    q: `Use of Your Personal Data`,
    e: `The Company may use Personal Data for the following purposes:
• To provide and maintain our Service, including to monitor the usage of our Service
• To manage Your Account: to manage Your registration as a user of the Service
• To contact You: To contact You by email, telephone calls, SMS
• To provide You with news, special offers and general information about other goods, services
• To manage Your requests: To attend and manage Your requests to Us`,
  },
  {
    id: 3,
    q: 'Retention of Your Personal Data',
    e: 'The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations to resolve disputes, and enforce our legal agreements and policies.',
  },
  {
    id: 4,
    q: 'Security of Your Personal Data',
    e: `The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.`,
  },
  {
    id: 5,
    q: 'Account Deletion and Data Removal',
    e: `Users have the right to permanently delete their account and all associated data at any time directly from within the app by navigating to the Settings > Delete Account section.

Upon confirmation, all personal information, including profile details, messages, and service history, will be permanently deleted from our servers. This process is irreversible.

If you encounter any issue deleting your account, you can contact us at:
• Harrisonscleaningservice2033s@gmail.com
and request manual deletion of your data.`,
  },
  {
    id: 6,
    q: 'Changes to this Privacy Policy',
    e: `We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.
We will let You know via email and/or a prominent notice on Our Service, prior to the change becoming effective and update the "Last updated" date at the top of this Privacy Policy.`,
  },
  {
    id: 7,
    q: 'Contact Us',
    e: `If you have any questions about this Privacy Policy, You can contact us by email:
• Harrisonscleaningservice2033s@gmail.com`,
  },
];

const Privacy: React.FC = ({navigation}: any) => {
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  const toggleSection = (id: number) => {
    if (expandedSections.includes(id)) {
      setExpandedSections(
        expandedSections.filter(sectionId => sectionId !== id),
      );
    } else {
      setExpandedSections([...expandedSections, id]);
    }
  };

  const renderPrivacyItem = ({item}: {item: Data}) => {
    const isExpanded = expandedSections.includes(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => toggleSection(item.id)}
        style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <MaterialCommunityIcons
              name={
                item.id === 1
                  ? 'account'
                  : item.id === 2
                  ? 'database'
                  : item.id === 3
                  ? 'calendar-clock'
                  : item.id === 4
                  ? 'shield-lock'
                  : item.id === 5
                  ? 'account-remove'
                  : item.id === 6
                  ? 'update'
                  : 'email'
              }
              size={RFPercentage(2.2)}
              color={Colors.gradient1}
            />
          </View>
          <Text style={styles.sectionTitle} numberOfLines={2}>
            {item.q}
          </Text>
          <Feather
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={RFPercentage(2)}
            color={Colors.gradient1}
          />
        </View>

        {isExpanded && (
          <View style={styles.sectionContent}>
            <Text style={styles.sectionText}>{item.e}</Text>
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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {/* Introduction Card */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <MaterialCommunityIcons
              name="shield-lock"
              size={RFPercentage(3.5)}
              color={Colors.gradient1}
            />
          </View>
          <Text style={styles.introText}>
            This Privacy Policy describes Our policies and procedures on the
            collection, use and disclosure of Your information when You use the
            Service and tells You about Your privacy rights and how the law
            protects You. We use Your Personal data to provide and improve the
            Service. By using the Service, You agree to the collection and use
            of information in accordance with this Privacy Policy.
          </Text>
          <View style={styles.lastUpdated}>
            <Feather
              name="calendar"
              size={RFPercentage(1.5)}
              color={Colors.secondaryText}
            />
            <Text style={styles.lastUpdatedText}>
              Last updated: {moment().format('MMMM YYYY')}
            </Text>
          </View>
        </View>

        {/* Privacy Sections */}
        <View style={styles.sectionsContainer}>
          <FlatList
            scrollEnabled={false}
            data={data}
            keyExtractor={item => item.id.toString()}
            renderItem={renderPrivacyItem}
            contentContainerStyle={styles.listContent}
          />
        </View>

        {/* Contact Info */}
        <View style={styles.contactCard}>
          <MaterialCommunityIcons
            name="email-fast"
            size={RFPercentage(3)}
            color={Colors.gradient1}
            style={styles.contactIcon}
          />
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactText}>
            If you have questions about your data or privacy rights, contact our
            support team:
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
            style={styles.emailContainer}>
            <MaterialCommunityIcons
              name="email"
              size={RFPercentage(1.8)}
              color={Colors.gradient1}
            />
            <Text style={styles.emailText}>
              Harrisonscleaningservice2033s@gmail.com
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default Privacy;

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
    // borderBottomLeftRadius: 30,
    // borderBottomRightRadius: 30,
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
  introText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    // textAlign: 'center',
    lineHeight: RFPercentage(2.4),
    marginBottom: RFPercentage(1.5),
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.5),
    paddingTop: RFPercentage(1),
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrayBg,
    width: '100%',
    justifyContent: 'center',
  },
  lastUpdatedText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
  },
  sectionsContainer: {
    marginTop: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
  },
  listContent: {
    gap: RFPercentage(1),
  },
  sectionCard: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RFPercentage(2),
    gap: RFPercentage(1.5),
  },
  sectionIcon: {
    width: RFPercentage(3.5),
    height: RFPercentage(3.5),
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.blueTintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
    flex: 1,
    lineHeight: RFPercentage(2.2),
  },
  sectionContent: {
    paddingHorizontal: RFPercentage(2),
    paddingBottom: RFPercentage(2),
    paddingTop: RFPercentage(0.5),
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrayBg,
  },
  sectionText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    lineHeight: RFPercentage(2.2),
  },
  contactCard: {
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
    marginBottom: RFPercentage(2),
  },
  contactIcon: {
    marginBottom: RFPercentage(1.5),
  },
  contactTitle: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.9),
    marginBottom: RFPercentage(0.8),
  },
  contactText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    textAlign: 'center',
    lineHeight: RFPercentage(2.2),
    marginBottom: RFPercentage(1.5),
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    padding: RFPercentage(1.2),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    gap: RFPercentage(0.8),
  },
  emailText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
});
