import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES, Icons} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import ProfileField from '../../../../components/ProfileField';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useFocusEffect} from '@react-navigation/native';
import {useExitAppOnBack} from '../../../../utils/ExitApp';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const Profile = ({navigation}: any) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [role, setRole] = useState('');

  useExitAppOnBack();

  const onRefresh = () => {
    setRefreshing(true);
    setLoading(true);
    userData();
    setTimeout(() => {
      setRefreshing(false);
      setLoading(false);
    }, 1500);
  };

  // Fetching User Data
  const userData = useCallback(async () => {
    setLoading(true);
    const user = auth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const userDoc = await firestore().collection('Users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setProfile(userData?.profile);
        setName(userData?.name);
        setRole(userData?.role);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      userData();
    }, [userData]),
  );

  // Get role badge styling
  const getRoleStyle = () => {
    switch (role?.toLowerCase()) {
      case 'cleaner':
        return {
          backgroundColor: 'rgba(236, 245, 251, 0.9)',
          color: Colors.gradient1,
          icon: 'sparkles',
        };
      case 'customer':
        return {
          backgroundColor: 'rgba(236, 245, 251, 0.9)',
          color: Colors.gradient1,
          icon: 'person',
        };
      case 'admin':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: '#F59E0B',
          icon: 'shield-checkmark',
        };
      default:
        return {
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          color: '#6B7280',
          icon: 'person-circle',
        };
    }
  };

  const roleStyle = getRoleStyle();

  return (
    <View style={styles.safeArea}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="light-content" />

      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <HeaderBack
          title="Your Profile"
          textStyle={styles.headerText}
          left={true}
          arrowColor="#FFFFFF"
          style={{backgroundColor: 'transparent'}}
          logo
          tintColor={'white'}
        />
      </LinearGradient>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Profile Picture Section */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.gradient1} />
                </View>
              ) : (
                <View style={styles.imageWrapper}>
                  <Image
                    source={profile ? {uri: profile} : IMAGES.defaultPic}
                    resizeMode="cover"
                    style={styles.avatar}
                  />
                  {role === 'Cleaner' && (
                    <Image
                      source={Icons.owner}
                      resizeMode="contain"
                      style={{
                        position: 'absolute',
                        width: RFPercentage(4),
                        height: RFPercentage(4),
                        right: -3,
                        top: 0,
                      }}
                    />
                  )}
                </View>
              )}
            </View>

            {/* Name and Role Section */}
            <View style={styles.userInfo}>
              <Text style={styles.nameText} numberOfLines={1}>
                {name || 'User Name'}
              </Text>

              <View
                style={[
                  styles.roleBadge,
                  {backgroundColor: roleStyle.backgroundColor},
                ]}>
                <Ionicons
                  name={roleStyle.icon}
                  size={RFPercentage(1.8)}
                  color={roleStyle.color}
                  style={styles.roleIcon}
                />
                <Text style={[styles.roleText, {color: roleStyle.color}]}>
                  {role
                    ? `${role.charAt(0).toUpperCase() + role.slice(1)}`
                    : 'User'}
                </Text>
              </View>
            </View>
          </View>

          {/* Profile Actions */}
          <View style={{marginTop: RFPercentage(2)}}>
            <ProfileField
              text="Edit Profile"
              icon={Icons.editProfile}
              onPress={() => navigation.navigate('EditProfile')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(2),
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: RFPercentage(2),
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: RFPercentage(3),
    backgroundColor: 'white',
    borderRadius: RFPercentage(2),
    marginTop: RFPercentage(1),
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
  },
  avatarContainer: {
    marginBottom: RFPercentage(2),
  },
  loadingContainer: {
    width: RFPercentage(16),
    height: RFPercentage(16),
    borderRadius: RFPercentage(8),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inputField,
  },
  imageWrapper: {
    position: 'relative',
  },
  avatar: {
    width: RFPercentage(16),
    height: RFPercentage(16),
    borderRadius: RFPercentage(8),
    borderWidth: RFPercentage(0.1),
    borderColor: Colors.gradient1,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: RFPercentage(1),
    right: RFPercentage(1),
    width: RFPercentage(2),
    height: RFPercentage(2),
    borderRadius: RFPercentage(1),
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    alignItems: 'center',
  },
  nameText: {
    color: '#445368ff',
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.2),
    marginBottom: RFPercentage(1),
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.6),
    borderRadius: RFPercentage(2),
    marginTop: RFPercentage(0.5),
  },
  roleIcon: {
    marginRight: RFPercentage(0.5),
  },
  roleText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    textTransform: 'capitalize',
  },
  actionsContainer: {
    marginTop: RFPercentage(3),
    backgroundColor: 'white',
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2),
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.6)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: RFPercentage(3),
    paddingVertical: RFPercentage(2),
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    borderRadius: RFPercentage(1.5),
    marginHorizontal: RFPercentage(-1),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#1F2937',
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(2.2),
    marginBottom: RFPercentage(0.5),
  },
  statLabel: {
    color: '#6B7280',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(229, 231, 235, 0.8)',
  },
});
