import {Dimensions, SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Image, KeyboardAvoidingView, ScrollView, TouchableWithoutFeedback, Keyboard, Platform} from 'react-native';
import React, {useState, useEffect} from 'react';
import {Colors, Icons, Fonts, IMAGES} from '../../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../../routers/StackNavigator';
import HeaderBack from '../../../../components/HeaderBack';
import GradientButton from '../../../../components/GradientButton';
import InputField from '../../../../components/InputField';
import ImagePicker from 'react-native-image-crop-picker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Toast from 'react-native-toast-message';
import storage from '@react-native-firebase/storage';

const EditProfile = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'EditProfile'>
    >();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [img, setImg] = useState(null);
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState(null)

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



  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth().currentUser;
      if (user) {
        try {
          const userDoc = await firestore().collection('Users').doc(user.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            setUserData(userData)
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);


  const handleEditProfile = async () => {
    const user = auth().currentUser;
    if (!user) return;
    setLoading(true);
    
    try {
      let imageUrl = userData?.profile;
      if (img && img.path !== userData?.profile) {
        const imageRef = storage().ref(`user_profiles/${user.uid}.jpg`);
        await imageRef.putFile(img.path);
        imageUrl = await imageRef.getDownloadURL();
      }
  
      if (
        name !== userData?.name ||
        email !== userData?.email ||
        phone !== userData?.phone ||
        imageUrl !== userData?.profile
      ) {
        await firestore().collection('Users').doc(user.uid).update({
          name: name || userData?.name,
          email: email || userData?.email,
          phone: phone || userData?.phone,
          profile: imageUrl,
        });
  
        setUserData(prev => ({
          ...prev,
          name: name || prev?.name,
          email: email || prev?.email,
          phone: phone || prev?.phone,
          profile: imageUrl,
        }));
  
        Toast.show({
          type: 'success',
          text1: 'Update Profile',
          text2: 'Profile has been updated successfully',
          text1Style: { fontFamily: Fonts.fontBold },
          text2Style: { fontFamily: Fonts.fontRegular },
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'No Changes',
          text2: 'No updates were made to your profile',
          text1Style: { fontFamily: Fonts.fontBold },
          text2Style: { fontFamily: Fonts.fontRegular },
        });
      }
      setLoading(false);
      navigation.navigate('Home'); 
    } catch (error) {
      console.error('Error updating profile:', error);
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile. Please try again.',
        text1Style: { fontFamily: Fonts.fontBold },
        text2Style: { fontFamily: Fonts.fontRegular },
      });
    }
  };
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled">
            <HeaderBack
              title="Edit Profile"
              textStyle={styles.headerText}
            />
            <View style={styles.container}>
              {/* Profile Image */}
              <View style={styles.imgContainer}>
                <View style={styles.pictureContainer}>
                  <Image
                    source={ img ? {uri : img?.path} : IMAGES.picture}
                    resizeMode="contain"
                    style={styles.imgStyle}
                  />
                  <TouchableOpacity onPress={uploadImg}>
                    <Image
                      source={Icons.edit}
                      resizeMode="contain"
                      style={styles.uploadedImg}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Edit Info Title */}
              <View style={styles.sectionTitle}>
                <Text style={styles.sectionTitleText}>Edit Info</Text>
              </View>

              {/* Input Fields */}
              <View style={styles.inputFieldsWrapper}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Name</Text>
                  <InputField
                    placeholder={userData?.name}
                    value={name}
                    onChangeText={setName}
                    customStyle={styles.inputField}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <InputField
                    placeholder={userData?.email}
                    value={email}
                    onChangeText={setEmail}
                    customStyle={styles.inputField}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number</Text>
                  <InputField
                    placeholder={userData?.phone}
                    value={phone}
                    onChangeText={setPhone}
                    customStyle={styles.inputField}
                  />
                </View>
              </View>

              {/* Edit Button */}
              <View style={styles.editButtonWrapper}>
                <GradientButton title={'Edit'}  onPress={handleEditProfile} loading={loading} />
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flexContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerText: {
    fontSize: RFPercentage(1.8),
  },
  container: {
    width: '90%',
    paddingTop: RFPercentage(3),
    alignSelf: 'center',
  },
  profileImageWrapper: {
    alignSelf: 'center',
    marginTop: RFPercentage(2),
  },
  imgContainer: {
    alignSelf: 'center',
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(1),
  },
  pictureContainer: {
    width: RFPercentage(13.5),
    height: RFPercentage(13.5),
    borderRadius: RFPercentage(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 244, 246, 1)',
    borderWidth: 1.8,
    borderColor: 'rgba(64, 123, 255, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 40,
  },
  imgStyle: {
    width: RFPercentage(12.5),
    height: RFPercentage(12.5),
    borderRadius: RFPercentage(100),
  },
  uploadedImg: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    position: 'absolute',
    left: RFPercentage(3),
    bottom: RFPercentage(0.5),
  },
  sectionTitle: {
    marginTop: RFPercentage(2),
    borderBottomColor: Colors.inputFieldColor,
    borderBottomWidth: 1,
    paddingBottom: 5,
    width: RFPercentage(30),
  },
  sectionTitleText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
  },
  inputFieldsWrapper: {
    marginTop: RFPercentage(1),
  },
  inputContainer: {
    marginTop: RFPercentage(1.6),
  },
  label: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
  },
  inputField: {
    width: '100%',
    marginVertical : 7
  },
  editButtonWrapper: {
    marginTop: RFPercentage(4.5),
    alignSelf: 'center',
  },
});