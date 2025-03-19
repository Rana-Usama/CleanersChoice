import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import React, {useState} from 'react';
import {Colors, Fonts, Icons, IMAGES} from '../../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import HeaderBack from '../../../../components/HeaderBack';
import Package from '../../../../components/Package';
import Review from '../../../../components/Review';
import GradientButton from '../../../../components/GradientButton';
import {useNavigation} from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';

const services = [
  {
    id: 1,
    name: 'Window Cleaning',
  },
  {
    id: 2,
    name: 'Residential Cleaning',
  },
  {
    id: 3,
    name: 'Pressure CLeaning',
  },
  {
    id: 4,
    name: 'Carpet Cleaning',
  },
  {
    id: 5,
    name: 'Chimney Cleaning',
  },
  {
    id: 6,
    name: 'Pressure CLeaning',
  },
  {
    id: 7,
    name: 'Carpet Cleaning',
  },
  {
    id: 8,
    name: 'Chimney Cleaning',
  },
];

const Packages = [
  {
    id: 1,
    name: 'Package 1',
    price: '50$',
    services: [
      {
        id: 1,
        name: 'Chimney Cleaning',
      },
      {
        id: 2,
        name: '1x Carpet Cleaning',
      },
      {
        id: 3,
        name: '100 Ft Garden Cleaning',
      },
    ],
  },
  {
    id: 2,
    name: 'Package 2',
    price: '100$',
    services: [
      {
        id: 1,
        name: 'Chimney Cleaning',
      },
      {
        id: 2,
        name: '1x Carpet Cleaning',
      },
      {
        id: 3,
        name: '100 Ft Garden Cleaning',
      },
    ],
  },
  {
    id: 3,
    name: 'Package 3',
    price: '150$',
    services: [
      {
        id: 1,
        name: 'Chimney Cleaning',
      },
      {
        id: 2,
        name: '1x Carpet Cleaning',
      },
      {
        id: 3,
        name: '100 Ft Garden Cleaning',
      },
    ],
  },
  {
    id: 4,
    name: 'Package 4',
    price: '80$',
    services: [
      {
        id: 1,
        name: 'Chimney Cleaning',
      },
      {
        id: 2,
        name: '1x Carpet Cleaning',
      },
      {
        id: 3,
        name: '100 Ft Garden Cleaning',
      },
    ],
  },
];

