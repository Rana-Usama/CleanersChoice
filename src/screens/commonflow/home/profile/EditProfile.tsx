import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
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
import storage from '@react-native-firebase/storage';
import {Image as CompressorImage} from 'react-native-compressor';
import {showToast} from '../../../../utils/ToastMessage';

const EditProfile = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'EditProfile'>
    >();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [img, setImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading2, setLoading2] = useState(false);

  // Image Picker
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

  // Fetching User Data
  useEffect(() => {
    setLoading2(true);
    const fetchUserData = async () => {
      const user = auth().currentUser;
      if (user) {
        try {
          const userDoc = await firestore()
            .collection('Users')
            .doc(user.uid)
            .get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            setUserData(userData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      setLoading2(false);
    };
    fetchUserData();
  }, []);

  // Edit Profile
  const handleEditProfile = async () => {
    const user = auth().currentUser;
    if (!user) return;
    setLoading(true);
    try {
      let imageUrl = userData?.profile;
      if (img && img.path !== userData?.profile) {
        const compressedImage = await CompressorImage.compress(img?.path, {
          compressionMethod: 'manual',
          maxWidth: 1000,
          quality: 0.8,
        });
        const imageRef = storage().ref(`user_profiles/profile_${user.uid}.jpg`);
        await imageRef.putFile(compressedImage);
        imageUrl = await imageRef.getDownloadURL();
      }
      if (
        name !== userData?.name ||
        phone !== userData?.phone ||
        imageUrl !== userData?.profile
      ) {
        await firestore()
          .collection('Users')
          .doc(user.uid)
          .update({
            name: name || userData?.name,
            phone: phone || userData?.phone,
            profile: imageUrl,
          });
        setUserData(prev => ({
          ...prev,
          name: name || prev?.name,
          phone: phone || prev?.phone,
          profile: imageUrl,
        }));
        showToast({
          type: 'success',
          title: 'Update Profile',
          message: 'Profile has been updated successfully',
        });
      }
      setLoading(false);
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update profile. Please try again.',
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
              title="Edit Your Profile"
              textStyle={styles.headerText}
              left={true}
            />
            <View style={styles.container}>
              {/* Profile Image */}
              <View style={styles.imgContainer}>
                <View style={styles.pictureContainer}>
                  {loading2 ? (
                    <ActivityIndicator
                      size={'large'}
                      color={Colors.inputFieldColor}
                    />
                  ) : (
                    <Image
                      source={
                        img
                          ? {uri: img.path}
                          : userData?.profile
                          ? {uri: userData.profile}
                          : IMAGES.defaultPic
                      }
                      resizeMode="contain"
                      style={styles.imgStyle}
                    />
                  )}
                </View>
                <TouchableOpacity onPress={uploadImg}>
                  <Image
                    source={Icons.edit}
                    resizeMode="contain"
                    style={styles.uploadedImg}
                  />
                </TouchableOpacity>
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
                <GradientButton
                  title={'Edit'}
                  onPress={handleEditProfile}
                  loading={loading}
                  disabled={
                    loading &&
                    name === '' &&
                    phone === '' &&
                    (!img || img?.path === userData?.profile)
                  }
                />
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
    fontSize: RFPercentage(2),
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
    width: RFPercentage(15.8),
    height: RFPercentage(15.8),
    borderRadius: RFPercentage(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(64, 123, 255, 1)',
    backgroundColor: Colors.inputField,
  },
  imgStyle: {
    width: RFPercentage(15),
    height: RFPercentage(15),
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
    marginTop: RFPercentage(4),
    borderBottomColor: Colors.inputFieldColor,
    borderBottomWidth: 1,
    paddingBottom: 5,
    width: RFPercentage(30),
  },
  sectionTitleText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
  },
  inputFieldsWrapper: {
    marginTop: RFPercentage(1),
  },
  inputContainer: {
    marginTop: RFPercentage(2),
  },
  label: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
  },
  inputField: {
    width: '100%',
    marginVertical: RFPercentage(1),
  },
  editButtonWrapper: {
    marginTop: RFPercentage(4.5),
    alignSelf: 'center',
  },
});
