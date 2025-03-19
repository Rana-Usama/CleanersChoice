import { Image, SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { Colors, Fonts, IMAGES, Icons } from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import ProfileField from '../../../components/ProfileField';
import { useNavigation } from '@react-navigation/native';

const Profile = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack title="Profile" textStyle={styles.headerText} />
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image source={IMAGES.picture} resizeMode="contain" style={styles.profileImage} />
          {/* <TouchableOpacity>
            <Image source={Icons.edit} resizeMode="contain" style={styles.editIcon} />
          </TouchableOpacity> */}
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.nameText}>Emma Stone</Text>
        </View>
        <View style={styles.profileFieldContainer}>
          <ProfileField text='Edit Profile' icon={Icons.editProfile} onPress={() => navigation.navigate('EditProfile')} />
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
    fontSize: RFPercentage(1.8),
  },
  imageContainer: {
    alignSelf: 'center',
  },
  profileImage: {
    width: RFPercentage(13),
    height: RFPercentage(13),
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
  },
  profileFieldContainer: {
    marginTop: RFPercentage(4),
  },
});
