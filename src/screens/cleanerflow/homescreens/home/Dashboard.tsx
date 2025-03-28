import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons, IMAGES} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import ImagePicker from 'react-native-image-crop-picker';
import GradientButton from '../../../../components/GradientButton';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const Dashboard: React.FC = () => {
  const navigation = useNavigation();
  const [img, setImg] = useState(null);
  const [profile, setProfile] = useState(null)

  const uploadImg = () => {
    ImagePicker.openPicker({
      width: 1000,
      height: 1000,
      cropping: true,
    })
      .then(image => {
        setImg(image);
      })
      .catch(error => {
        console.log('Image Picker Error:', error);
      });
  };

 

  const userData = async () => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      const userDoc = await firestore().collection('Users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setProfile(userData?.profile);
      } else {
        console.log('User data not found.');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };
  userData();


  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack logo={true} title="Dashboard" textStyle={styles.headerText} />
      <View style={styles.container}>
        <View style={styles.imgContainer}>
          <View>
            <View style={styles.pictureContainer}>
              <Image
                source={{uri:profile}}
                resizeMode="contain"
                style={styles.imgStyle}
              />
            </View>

            <TouchableOpacity onPress={uploadImg}>
              <Image
                source={Icons.edit}
                resizeMode="contain"
                style={styles.uploadedImg}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.nameText}>Alpha Cleaning</Text>
        </View>
        <View style={styles.profileCompletionContainer}>
          <Text style={styles.profileCompletionText}>
            Profile Completion 50%
          </Text>
        </View>
        <View style={styles.noServiceContainer}>
          <Image
            source={Icons.dashBoard}
            resizeMode="contain"
            style={styles.dashboardIcon}
          />
          <Text style={styles.noServiceText}>
            You haven’t listed any services
          </Text>
        </View>

        <View style={styles.completeProfileContainer}>
          <GradientButton
            title="Complete Profile Now"
            textStyle={styles.buttonText}
            style={styles.button}
            onPress={() => navigation.navigate('ServiceOne')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    width: '90%',
    alignSelf: 'center',
    flex:1
  },
  imgContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(4),
  },
  pictureContainer: {
    width: RFPercentage(13),
    height: RFPercentage(13),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 244, 246, 1)',
    borderWidth: 2,
    borderColor: 'rgba(64, 123, 255, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 40,
  },
  imgStyle: {
    width: RFPercentage(12),
    height: RFPercentage(12),
    borderRadius: RFPercentage(100),
  },
  uploadedImg: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    position: 'absolute',
    left: RFPercentage(9.5),
    bottom: RFPercentage(1),
  },
  nameContainer: {
    marginTop: RFPercentage(2),
  },
  nameText: {
    textAlign: 'center',
    fontFamily: Fonts.fontRegular,
    color: 'rgba(55, 65, 81, 1)',
    fontSize: RFPercentage(1.6),
  },
  profileCompletionContainer: {
    width: '95%',
    height: RFPercentage(3.8),
    borderWidth: 1.4,
    borderColor: Colors.gradient1,
    borderRadius: RFPercentage(0.8),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: RFPercentage(3.5),
  },
  profileCompletionText: {
    textAlign: 'center',
    fontFamily: Fonts.fontRegular,
    color: 'rgba(0, 0, 0, 1)',
    fontSize: RFPercentage(1.4),
    textAlignVertical: 'center',
  },
  noServiceContainer: {
    marginTop: RFPercentage(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardIcon: {
    width: RFPercentage(7),
    height: RFPercentage(7),
  },
  noServiceText: {
    textAlign: 'center',
    fontFamily: Fonts.fontRegular,
    color: 'rgba(55, 65, 81, 1)',
    fontSize: RFPercentage(1.4),
    marginTop: RFPercentage(1),
  },
  completeProfileContainer: {
    position: 'absolute',
    alignSelf: 'center',
    bottom:RFPercentage(15)

  },
  button: {
    width: RFPercentage(19),
  },
  buttonText: {
    fontSize: RFPercentage(1.4),
  },
  headerText: {
    fontSize: RFPercentage(1.8),
  },
});
