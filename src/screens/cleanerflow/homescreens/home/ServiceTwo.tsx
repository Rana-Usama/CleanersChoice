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
import ImagePicker from 'react-native-image-crop-picker';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import {useSelector} from 'react-redux';
import {Image as CompressorImage} from 'react-native-compressor';
import Toast from 'react-native-toast-message';
import axios from 'axios';

const images = [{id: 0}, {id: 1}, {id: 2}];

const ServiceTwo: React.FC = ({navigation}: any) => {
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

      // const data = new FormData();
      // data.append('file', {
      //   uri: compressedImage,
      //   type: 'image/jpeg',
      //   name: `profile_${user.uid}.jpg`,
      // });
      // data.append('upload_preset', 'CleanersChoice');
      // data.append('cloud_name', 'dfd65wawq');

      // const res = await axios.post(
      //   'https://api.cloudinary.com/v1_1/dfd65wawq/image/upload',
      //   data,
      //   {
      //     headers: {
      //       'Content-Type': 'multipart/form-data',
      //     },
      //   },
      // );
      // const downloadURL = res.data.secure_url;
      // return downloadURL;

      const reference = storage().ref(
        `serviceImages/${user.uid}/service_${index}.jpg`,
      );
      await reference.putFile(compressedImage);
      const downloadURL = await reference.getDownloadURL();
      console.log('downloadURL.....', downloadURL);

      return downloadURL;
    } catch (error) {
      console.log('error.....', error);
      return null;
    }
  };

  const uploadImg = async (index: any) => {
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
    } catch (error) {}
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
      <View style={[styles.container, {width: '90%', alignSelf: 'center'}]}>
        <View style={styles.infoHeaderContainer}>
          <InfoHeader />
        </View>
      </View>

      {/* Time Line */}
      <View style={styles.timelineContainer}>
        <TimeLine stepTwo={true} />
      </View>

      <View style={styles.container}>
        <View
          style={[
            styles.galleryTextContainer,
            {width: '90%', alignSelf: 'center'},
          ]}>
          <Text style={styles.galleryText}>
            Please Upload at least one picture to proceed
          </Text>
        </View>
        <View style={styles.flatListContainer}>
          <FlatList
            // numColumns={3}
            data={images}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: RFPercentage(1.6)}}
            keyExtractor={item => item.id.toString()}
            renderItem={({item, index}) => (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => uploadImg(index)}>
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
                {selectedImages[index] && (
                  <TouchableOpacity activeOpacity={0.8}>
                    <Image
                      source={Icons.edit}
                      resizeMode="contain"
                      style={styles.uploadedImg}
                    />
                  </TouchableOpacity>
                )}
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
    width: '100%',
    alignSelf: 'center',
  },
  headerText: {
    fontSize: RFPercentage(2),
  },
  infoHeaderContainer: {
    marginTop: RFPercentage(2.5),
  },
  uploadedImg: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    position: 'absolute',
    // left: RFPercentage(10.5),
    bottom: RFPercentage(1),
    right: RFPercentage(1),
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
