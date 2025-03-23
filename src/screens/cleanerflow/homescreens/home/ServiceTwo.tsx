import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Icons, Fonts} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import InfoHeader from '../../../../components/InfoHeader';
import TimeLine from '../../../../components/TimeLine';
import GradientButton from '../../../../components/GradientButton';
import {useNavigation} from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';

const images = [{id: 0}, {id: 1}, {id: 2}];

const ServiceTwo: React.FC = () => {
  const navigation = useNavigation();
  const [selectedImages, setSelectedImages] = useState([null, null, null]);

  const uploadImg = index => {
    ImagePicker.openPicker({
      width: 1000,
      height: 1000,
      cropping: true,
    })
      .then(image => {
        const newImages = [...selectedImages];
        newImages[index] = {uri: image.path};
        setSelectedImages(newImages);
      })
      .catch(error => {
        console.log('Image Picker Error:', error);
      });
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
                    source={selectedImages[index] ? selectedImages[index] : Icons.gallery}
                    resizeMode="contain"
                    style={[styles.image, {width : selectedImages[index] ? RFPercentage(13) : RFPercentage(3), height :  selectedImages[index] ? RFPercentage(13) : RFPercentage(3) }]}
                  />
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
        <View style={styles.buttonContainer}>
          <GradientButton
            title="Next"
            onPress={() => navigation.navigate('ServiceThree')}
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
