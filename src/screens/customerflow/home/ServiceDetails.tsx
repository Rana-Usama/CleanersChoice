import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
} from 'react-native';
import React, {useState, useRef} from 'react';
import {Colors, Fonts, Icons, IMAGES} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import HeaderBack from '../../../components/HeaderBack';
import LinearGradient from 'react-native-linear-gradient';
import Package from '../../../components/Package';
import Review from '../../../components/Review';
import GradientButton from '../../../components/GradientButton';
import GestureRecognizer from 'react-native-swipe-gestures';
import {useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../../../routers/StackNavigator';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
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

const ServiceDetails: React.FC = ({route}) => {
  const {item} = route.params;
  const [step, setStep] = useState(0);
  const [visibleItems, setVisibleItems] = useState(5);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'ServiceDetails'>>();
  const onSwipeLeft = () => {
    if (step < item.cover.length - 1) {
      setStep(step + 1);
    }
  };

  const onSwipeRight = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleShowMore = () => {
    setVisibleItems(prev => Math.min(prev + 5, services.length));
  };

  const handleShowLess = () => {
    setVisibleItems(5);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{paddingBottom: RFPercentage(10)}}>
        <HeaderBack
          title={'Service Details'}
          textStyle={{fontSize: RFPercentage(1.8)}}
        />
        <View style={styles.container}>
          <View>
            <GestureRecognizer
              onSwipeLeft={onSwipeLeft}
              onSwipeRight={onSwipeRight}
              style={{}}>
              <View>
                <Image
                  source={
                    typeof item.cover[step] === 'string'
                      ? {uri: item.cover[step]}
                      : item.cover[step]
                  }
                  resizeMode="cover"
                  style={styles.image}
                  borderRadius={RFPercentage(1)}
                />
              </View>

              <View style={styles.dotsContainer}>
                {item.cover.map((_, index) => (
                  <TouchableOpacity key={index} onPress={() => setStep(index)}>
                    {step === index ? (
                      <LinearGradient
                        colors={[Colors.gradient1, Colors.gradient2]}
                        style={styles.activeDot}
                      />
                    ) : (
                      <View style={styles.inactiveDot} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </GestureRecognizer>
          </View>
          <View style={{marginTop: RFPercentage(2)}}>
            <View style={styles.rowContainer}>
              <Image
                source={item.icon}
                resizeMode="contain"
                style={styles.icon}
              />
              <Text style={[styles.headeing2, {color: Colors.primaryText}]}>
                {item.name}
              </Text>
            </View>
            <View style={styles.starContainer}>
              {Array.from({length: item.rating}, (_, index) => (
                <Image
                  key={index}
                  source={item.star}
                  resizeMode="contain"
                  style={styles.star}
                />
              ))}
            </View>
            <View style={{position: 'absolute', right: 0, top: 6}}>
              <Text
                style={{
                  color: Colors.placeholderColor,
                  fontFamily: Fonts.fontRegular,
                  fontSize: RFPercentage(1.2),
                }}>
                Joined on : {item.joining}
              </Text>
            </View>
          </View>
          <View style={{marginTop: RFPercentage(2.1)}}>
            <View>
              <Text style={styles.headeing2}>Description:</Text>
              <Text
                style={{
                  color: 'rgba(75, 85, 99, 1)',
                  fontFamily: Fonts.fontRegular,
                  fontSize: RFPercentage(1.4),
                  textAlign: 'justify',
                  lineHeight: 18,
                  marginTop: RFPercentage(0.5),
                }}>
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
                onPress={() => navigation.navigate('Availability')}
                style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text
                  style={{
                    color: Colors.gradient1,
                    fontFamily: Fonts.fontMedium,
                    fontSize: RFPercentage(1.4),
                  }}>
                  Check Availability
                </Text>
                <Image
                  source={Icons.availability}
                  resizeMode="contain"
                  style={{
                    width: RFPercentage(1.5),
                    height: RFPercentage(1.4),
                    left: 3,
                  }}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={{marginTop: RFPercentage(2)}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Text style={styles.headeing2}>Services:</Text>
            </View>
            <View
              style={{right: RFPercentage(0.7), marginTop: RFPercentage(0.5)}}>
              <FlatList
                data={services.slice(0, visibleItems)}
                numColumns={2}
                keyExtractor={item => item.id.toString()}
                renderItem={({item, index}) => (
                  <View
                    style={{
                      height: RFPercentage(4),
                      borderWidth: 1,
                      borderColor: Colors.inputFieldColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: RFPercentage(0.8),
                      margin: RFPercentage(0.7),
                      paddingHorizontal: RFPercentage(2),
                      alignSelf: 'flex-start',
                    }}>
                    <Text
                      style={{
                        color: Colors.placeholderColor,
                        fontSize: RFPercentage(1.3),
                        fontFamily: Fonts.fontRegular,
                      }}>
                      {item.name}
                    </Text>
                  </View>
                )}
              />

              {/* Show More / Show Less button */}
              {services.length > 5 && (
                <TouchableOpacity
                  onPress={
                    visibleItems < services.length
                      ? handleShowMore
                      : handleShowLess
                  }>
                  <Text
                    style={{
                      color: Colors.gradient1,
                      fontSize: RFPercentage(1.3),
                      fontFamily: Fonts.fontMedium,
                      textAlign: 'center',
                      bottom: RFPercentage(1.5),
                      position: 'absolute',
                      left:
                        visibleItems < services.length
                          ? RFPercentage(18.6)
                          : RFPercentage(34.5),
                    }}>
                    {visibleItems < services.length ? `+5 More` : `See Less`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        <View>
          <Text
            style={[
              styles.headeing2,
              {width: '90%', alignSelf: 'center', marginTop: RFPercentage(2)},
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
            <Text style={[styles.headeing2, {marginTop: RFPercentage(0.9)}]}>
              Rating & Reviews:
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: RFPercentage(1.8),
            }}>
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
                style={{
                  width: RFPercentage(1.8),
                  height: RFPercentage(1.8),
                  right: 3,
                }}
              />
              <Text
                style={{
                  color: 'rgba(0, 0, 0, 1)',
                  fontFamily: Fonts.semiBold,
                  fontSize: RFPercentage(1.4),
                  top: 1,
                }}>
                5.0
              </Text>
            </View>
          </View>
          <View style={{marginTop: RFPercentage(2)}}>
            <Review />
          </View>
        </View>
        <View style={{alignSelf: 'center', marginTop: RFPercentage(7)}}>
          <GradientButton
            title="Get Custom Offer"
            textStyle={{fontSize: RFPercentage(1.4)}}
            onPress={()=>{}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ServiceDetails;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    width: '90%',
    alignSelf: 'center',
    paddingTop: RFPercentage(2.5),
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
    marginTop: RFPercentage(0.4),
    marginLeft: RFPercentage(4.5),
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
});
