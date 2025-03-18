import {Image, SafeAreaView, StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import React from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, IMAGES, Icons} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import ProfileField from '../../../components/ProfileField';
import { useNavigation } from '@react-navigation/native';

const Profile = () => {
  const navigation = useNavigation()

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack title="Profile" textStyle={{fontSize: RFPercentage(1.8)}} />
      <View style={styles.container}>
        <View style={{alignSelf: 'center'}}>
          <Image
            source={IMAGES.picture}
            resizeMode="contain"
            style={{width: RFPercentage(13), height: RFPercentage(13)}}
          />
          <TouchableOpacity>
            <Image
              source={Icons.edit}
              resizeMode="contain"
              style={{width:RFPercentage(2.5), height:RFPercentage(2.5),position: 'absolute',right:RFPercentage(0.8), bottom:RFPercentage(1.4),}}
            />
          </TouchableOpacity>
        </View>
        <View style={{marginTop:RFPercentage(2)}}>
          <Text style={{textAlign:'center', color:Colors.primaryText, fontFamily:Fonts.fontMedium}}>Emma Stone</Text>
        </View>
        <View style={{marginTop:RFPercentage(4)}}>
          <ProfileField text='Edit Profile' icon={Icons.editProfile}  onPress={()=> navigation.navigate('EditProfile')} />
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
});