const HomeScreen: React.FC = () => {
  const [visibleItems, setVisibleItems] = useState(5);
  const navigation = useNavigation();

  const [img, setImg] = useState(null);

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

  const handleShowMore = () => {
    setVisibleItems(prev => prev + 5);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{paddingBottom: RFPercentage(10)}}>
        <HeaderBack
          logo={true}
          title="Dashboard"
          right={true}
          rightText="Edit Service"
          textStyle={{fontSize: RFPercentage(1.8)}}
          onPress={()=>navigation.navigate('ServiceOne')}
        />
        <View style={styles.container}>
          <View style={styles.imgContainer}>
            <View>
              <View style={styles.pictureContainer}>
                <Image
                  source={IMAGES.alpha}
                  resizeMode="cover"
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
          <View
            style={{
              marginTop: RFPercentage(0.8),
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View style={styles.starContainer}>
              {Array.from({length: 5}, (_, index) => (
                <Image
                  key={index}
                  source={IMAGES.star}
                  resizeMode="contain"
                  style={styles.star}
                />
              ))}
            </View>
          </View>
          <View style={{marginTop: RFPercentage(2.1)}}>
            <View>
              <Text style={styles.headeing2}>Description:</Text>
              <Text style={styles.description}>
                We provide best cleaning services in the area ranging from
                Chimney cleaning to copeporate level cleanings with quality like
                no one else provide. Reach out to us now to get your space
                cleaned up.
              </Text>
            </View>
          </View>
          <View style={{marginTop: RFPercentage(2)}}>
            <View>
              <TouchableOpacity
                activeOpacity={0.6}
                style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.availability}>Check Availability</Text>
                <Image
                  source={Icons.availability}
                  resizeMode="contain"
                  style={styles.availabilityIcon}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={{marginTop: RFPercentage(2)}}>
            <View style={styles.serviceContainer}>
              <Text style={styles.headeing2}>Services:</Text>
              <TouchableOpacity>
                <Text style={styles.allText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={{right: RFPercentage(0.7), marginTop:RFPercentage(0.5)}}>
              <FlatList
                data={services.slice(0, visibleItems)}
                numColumns={2}
                keyExtractor={item => item.id.toString()}
                renderItem={({item, index}) => (
                  <View style={styles.serviceBox}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                  </View>
                )}
              />
              {visibleItems < services.length ? (
                <TouchableOpacity onPress={handleShowMore}>
                  <Text style={styles.moreButton}>+5 More</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
        <View>
          <Text
            style={[
              styles.headeing2,
              {width: '90%', alignSelf: 'center', marginTop:RFPercentage(2)},
            ]}>
            Starting Packages:
          </Text>
          <View style={{marginTop: RFPercentage(1.5)}}>
            <FlatList
              horizontal
              data={Packages}
              keyExtractor={item => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{paddingHorizontal: RFPercentage(1.2)}}
              renderItem={({item}) => {
                return (
                  <Package
                    name={item.name}
                    price={item.price}
                    services={item.services}
                  />
                );
              }}
            />
          </View>
        </View>
        <View style={styles.container}>
          <View>
            <Text style={[styles.headeing2, {marginTop: RFPercentage(2.5)}]}>
              Rating & Reviews:
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <Text style={[styles.headeing2, {color: Colors.primaryText}]}>
              Overall Rating
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Image
                source={IMAGES.star}
                resizeMode="contain"
                style={styles.ratingStar}
              />
              <Text style={styles.ratingText}>5.0</Text>
            </View>
          </View>
          <View style={{marginTop: RFPercentage(2)}}>
            <Review />
          </View>
        </View>
        <View style={{alignSelf: 'center', marginTop: RFPercentage(7)}}>
          <GradientButton
            title="Get Custom Offer"
            textStyle={{fontSize: RFPercentage(1.3)}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    width: '90%',
    alignSelf: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(2),
  },
  activeDot: {
    width: RFPercentage(0.8),
    height: RFPercentage(0.8),
    borderRadius: 8,
    marginHorizontal: 3,
  },
  inactiveDot: {
    width: RFPercentage(0.8),
    height: RFPercentage(0.8),
    borderRadius: 8,
    marginHorizontal: 3,
    backgroundColor: 'rgba(209, 213, 219, 1)',
  },
  image: {
    width: '100%',
    height: RFPercentage(25),
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: RFPercentage(3.2),
    height: RFPercentage(3.2),
    borderRadius: RFPercentage(100),
    marginRight: RFPercentage(1),
  },
  starContainer: {
    flexDirection: 'row',
  },
  star: {
    width: RFPercentage(1.3),
    height: RFPercentage(1.3),
    marginRight: RFPercentage(0.2),
    bottom: RFPercentage(0.5),
  },
  headeing2: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
  },

  imgContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(4),
  },
  pictureContainer: {
    width: RFPercentage(12),
    height: RFPercentage(12),
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
    left: RFPercentage(9),
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
  description: {
    color: 'rgba(75, 85, 99, 1)',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    textAlign: 'justify',
    lineHeight: 18,
    marginTop: RFPercentage(0.5),
  },
  availability: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
  },
  availabilityIcon: {
    width: RFPercentage(1.5),
    height: RFPercentage(1.4),
    left: 3,
  },
  serviceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allText: {
    color: Colors.gradient1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
  },
  serviceBox: {
    height: RFPercentage(4),
    borderWidth: 1,
    borderColor: Colors.inputFieldColor,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RFPercentage(0.8),
    margin: RFPercentage(0.7),
    paddingHorizontal: RFPercentage(2),
    alignSelf: 'flex-start',
  },
  serviceName: {
    color: Colors.placeholderColor,
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
  },
  moreButton: {
    color: Colors.placeholderColor,
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontMedium,
    textAlign: 'center',
    position: 'absolute',
    bottom: RFPercentage(2.6),
    left:RFPercentage(22)
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: RFPercentage(1.8),
  },
  ratingStar: {
    width: RFPercentage(1.8),
    height: RFPercentage(1.8),
    right: 3,
  },
  ratingText: {
    color: 'rgba(0, 0, 0, 1)',
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.4),
    top: 1,
  },
});
