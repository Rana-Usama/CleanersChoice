import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Icons, Fonts} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import InfoHeader from '../../../../components/InfoHeader';
import TimeLine from '../../../../components/TimeLine';
import GradientButton from '../../../../components/GradientButton';
import {useNavigation} from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import {useSelector} from 'react-redux';
import {Image as CompressorImage} from 'react-native-compressor';
import Toast from 'react-native-toast-message';

const images = [{id: 0}, {id: 1}, {id: 2}];

const ServiceTwo: React.FC = ({navigation} : any) => {
  const [selectedImages, setSelectedImages] = useState([null, null, null]);
  const [originalImages, setOriginalImages] = useState([null, null, null]);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const profileCompletion = useSelector(
    state => state.profile.profileCompletion,
  );

  const uploadImageToStorage = async (imageUri, index) => {
    const compressedImage = await CompressorImage.compress(imageUri, {
      compressionMethod: 'manual',
      maxWidth: 1000,
      quality: 0.8,
    });
    try {
      const user = auth().currentUser;
      if (!user) return null;
      const fileName = `service_images/${user.uid}/image_${index}.jpg`;
      const reference = storage().ref(fileName);
      await reference.putFile(compressedImage);
      const downloadURL = await reference.getDownloadURL();
      return downloadURL;
    } catch (error) {
      return null;
    }
  };

  const uploadImg = async index => {
    try {
      const image = await ImagePicker.openPicker({
        width: 1000,
        height: 1000,
        cropping: true,
      });

      if (!image.path) return;

      const newImages = [...selectedImages];
      newImages[index] = {uri: image.path};
      setSelectedImages(newImages);
    } catch (error) {
    }
  };

  const saveImagesToFirestore = async () => {
    const user = auth().currentUser;
    if (!user) return;

    const hasAtLeastOneImage = selectedImages.some(
      img => img !== null && img.uri,
    );
    if (!hasAtLeastOneImage) {
      Toast.show({
        type: 'info',
        text1: 'Adding Service',
        text2: 'Please upload at least one picture to proceed',
      });
      return;
    }

    if (!haveImagesChanged()) {
      navigation.navigate('ServiceThree');
      return;
    }

    try {
      setLoading(true);
      const serviceRef = firestore()
        .collection('CleanerServices')
        .doc(user.uid);
      const uploadedImages = await Promise.all(
        selectedImages.map(async (img, index) => {
          if (img && img.uri && img.uri !== originalImages[index]?.uri) {
            return await uploadImageToStorage(img.uri, index);
          }
          return originalImages[index]?.uri || null;
        }),
      );
      const validImages = uploadedImages.filter(url => url !== null);

      await serviceRef.update({
        serviceImages: validImages,
      });

      navigation.navigate('ServiceThree');
    } catch (error) {
      console.error('Error updating service images:', error);
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
        const images = data?.serviceImages?.map(url => ({uri: url})) || [];
        const filledImages = [...images, null, null, null].slice(0, 3);
        setSelectedImages(filledImages);
        setOriginalImages(filledImages); //Track originals
      }
    } catch (error) {
      console.error('Error fetching service data:', error);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <HeaderBack title="Service" textStyle={styles.headerText} left={true} />
      <View style={styles.container}>
        <View style={styles.infoHeaderContainer}>
          <InfoHeader />
        </View>
      </View>

      {/* Time Line */}
      <View style={styles.timelineContainer}>
        <TimeLine stepTwo={true} />
      </View>

      <View style={styles.container}>
        <View style={styles.galleryTextContainer}>
          <Text style={styles.galleryText}>Gallery Pictures (1 Mandatory)</Text>
        </View>
        <View style={styles.flatListContainer}>
          <FlatList
            numColumns={3}
            data={images}
            keyExtractor={item => item.id.toString()}
            renderItem={({item, index}) => (
              <TouchableOpacity onPress={() => uploadImg(index)}>
                <View style={styles.imageContainer}>
                  {loading2 ? (
                    <>
                      <ActivityIndicator
                        size={'large'}
                        color={Colors.inputFieldColor}
                      />
                    </>
                  ) : (
                    <>
                      <Image
                        source={
                          selectedImages[index]
                            ? selectedImages[index]
                            : Icons.gallery
                        }
                        resizeMode="contain"
                        borderRadius={RFPercentage(1.5)}
                        style={[
                          styles.image,
                          {
                            width: selectedImages[index]
                              ? RFPercentage(14)
                              : RFPercentage(3),
                            height: selectedImages[index]
                              ? RFPercentage(14)
                              : RFPercentage(3),
                          },
                        ]}
                      />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Button Container */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title={profileCompletion === '100' ? 'Edit' : 'Next'}
            onPress={saveImagesToFirestore}
            loading={loading}
            disabled={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ServiceTwo;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    width: '90%',
    alignSelf: 'center',
  },
  headerText: {
    fontSize: RFPercentage(2),
  },
  infoHeaderContainer: {
    marginTop: RFPercentage(2.5),
  },
  timelineContainer: {
    marginTop: RFPercentage(2.8),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryTextContainer: {
    marginTop: RFPercentage(3.5),
  },
  galleryText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
  },
  flatListContainer: {
    marginTop: RFPercentage(2),
  },
  imageContainer: {
    width: RFPercentage(14),
    height: RFPercentage(14),
    backgroundColor: 'rgba(243, 244, 246, 1)',
    borderRadius: RFPercentage(1.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: RFPercentage(0.5),
  },
  image: {
    // width: RFPercentage(3),
    // height: RFPercentage(3),
    // borderRadius: RFPercentage(1.8),
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(5),
  },
});
