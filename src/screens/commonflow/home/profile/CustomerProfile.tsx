import {
  Image,
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES} from '../../../../constants/Themes';
import firestore from '@react-native-firebase/firestore';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const CustomerProfile = ({route, navigation}: any) => {
  const {customerId} = route.params;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomerData = useCallback(async () => {
    setLoading(true);
    try {
      const userDoc = await firestore().collection('Users').doc(customerId).get();
      if (userDoc.exists) {
        setProfile(userDoc.data());
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching customer profile:', error);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      fetchCustomerData();
    }, [fetchCustomerData]),
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent={true}
      />
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customer Profile</Text>
          <View style={{width: 40}} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gradient1} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileHeader}>
            <Image
              source={profile?.profile ? {uri: profile.profile} : IMAGES.defaultPic}
              resizeMode="cover"
              style={styles.avatar}
            />

            <Text style={styles.nameText} numberOfLines={1}>
              {profile?.name || 'Customer'}
            </Text>

            <View style={styles.roleBadge}>
              <Ionicons
                name="person"
                size={RFPercentage(1.8)}
                color={Colors.gradient1}
              />
              <Text style={styles.roleText}>Customer</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Contact Information</Text>

            <View style={styles.infoRow}>
              <View style={styles.contactIconBubble}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={RFPercentage(1.8)}
                  color={Colors.gradient1}
                />
              </View>
              <Text style={styles.infoText}>
                {profile?.email || 'Not provided'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.contactIconBubble}>
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={RFPercentage(1.8)}
                  color={Colors.gradient1}
                />
              </View>
              <Text style={styles.infoText}>
                {profile?.phone || 'Not provided'}
              </Text>
            </View>
          </View>

          <View style={{height: RFPercentage(3)}} />
        </ScrollView>
      )}
    </View>
  );
};

export default CustomerProfile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? RFPercentage(8) : RFPercentage(6),
    paddingHorizontal: RFPercentage(2),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: RFPercentage(2),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.whiteOverlay20,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(2),
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: RFPercentage(3),
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2),
    marginTop: RFPercentage(1),
    shadowColor: Colors.blackOverlay10,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.grayBorderOverlay80,
  },
  avatar: {
    width: RFPercentage(16),
    height: RFPercentage(16),
    borderRadius: RFPercentage(8),
    borderWidth: RFPercentage(0.1),
    borderColor: Colors.gradient1,
    marginBottom: RFPercentage(1.5),
  },
  nameText: {
    color: Colors.blueGray700,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.3),
    marginBottom: RFPercentage(1),
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightBlueOverlay90,
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.6),
    borderRadius: RFPercentage(2),
    gap: RFPercentage(0.5),
  },
  roleText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.gradient1,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2),
    marginTop: RFPercentage(1.5),
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
  },
  cardTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    color: Colors.primaryText,
    marginBottom: RFPercentage(1),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(1),
    marginBottom: RFPercentage(0.8),
  },
  contactIconBubble: {
    width: RFPercentage(2.8),
    height: RFPercentage(2.8),
    borderRadius: RFPercentage(1.9),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(84, 137, 255, 0.12)',
  },
  infoText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    color: Colors.secondaryText,
    flex: 1,
  },
});
