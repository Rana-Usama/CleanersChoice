import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
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

const images = [{id: 0}, {id: 1}, {id: 2}];

const ServiceTwo: React.FC = () => {
  const navigation = useNavigation();
  const [selectedImages, setSelectedImages] = useState([null, null, null]);
  const [loading, setLoading] = useState(false)

  console.log('selectedImages........', selectedImages)

  const uploadImageToStorage = async (imageUri, index) => {
    try {
      const user = auth().currentUser;
      if (!user) return null;

      const fileName = `service_images/${
        user.uid
      }/image_${index}.jpg`;
      const reference = storage().ref(fileName);
      await reference.putFile(imageUri);
      const downloadURL = await reference.getDownloadURL();
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
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
      console.log('Image Picker Error:', error);
    }
  };


  const saveImagesToFirestore = async () => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      setLoading(true);
      const serviceRef = firestore().collection('CleanerServices').doc(user.uid);
      const doc = await serviceRef.get();

      if (!doc.exists) {
        console.error('Service document does not exist!');
        return;
      }
      const uploadedImages = await Promise.all(
        selectedImages.map(async (img, index) => {
          if (img && img.uri) {
            return await uploadImageToStorage(img.uri, index);
          }
          return null;
        })
      );
      const validImages = uploadedImages.filter(url => url !== null);
      await serviceRef.update({
        serviceImages: firestore.FieldValue.arrayUnion(...validImages),
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
    try {
      const serviceRef = firestore().collection('CleanerServices').doc(user.uid);
      const doc = await serviceRef.get();
      if (doc.exists) {
        const data = doc.data();
        const images = data?.serviceImages?.map(url => ({ uri: url })) || [];
        const filledImages = [...images, null, null, null].slice(0, 3);
        setSelectedImages(filledImages);
      }
    } catch (error) {
      console.error('Error fetching service data:', error);
    }
  };
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack title="Service" textStyle={styles.headerText} />
      <View style={styles.container}>
        <View style={styles.infoHeaderContainer}>
          <InfoHeader />
        </View>
      </View>

      <View style={styles.timelineContainer}>
        <TimeLine stepTwo={true} />
      </View>

      <View style={styles.container}>
        <View style={styles.galleryTextContainer}>
          <Text style={styles.galleryText}>Gallery Pictures (Optional)</Text>
        </View>
        <View style={styles.flatListContainer}>
          <FlatList
            numColumns={3}
            data={images}
            keyExtractor={item => item.id.toString()}
            renderItem={({item, index}) => (
              <TouchableOpacity onPress={() => uploadImg(index)}>
                <View style={styles.imageContainer}>
                  <Image
                    source={
                      selectedImages[index]
                        ? selectedImages[index] 
                        : Icons.gallery
                    }
                    resizeMode="contain"
                    style={[
                      styles.image,
                      {
                        width: selectedImages[index]
                          ? RFPercentage(13)
                          : RFPercentage(3),
                        height: selectedImages[index]
                          ? RFPercentage(13)
                          : RFPercentage(3),
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
        <View style={styles.buttonContainer}>
          <GradientButton
            title="Next"
            onPress={saveImagesToFirestore}
            loading={loading}
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
    fontSize: RFPercentage(1.8),
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
    marginTop: RFPercentage(2.5),
  },
  galleryText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
  },
  flatListContainer: {
    marginTop: RFPercentage(2),
  },
  imageContainer: {
    width: RFPercentage(13),
    height: RFPercentage(13),
    backgroundColor: 'rgba(243, 244, 246, 1)',
    borderRadius: RFPercentage(1),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: RFPercentage(0.6),
  },
  image: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    borderRadius: RFPercentage(1),
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(5),
  },
});
