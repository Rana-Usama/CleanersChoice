import {
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {Colors, Fonts, Icons, IMAGES} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import SearchField from '../../../components/SearchField';
import ServicesCard from '../../../components/ServicesCard';

const categories = [
  {
    id: 1,
    name: 'Residential',
    icon: Icons.category,
  },
  {
    id: 2,
    name: 'Pressure W..',
    icon: Icons.category,
  },
  {
    id: 3,
    name: 'Window Cl..',
    icon: Icons.category,
  },
  {
    id: 4,
    name: 'Carpet Cle..',
    icon: Icons.category,
  },
  {
    id: 5,
    name: 'Chimney C..',
    icon: Icons.category,
  },
  {
    id: 6,
    name: 'Chimney C..',
    icon: Icons.category,
  },
];

const filter = [
  {
    id: 1,
    name: 'Location',
  },
  {
    id: 2,
    name: 'Price Range',
  },
  {
    id: 3,
    name: 'Service Type',
  },
];

const services = [
  {
    id: 1,
    name: 'Alpha Cleaning',
    icon: IMAGES.alpha,
    cover: [IMAGES.cleaning1, IMAGES.cleaning2, IMAGES.cleaning3],
    price: '50$',
    location: 'Ohio',
    rating: 5,
    star: IMAGES.star,
  },
  {
    id: 2,
    name: 'Sophix Cleaning',
    icon: IMAGES.sophix,
    cover: [IMAGES.cleaning4, IMAGES.cleaning2, IMAGES.cleaning3],
    price: '100$',
    location: 'Ohio',
    rating: 5,
    star: IMAGES.star,
  },
  {
    id: 3,
    name: 'The Cleaners',
    icon: IMAGES.cleaners,
    cover: [IMAGES.cleaning2, IMAGES.cleaning1, IMAGES.cleaning3],
    price: '50$',
    location: 'Ohio',
    rating: 5,
    star: IMAGES.star,
  },
  {
    id: 4,
    name: 'Clean It',
    icon: IMAGES.clean,
    cover: [IMAGES.cleaning3, IMAGES.cleaning1, IMAGES.cleaning2],
    price: '150$',
    location: 'Ohio',
    rating: 5,
    star: IMAGES.star,
  },
  {
    id: 5,
    name: 'Adam Cleaners ',
    icon: IMAGES.adam,
    cover: [IMAGES.cleaning4, IMAGES.cleaning1, IMAGES.cleaning2],
    price: '120$',
    location: 'Ohio',
    rating: 5,
    star: IMAGES.star,
  },
  {
    id: 6,
    name: 'Adam Cleaners ',
    icon: IMAGES.adam,
    cover: [IMAGES.cleaning1, IMAGES.cleaning3, IMAGES.cleaning2],
    price: '120$',
    location: 'Ohio',
    rating: 5,
    star: IMAGES.star,
  },
];
const Home = () => {
  const [Filter, setFilter] = useState(null);
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{paddingBottom:RFPercentage(10)}} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View
            style={{
              width: '90%',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: 'row',
              alignSelf: 'center',
            }}>
            <View>
              <Image
                source={Icons.homeLogo}
                resizeMode="contain"
                style={{width: RFPercentage(7), height: RFPercentage(7)}}
              />
            </View>
            <View>
              <Text
                style={{
                  color: Colors.primaryText,
                  fontFamily: Fonts.semiBold,
                  fontSize: RFPercentage(2),
                }}>
                Home
              </Text>
            </View>
            <TouchableOpacity>
              <Text
                style={{
                  color: Colors.gradient1,
                  fontFamily: Fonts.fontRegular,
                  fontSize: RFPercentage(1.5),
                }}>
                Post Job
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              width: '90%',
              alignSelf: 'center',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <SearchField placeholder="Search" />
          </View>

          <View
            style={{
              width: '90%',
              alignSelf: 'center',
              marginTop: RFPercentage(1),
            }}>
            <Text
              style={{
                color: Colors.primaryText,
                fontFamily: Fonts.fontMedium,
                fontSize: RFPercentage(1.5),
              }}>
              Categories
            </Text>
          </View>
          <View style={{marginTop: RFPercentage(1.5)}}>
            <FlatList
              data={categories}
              keyExtractor={item => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({item}) => {
                return (
                  <View>
                    <TouchableOpacity>
                      <View
                        style={{
                          width: RFPercentage(9.5),
                          height: RFPercentage(9.5),
                          borderRadius: RFPercentage(1),
                          borderWidth: 1,
                          borderColor: Colors.inputFieldColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginHorizontal: RFPercentage(1),
                        }}>
                        <View style={{alignSelf: 'center'}}>
                          <Image
                            source={item.icon}
                            resizeMode="contain"
                            style={{
                              width: RFPercentage(4),
                              height: RFPercentage(4),
                              alignSelf: 'center',
                            }}
                          />
                          <Text
                            style={{
                              color: Colors.primaryText,
                              fontFamily: Fonts.fontRegular,
                              fontSize: RFPercentage(1.2),
                              top: RFPercentage(0.7),
                            }}>
                            {item.name}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              }}
              contentContainerStyle={{paddingHorizontal: RFPercentage(1.8)}}
            />
          </View>
          <View
            style={{
              width: '90%',
              alignSelf: 'center',
              marginTop: RFPercentage(2.5),
            }}>
            <Text
              style={{
                color: Colors.primaryText,
                fontFamily: Fonts.fontMedium,
                fontSize: RFPercentage(1.5),
              }}>
              Apply Filters
            </Text>
          </View>
          <View
            style={{
              width: '95%',
              alignSelf: 'center',
              marginTop: RFPercentage(1.5),
            }}>
            <FlatList
              horizontal
              data={filter}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => {
                return (
                  <View>
                    <TouchableOpacity onPress={() => setFilter(item.id)}>
                      <View
                        style={{
                          width: RFPercentage(11),
                          height: RFPercentage(4.3),
                          borderWidth: 1,
                          borderColor:
                            Filter === item.id
                              ? Colors.gradient2
                              : Colors.inputFieldColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: RFPercentage(0.8),
                          marginHorizontal: RFPercentage(1),
                        }}>
                        <Text
                          style={{
                            color: Colors.primaryText,
                            fontSize: RFPercentage(1.4),
                            fontFamily: Fonts.fontRegular,
                          }}>
                          {item.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </View>
          <View
            style={{
              width: '90%',
              alignSelf: 'center',
              marginTop: RFPercentage(2.5),
            }}>
            <Text
              style={{
                color: Colors.primaryText,
                fontFamily: Fonts.fontMedium,
                fontSize: RFPercentage(1.5),
              }}>
              Cleaning Services
            </Text>
          </View>
          <View style={{width: '95%', alignSelf: 'center', marginTop:RFPercentage(2)}}>
            <FlatList
              data={services}
              keyExtractor={item => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={{justifyContent: 'space-between'}}
              renderItem={({item}) => (
                <View style={{margin: RFPercentage(1), width: '46%'}}>
                  <ServicesCard
                    covers={item.cover}
                    name={item.name}
                    icon={item.icon}
                    price={item.price}
                    star={item.star}
                    rating={item.rating}
                    location={item.location}
                  />
                </View>
              )}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    backgroundColor: Colors.background,
    paddingTop: RFPercentage(4),
  },
});
