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
  StatusBar,
  Dimensions,
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
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const {width} = Dimensions.get('window');

const EditProfile = ({navigation}: any) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [img, setImg] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] =
    useState<FirebaseFirestoreTypes.DocumentData | null>(null);
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
            const userData = userDoc.data() ?? null;
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
          const compressedImage = await CompressorImage.compress(img?.path, {
            compressionMethod: 'manual',
            maxWidth: 1000,
            quality: 0.8,
          });

          const reference = storage().ref(
            `profileImages/profile_${user.uid}.jpg`,
          );
          await reference.putFile(compressedImage);
          imageUrl = await reference.getDownloadURL();
        } catch (err) {
          console.log('Compression or upload process failed:', err);
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
              color="#FFFFFF"
              size={RFPercentage(2.4)}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Profile Image Section */}
            <View style={styles.profileSection}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={uploadImg}
                style={styles.profileImageContainer}>
                {loading2 ? (
                  <View style={styles.profileImageLoader}>
                    <ActivityIndicator size="large" color={Colors.gradient1} />
                  </View>
                ) : (
                  <View style={styles.profileImageWrapper}>
                    <Image
                      source={
                        img
                          ? {uri: img.path}
                          : userData?.profile
                          ? {uri: userData.profile}
                          : IMAGES.defaultPic
                      }
                      resizeMode="cover"
                      style={styles.profileImage}
                    />
                    <View style={styles.profileImageOverlay}>
                      <MaterialCommunityIcons
                        name="camera"
                        size={RFPercentage(2.5)}
                        color="#FFFFFF"
                      />
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {userData?.name || 'Your Name'}
                </Text>
                <Text style={styles.profileRole}>
                  {userData?.role === 'Cleaner'
                    ? 'Professional Cleaner'
                    : 'Customer'}
                </Text>
              </View>
            </View>

            {/* Edit Form Card */}
            <View style={styles.formCard}>
              {/* Form Header */}
              <View style={styles.formHeader}>
                <MaterialCommunityIcons
                  name="account-edit"
                  size={RFPercentage(2.5)}
                  color={Colors.gradient1}
                />
                <Text style={styles.formTitle}>Edit Information</Text>
              </View>

              {/* Name Field */}
              <View style={styles.inputSection}>
                <View style={styles.inputLabelRow}>
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={RFPercentage(2)}
                    color={Colors.secondaryText}
                  />
                  <Text style={styles.inputLabel}>Full Name</Text>
                </View>
                <InputField
                  placeholder={userData?.name || 'Enter your full name'}
                  value={name}
                  onChangeText={setName}
                  customStyle={styles.inputField}
                />
                {userData?.name && name !== userData.name && (
                  <Text style={styles.currentValue}>
                    Current: {userData.name}
                  </Text>
                )}
              </View>

              {/* Phone Field */}
              <View style={styles.inputSection}>
                <View style={styles.inputLabelRow}>
                  <MaterialCommunityIcons
                    name="phone-outline"
                    size={RFPercentage(2)}
                    color={Colors.secondaryText}
                  />
                  <Text style={styles.inputLabel}>Phone Number</Text>
                </View>
                <InputField
                  placeholder={userData?.phone || 'Add your phone number'}
                  value={phone}
                  onChangeText={text => {
                    const formatted = formatPhoneNumber(text);
                    setPhone(formatted);
                  }}
                  type={'phone-pad'}
                  length={15}
                  customStyle={styles.inputField}
                />
                {userData?.phone && phone !== userData.phone && (
                  <Text style={styles.currentValue}>
                    Current: {userData.phone}
                  </Text>
                )}
              </View>

              {/* Email Field (Read-only) */}
              <View style={styles.inputSection}>
                <View style={styles.readOnlyField}>
                  <MaterialCommunityIcons
                    name="lock"
                    size={RFPercentage(2)}
                    color={Colors.secondaryText}
                    style={styles.lockIcon}
                  />
                  <Text style={styles.readOnlyText}>
                    {userData?.email || 'your@email.com'}
                  </Text>
                </View>
                <Text style={styles.fieldHint}>
                  Email cannot be changed for security reasons
                </Text>
              </View>

              {/* Update Button */}
              <View style={styles.buttonContainer}>
                <GradientButton
                  title="Update Profile"
                  onPress={handleEditProfile}
                  loading={loading}
                  disabled={loading}
                  style={styles.updateButton}
                  textStyle={styles.updateButtonText}
                />
              </View>
            </View>

            {/* Profile Tips */}
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Feather name="info" size={20} color="#F59E0B" />
                <Text style={styles.tipsTitle}>Profile Tips</Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color="#10B981"
                />
                <Text style={styles.tipText}>
                  Use a clear, professional profile photo
                </Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color="#10B981"
                />
                <Text style={styles.tipText}>
                  Keep your contact information up to date
                </Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color="#10B981"
                />
                <Text style={styles.tipText}>
                  Changes may take a few moments to appear
                </Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  placeholderView: {
    width: RFPercentage(4.5),
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? RFPercentage(7) : RFPercentage(5),
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
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: RFPercentage(20),
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: RFPercentage(3),
    paddingHorizontal: RFPercentage(2),
  },
  profileImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageLoader: {
    width: RFPercentage(16),
    height: RFPercentage(16),
    borderRadius: RFPercentage(8),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.gradient1,
  },
  profileImageWrapper: {
    width: RFPercentage(16),
    height: RFPercentage(16),
    borderRadius: RFPercentage(8),
    borderWidth: 4,
    borderColor: Colors.gradient1,
    overflow: 'hidden',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    paddingVertical: RFPercentage(0.5),
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: RFPercentage(2),
  },
  profileName: {
    color: Colors.primaryText,
    fontSize: RFPercentage(2.2),
    fontFamily: Fonts.semiBold,
    marginBottom: RFPercentage(0.5),
  },
  profileRole: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    marginBottom: RFPercentage(1.5),
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.8),
    borderRadius: 20,
    gap: RFPercentage(0.5),
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  changePhotoText: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(2),
    borderRadius: 16,
    padding: RFPercentage(2.5),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(2),
    gap: RFPercentage(1),
    paddingBottom: RFPercentage(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  formTitle: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.fontMedium,
  },
  inputSection: {
    marginBottom: RFPercentage(2),
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1),
    gap: RFPercentage(0.8),
  },
  inputLabel: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
  inputField: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currentValue: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    marginTop: RFPercentage(0.5),
    fontStyle: 'italic',
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: RFPercentage(1.5),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: RFPercentage(1),
  },
  lockIcon: {
    opacity: 0.7,
  },
  readOnlyText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    flex: 1,
  },
  fieldHint: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    marginTop: RFPercentage(0.5),
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: RFPercentage(2),
    gap: RFPercentage(1),
  },
  updateButton: {
    width: '60%',
    alignSelf: 'center',
  },
  updateButtonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
  cancelButton: {
    padding: RFPercentage(1.5),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
  },
  tipsCard: {
    backgroundColor: '#fef5d0ff',
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(2),
    borderRadius: 16,
    padding: RFPercentage(2),
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: RFPercentage(2),
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1),
    gap: RFPercentage(0.8),
  },
  tipsTitle: {
    color: '#92400E',
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(0.8),
    gap: RFPercentage(0.8),
  },
  tipText: {
    color: '#92400E',
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    flex: 1,
    lineHeight: RFPercentage(2),
  },
});
