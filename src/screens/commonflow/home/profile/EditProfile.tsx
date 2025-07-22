import {
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
import HeaderBack from '../../../../components/HeaderBack';
import GradientButton from '../../../../components/GradientButton';
import InputField from '../../../../components/InputField';
import ImagePicker from 'react-native-image-crop-picker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {Image as CompressorImage} from 'react-native-compressor';
import {showToast} from '../../../../utils/ToastMessage';

const EditProfile = ({navigation}: any) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [img, setImg] = useState<any | null>(null);
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
      .catch(error => {});
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
        } catch (error) {}
      }
      setLoading2(false);
    };
    fetchUserData();
  }, []);

  const handleEditProfile = async () => {
    const user = auth().currentUser;
    if (!user) return;
    setLoading(true);
    try {
      let imageUrl = userData?.profile;

      // Compress & upload image if changed
      if (img && img.path !== userData?.profile) {
        try {
          console.log('📷 img.path:', img?.path);
          console.log('🧾 userData.profile:', userData?.profile);
          console.log('🆔 user.uid:', user?.uid);

          const compressedImage = await CompressorImage.compress(img?.path, {
            compressionMethod: 'manual',
            maxWidth: 1000,
            quality: 0.8,
          });

          console.log('compressedImage:', compressedImage);

          const imageRef = storage().ref(
            `user_profiles/profile_${user.uid}.jpg`,
          );
          console.log('imageRef:', imageRef);

          await imageRef.putFile(compressedImage);
          console.log('✅ Upload successful');

          imageUrl = await imageRef.getDownloadURL();
          console.log('✅ imageUrl:', imageUrl);
        } catch (uploadError) {
          console.log('❌ Image upload failed:', uploadError);
          throw uploadError;
        }
      }

      // Check if any field has changed
      const isNameChanged = name !== userData?.name;
      const isPhoneChanged = phone !== userData?.phone;
      const isImageChanged = imageUrl !== userData?.profile;

      if (isNameChanged || isPhoneChanged || isImageChanged) {
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
          title: 'Profile updated',
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

  const formatPhoneNumber = (raw: string = ''): string => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('1')) digits = digits.slice(1);
    if (digits.startsWith('0')) digits = digits.slice(1);
    digits = digits.slice(-10);
    if (digits.length < 10) return `+1-${digits}`;

    const area = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const line = digits.slice(6, 10);

    return `+1-${area}-${prefix}-${line}`; // -> "+1-440-147-6925"
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
              <TouchableOpacity onPress={uploadImg} style={styles.imgContainer}>
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
              </TouchableOpacity>

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
                    onChangeText={text => {
                      const formatted = formatPhoneNumber(text);
                      setPhone(formatted);
                    }}
                    type={'phone-pad'}
                    length={15}
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
                  disabled={loading}
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
    fontSize: RFPercentage(2),
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
    fontSize: RFPercentage(1.8),
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
