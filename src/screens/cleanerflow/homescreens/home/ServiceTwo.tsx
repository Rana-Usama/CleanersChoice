import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Icons, Fonts} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import InfoHeader from '../../../../components/InfoHeader';
import TimeLine from '../../../../components/TimeLine';
import GradientButton from '../../../../components/GradientButton';
import ImagePicker from 'react-native-image-crop-picker';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import {useSelector} from 'react-redux';
import {Image as CompressorImage} from 'react-native-compressor';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  ZoomIn,
  LightSpeedInRight,
} from 'react-native-reanimated';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as Progress from 'react-native-progress';

const {width} = Dimensions.get('window');

const MAX_IMAGES = 6; // Increased from 3 to 6 for better showcase

const ServiceTwo: React.FC = ({navigation}: any) => {
  const [selectedImages, setSelectedImages] = useState(
    Array(MAX_IMAGES).fill(null),
  );
  const [originalImages, setOriginalImages] = useState(
    Array(MAX_IMAGES).fill(null),
  );
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const profileCompletion = useSelector(
    (state: any) => state.profile.profileCompletion,
  );

  const uploadImageToStorage = async (imageUri: string, index: number) => {
    try {
      const compressedImage = await CompressorImage.compress(imageUri, {
        compressionMethod: 'manual',
        maxWidth: 1200,
        quality: 0.85,
      });

      const user = auth().currentUser;
      if (!user) return null;

      const reference = storage().ref(
        `serviceImages/${user.uid}/service_${Date.now()}_${index}.jpg`,
      );
      await reference.putFile(compressedImage);
      const downloadURL = await reference.getDownloadURL();
      return downloadURL;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const uploadImg = async (index: number) => {
    try {
      setUploadingIndex(index);
      const image = await ImagePicker.openPicker({
        width: 1200,
        height: 1200,
        cropping: true,
        croppingAspectRatio: [4, 3],
        mediaType: 'photo',
        forceJpg: true,
      });

      if (!image.path) return;

      const newImages = [...selectedImages];
      newImages[index] = {uri: image.path, local: true};
      setSelectedImages(newImages);

      // Auto-save single image
      const downloadURL = await uploadImageToStorage(image.path, index);
      if (downloadURL) {
        newImages[index] = {uri: downloadURL, local: false};
        setSelectedImages(newImages);
      }
    } catch (error: any) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        Toast.show({
          type: 'error',
          text1: 'Upload Failed',
          text2: 'Please try again',
        });
      }
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeImage = (index: number) => {
    Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const newImages = [...selectedImages];
          newImages[index] = null;
          setSelectedImages(newImages);
        },
      },
    ]);
  };

  const saveImagesToFirestore = async () => {
    const user = auth().currentUser;
    if (!user) return;

    const uploadedCount = selectedImages.filter(img => img !== null).length;
    if (uploadedCount === 0) {
      Toast.show({
        type: 'info',
        text1: 'Gallery Required',
        text2: 'Please upload at least one picture',
      });
      return;
    }

    if (uploadedCount < 2) {
      Alert.alert(
        'Add More Photos',
        'We recommend uploading at least 2-3 photos to showcase your work better. Continue anyway?',
        [
          {text: 'Add More', style: 'cancel'},
          {
            text: 'Continue',
            onPress: async () => await proceedWithSave(),
          },
        ],
      );
    } else {
      await proceedWithSave();
    }
  };

  const proceedWithSave = async () => {
    if (!haveImagesChanged()) {
      navigation.navigate('ServiceThree');
      return;
    }

    try {
      setLoading(true);
      const user = auth().currentUser;
      const serviceRef = firestore()
        .collection('CleanerServices')
        .doc(user?.uid);

      // Upload only new images
      const uploadedImages = await Promise.all(
        selectedImages.map(async (img, index) => {
          if (img?.local && img.uri) {
            return await uploadImageToStorage(img.uri, index);
          }
          return img?.uri || null;
        }),
      );

      const validImages = uploadedImages.filter(url => url !== null);

      await serviceRef.update({
        serviceImages: validImages,
        updatedAt: new Date(),
      });

      Toast.show({
        type: 'success',
        text1: 'Gallery Updated',
        text2: 'Your service photos have been saved',
      });

      navigation.navigate('ServiceThree');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceData();
  }, []);

  const fetchServiceData = async () => {
    const user = auth().currentUser;
    if (!user) return;

    setLoading2(true);
    try {
      const serviceRef = firestore()
        .collection('CleanerServices')
        .doc(user.uid);
      const doc = await serviceRef.get();

      if (doc.exists) {
        const data = doc.data();
        const images =
          data?.serviceImages?.map((url: any) => ({uri: url, local: false})) ||
          [];
        const filledImages = [...images, ...Array(MAX_IMAGES).fill(null)].slice(
          0,
          MAX_IMAGES,
        );
        setSelectedImages(filledImages);
        setOriginalImages(filledImages);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading2(false);
    }
  };

  const haveImagesChanged = () => {
    for (let i = 0; i < selectedImages.length; i++) {
      const selected = selectedImages[i]?.uri || null;
      const original = originalImages[i]?.uri || null;
      if (selected !== original) {
        return true;
      }
    }
    return false;
  };

  const getUploadedCount = () => {
    return selectedImages.filter(img => img !== null).length;
  };

  const renderImageItem = ({item, index}: any) => {
    const isUploading = uploadingIndex === index;
    const hasImage = selectedImages[index] !== null;

    return (
      <Animated.View
        entering={ZoomIn.delay(index * 100)}
        style={styles.imageCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => (hasImage ? null : uploadImg(index))}
          disabled={isUploading}
          style={styles.imageTouchable}>
          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color={Colors.gradient1} />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          ) : hasImage ? (
            <>
              <Image
                source={{uri: selectedImages[index]?.uri}}
                resizeMode="cover"
                style={styles.imagePreview}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.imageOverlay}>
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  style={styles.removeButton}>
                  <MaterialIcons
                    name="delete-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </LinearGradient>
              {selectedImages[index]?.local && (
                <View style={styles.uploadStatus}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyImage}>
              <View style={styles.addIconContainer}>
                <AntDesign name="plus" size={30} color={Colors.gradient1} />
              </View>
              <Text style={styles.addImageText}>
                {index === 0 ? 'Cover Photo' : `Photo ${index + 1}`}
              </Text>
              <Text style={styles.addImageSubtext}>Tap to add</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const uploadedCount = getUploadedCount();

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent={true}
      />

      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <HeaderBack
          title="Service Gallery"
          textStyle={styles.headerText}
          left={true}
          style={{backgroundColor: 'transparent'}}
          arrowColor={'white'}
        />

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Step 2 of 3</Text>
            <Text style={styles.progressPercent}>66%</Text>
          </View>
          <Progress.Bar
            progress={0.66}
            width={width - 80}
            height={6}
            color="#FFFFFF"
            unfilledColor="rgba(255,255,255,0.3)"
            borderWidth={0}
            borderRadius={10}
            style={styles.progressBar}
          />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Gallery Stats */}
        <Animated.View
          entering={FadeInUp.duration(600)}
          style={styles.statsCard}>
          <LinearGradient
            colors={['#F0F7FF', '#E6F0FF']}
            style={styles.statsGradient}>
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{uploadedCount}</Text>
                <Text style={styles.statLabel}>Photos Added</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {MAX_IMAGES - uploadedCount}
                </Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{MAX_IMAGES}</Text>
                <Text style={styles.statLabel}>Max Allowed</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Gallery Instructions */}
        <Animated.View entering={SlideInRight.delay(200)}>
          <View style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <MaterialIcons
                name="camera"
                size={RFPercentage(2)}
                color={Colors.primaryText}
              />
              <Text style={styles.instructionsTitle}>Photo Guidelines</Text>
            </View>
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.instructionText}>
                  Upload high-quality photos of your work
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.instructionText}>
                  Include before/after photos if possible
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.instructionText}>
                  First photo will be used as cover image
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.instructionText}>
                  Recommended size: 1200x900px or similar
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Gallery Grid */}
        <Animated.View
          entering={LightSpeedInRight.delay(300)}
          style={styles.galleryContainer}>
          <Text style={styles.galleryTitle}>Your Service Gallery</Text>
          <Text style={styles.gallerySubtitle}>
            Showcase your best work ({uploadedCount}/{MAX_IMAGES})
          </Text>

          {loading2 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.gradient1} />
              <Text style={styles.loadingText}>Loading gallery...</Text>
            </View>
          ) : (
            <FlatList
              data={Array.from({length: MAX_IMAGES}, (_, i) => ({id: i}))}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.columnWrapper}
              keyExtractor={item => item.id.toString()}
              renderItem={renderImageItem}
              contentContainerStyle={styles.galleryGrid}
            />
          )}
        </Animated.View>

        {/* Tips */}
        {uploadedCount < 3 && uploadedCount > 0 && (
          <Animated.View entering={FadeInUp.delay(400)}>
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <MaterialIcons name="lightbulb" size={20} color="#F59E0B" />
                <Text style={styles.tipsTitle}>Pro Tip</Text>
              </View>
              <Text style={styles.tipsText}>
                Add {3 - uploadedCount} more photo
                {3 - uploadedCount > 1 ? 's' : ''} to make your profile stand
                out. Customers love seeing detailed examples of work!
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Continue Button */}
        <Animated.View
          entering={FadeInUp.delay(500)}
          style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              uploadedCount === 0 && styles.buttonDisabled,
            ]}
            onPress={saveImagesToFirestore}
            disabled={loading || uploadedCount === 0}
            activeOpacity={0.8}>
            <LinearGradient
              colors={
                uploadedCount === 0
                  ? ['#E5E7EB', '#D1D5DB']
                  : [Colors.gradient1, Colors.gradient2]
              }
              style={styles.buttonGradient}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    {profileCompletion === '100'
                      ? 'Update Gallery'
                      : 'Continue to Packages'}
                  </Text>
                  <AntDesign
                    name="arrowright"
                    size={RFPercentage(2)}
                    color="#FFFFFF"
                    style={styles.buttonIcon}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.requirementsText}>
            {uploadedCount === 0
              ? 'At least 1 photo is required to continue'
              : uploadedCount === 1
              ? '✓ Ready to continue (add more photos for better results)'
              : `✓ ${uploadedCount} photos uploaded - Great!`}
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default ServiceTwo;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerText: {
    fontSize: RFPercentage(2.2),
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
  progressSection: {
    marginTop: 15,
    paddingHorizontal: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: '#FFFFFF',
    opacity: 0.9,
  },
  progressPercent: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    color: '#FFFFFF',
  },
  progressBar: {
    marginTop: 4,
    alignSelf: 'center',
  },
  scrollContent: {
    // flexGrow: 1,
    // paddingBottom: RFPercentage(10),
  },
  timeLineContainer: {
    marginTop: -20,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  timeLineCard: {
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 12,
    // elevation: 5,
  },
  statsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 4,
  },
  statsGradient: {
    padding: 20,
    borderRadius: 16,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.5),
    color: Colors.gradient1,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  instructionsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionsIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    tintColor: Colors.gradient1,
  },
  instructionsTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    color: '#1F2937',
    marginLeft: RFPercentage(1),
  },
  instructionsList: {
    marginLeft: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gradient1,
    marginTop: 8,
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: '#6B7280',
    lineHeight: 22,
  },
  galleryContainer: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  galleryTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2),
    color: '#1F2937',
    marginBottom: 6,
  },
  gallerySubtitle: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: '#6B7280',
    marginBottom: 20,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: '#6B7280',
  },
  galleryGrid: {
    paddingBottom: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  imageCard: {
    width: (width - 60) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // elevation: 4,
  },
  imageTouchable: {
    width: '100%',
    height: 180,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    overflow: 'hidden',
  },
  uploadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  uploadingText: {
    marginTop: 8,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: '#6B7280',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    padding: 10,
  },
  removeButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadStatus: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  addIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addImageText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: '#374151',
    marginBottom: 4,
  },
  addImageSubtext: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.3),
    color: '#9CA3AF',
  },
  tipsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
    color: '#92400E',
    marginLeft: 8,
  },
  tipsText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: '#92400E',
    lineHeight: 20,
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
  },
  continueButton: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: Colors.gradient1,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    // elevation: 8,
    width: '60%',
    alignSelf: 'center',
    height: RFPercentage(5.6),
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGradient: {
    borderRadius: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex:1
  },
  buttonText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: '#FFFFFF',
    marginRight: 10,
  },
  buttonIcon: {
    marginTop: 2,
  },
  requirementsText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
});
