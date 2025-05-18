import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useEffect, useCallback} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES, Icons} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import ProfileField from '../../../../components/ProfileField';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useFocusEffect} from '@react-navigation/native';

const Profile = ({navigation}: any) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack title="Your Profile" textStyle={styles.headerText} />
      <View style={styles.container}>
        <View style={styles.imgContainer}>
          <View style={styles.pictureContainer}>
            {loading ? (
              <ActivityIndicator
                size={'large'}
                color={Colors.placeholderColor}
              />
            ) : (
              <Image
                source={profile ? {uri: profile} : IMAGES.defaultPic}
                resizeMode="contain"
                style={styles.imgStyle}
                borderRadius={RFPercentage(100)}
              />
            )}
          </View>
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.nameText}>{name}</Text>
        </View>
        <View style={styles.profileFieldContainer}>
          <ProfileField
            text="Edit Profile"
            icon={Icons.editProfile}
            onPress={() => navigation.navigate('EditProfile')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    width: '90%',
    alignSelf: 'center',
    paddingTop: RFPercentage(4),
  },
  headerText: {
    fontSize: RFPercentage(2.2),
  },
  imgContainer: {
    alignSelf: 'center',
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(1),
  },
  pictureContainer: {
    width: RFPercentage(15.8),
    height: RFPercentage(15.8),
    borderRadius: RFPercentage(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.8,
    borderColor: 'rgba(64, 123, 255, 1)',
    backgroundColor: Colors.inputField,
  },
  imgStyle: {
    width: RFPercentage(15),
    height: RFPercentage(15),
    borderRadius: RFPercentage(100),
  },
  editIcon: {
    width: RFPercentage(2.5),
    height: RFPercentage(2.5),
    position: 'absolute',
    right: RFPercentage(0.8),
    bottom: RFPercentage(1.4),
  },
  nameContainer: {
    marginTop: RFPercentage(2),
  },
  nameText: {
    textAlign: 'center',
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2),
  },
  profileFieldContainer: {
    marginTop: RFPercentage(4.5),
  },
});
