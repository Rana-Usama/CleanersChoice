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
} from 'react-native';
import React from 'react';
import {Colors, Fonts} from '../../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
interface Data {
  id: number;
  q: string;
  e: string;
  icon: string;
}

const data: Data[] = [
  {
    id: 1,
    q: 'Introduction and Acceptance of Terms',
    e: 'Cleaners Choice a company registered in Ohio, United States, operates the Cleaner Choice mobile application and related services. By accessing or using the Services, you agree to be bound by these legal terms. If you do not agree with all the terms, you are prohibited from using the Services and must stop immediately.',
    icon: 'file-document-outline',
  },
  {
    id: 2,
    q: 'Overview of Services',
    e: 'Cleaners Choice offers a mobile application and related services designed to assist users in managing and accessing cleaning-related solutions. These services include all features, content, and functionality that refer or link to the Legal Terms.',
    icon: 'application-outline',
  },
  {
    id: 3,
    q: 'Communication and Modifications',
    e: 'You can contact Cleaners Choice at harrisonscleaningservice2033s@gmail.com or by mail in Ohio, United States. We reserve the right to make changes to these Legal Terms and will notify you of scheduled changes by email. Continued use of our Services after changes take effect implies your agreement to the new terms.',
    icon: 'email-fast-outline',
  },
  {
    id: 4,
    q: 'Need Assistance? Contact Us',
    e: `For any questions, concerns, or to resolve a complaint regarding the Services, you may reach out to us at:

Cleaners Choice
Ohio, United States
📧 harrisonscleaningservice2033s@gmail.com`,
    icon: 'help-circle-outline',
  },
];

const Terms: React.FC = ({navigation}: any) => {
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
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
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
              name="file-document"
              size={RFPercentage(3.5)}
              color={Colors.gradient1}
            />
          </View>
          <Text style={styles.introTitle}>Terms of Service</Text>
          <Text style={styles.introText}>
            These Terms and Conditions govern your use of the cleaning
            services offered by Cleaners Choice through our mobile application. By accessing or using
            our services, you agree to be bound by these Terms. If you do not
            agree with these Terms, you may not use our services.
          </Text>
          <View style={styles.legalInfo}>
            <Feather
              name="calendar"
              size={RFPercentage(1.5)}
              color={Colors.secondaryText}
            />
            <Text style={styles.legalInfoText}>
              Effective: {moment().format('MMMM YYYY')}
            </Text>
          </View>
        </View>

        {/* Terms Sections */}
        <View style={styles.sectionsContainer}>
          <FlatList
            scrollEnabled={false}
            data={data}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
              <View style={styles.termCard}>
                <View style={styles.termHeader}>
                  <View style={styles.termIcon}>
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={RFPercentage(2.2)}
                      color={Colors.gradient1}
                    />
                  </View>
                  <Text style={styles.termNumber}>0{item.id}</Text>
                  <Text style={styles.termTitle}>{item.q}</Text>
                </View>
                <View style={styles.termContent}>
                  <Text style={styles.termText}>{item.e}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        </View>

        {/* Acceptance Notice */}
        <View style={styles.acceptanceCard}>
          <View style={styles.warningIcon}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={RFPercentage(3)}
              color={Colors.amber500}
            />
          </View>
          <Text style={styles.acceptanceTitle}>Important Notice</Text>
          <Text style={styles.acceptanceText}>
            By continuing to use the Cleaners Choice application, you
            acknowledge that you have read, understood, and agree to be bound by
            these Terms & Conditions.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <MaterialCommunityIcons
            name="copyright"
            size={RFPercentage(1.8)}
            color={Colors.secondaryText}
          />
          <Text style={styles.footerText}>
            {moment().format('YYYY')} Cleaners Choice. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Terms;

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
    // textAlign: 'center',
    lineHeight: RFPercentage(2.4),
    marginBottom: RFPercentage(1.5),
  },
  legalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.5),
    paddingTop: RFPercentage(1),
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrayBg,
    width: '100%',
    justifyContent: 'center',
  },
  legalInfoText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
  },
  sectionsContainer: {
    marginTop: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
  },
  listContent: {
    gap: RFPercentage(1.5),
  },
  termCard: {
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
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RFPercentage(2),
    backgroundColor: Colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrayBg,
    gap: RFPercentage(1),
  },
  termIcon: {
    width: RFPercentage(3.5),
    height: RFPercentage(3.5),
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.blueTintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termNumber: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.9),
    minWidth: RFPercentage(2.5),
  },
  termTitle: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
    flex: 1,
    lineHeight: RFPercentage(2.2),
  },
  termContent: {
    padding: RFPercentage(2),
  },
  termText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    lineHeight: RFPercentage(2.2),
  },
  acceptanceCard: {
    backgroundColor: Colors.amberOverlay10,
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(2),
    borderRadius: 16,
    padding: RFPercentage(2.5),
    borderWidth: 1,
    borderColor: Colors.amberOverlay20,
    alignItems: 'center',
  },
  warningIcon: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(2.5),
    backgroundColor: Colors.amberOverlay20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFPercentage(1),
  },
  acceptanceTitle: {
    color: Colors.amberDarkText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.9),
    marginBottom: RFPercentage(0.8),
    textAlign: 'center',
  },
  acceptanceText: {
    color: Colors.amberDarkText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    textAlign: 'center',
    lineHeight: RFPercentage(2.2),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(3),
    marginBottom: RFPercentage(2),
    gap: RFPercentage(0.5),
  },
  footerText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
  },
});
