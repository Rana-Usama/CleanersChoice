import {
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import React, {useState, useRef} from 'react';
import {Colors, Fonts, Icons, IMAGES} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import SearchField from '../../../components/SearchField';
import ServicesCard from '../../../components/ServicesCard';
import {useNavigation} from '@react-navigation/native';
import HeaderBack from '../../../components/HeaderBack';
import {useSelector} from 'react-redux';
import {RootStackParamList} from '../../../routers/StackNavigator';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Popable} from 'react-native-popable';
import Slider from '@react-native-community/slider';

const categories = [
  {id: 1, name: 'All', icon: Icons.all},
  {id: 2, name: 'Residential', icon: Icons.residential},
  {id: 3, name: 'Car Clean..', icon: Icons.car},
  {id: 4, name: 'Pressure W..', icon: Icons.pressure},
  {id: 5, name: 'Chimney C..', icon: Icons.chimney},
  {id: 6, name: 'Carpet Cle..', icon: Icons.carpet},
  {id: 7, name: 'Window Cl..', icon: Icons.window},
];

const filter = [
  {id: 1, name: 'Location'},
  {id: 2, name: 'Price Range'},
  {id: 3, name: 'Service Type'},
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
    joining: '26 April, 2024',
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
    joining: '26 April, 2024',
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
    joining: '26 April, 2024',
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
    joining: '26 April, 2024',
  },
];

const Home = () => {
  const [Filter, setFilter] = useState(null);
  const [categorySelection, setCategorySelection] = useState(1);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([10, 2000]);
  const tempValue = useRef(priceRange[0]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <HeaderBack
            logo={true}
            title="Home"
            right={true}
            rightText="Post Job"
            textStyle={{fontSize: RFPercentage(1.8)}}
            onPress={() => navigation.navigate('PostJob')}
          />

          <View style={styles.searchContainer}>
            <SearchField
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Text style={[styles.sectionTitle, {bottom: RFPercentage(1)}]}>
            Categories
          </Text>
          <FlatList
            data={categories}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({item}) => (
              <TouchableOpacity onPress={() => setCategorySelection(item.id)}>
                <View
                  style={[
                    styles.categoryBox,
                    {
                      borderColor:
                        categorySelection === item.id
                          ? Colors.gradient2
                          : Colors.inputFieldColor,
                    },
                  ]}>
                  <Image
                    source={item.icon}
                    resizeMode="contain"
                    style={[
                      styles.categoryIcon,
                      {
                        width:
                          item.id === 1 ? RFPercentage(3.2) : RFPercentage(4),
                        height:
                          item.id === 1 ? RFPercentage(3.2) : RFPercentage(4),
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        fontFamily:
                          categorySelection === item.id
                            ? Fonts.semiBold
                            : Fonts.fontRegular,
                      },
                    ]}>
                    {item.name}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.flatListPadding}
          />

          <Text style={styles.sectionTitle}>Apply Filter</Text>
          <FlatList
            horizontal
            data={filter}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => {
              return item.id === 2 ? (
                <Popable
                  position="top"
                  style={{width: RFPercentage(24)}}
                  backgroundColor={'rgba(229, 231, 235, 0.3)'}
                  caretPosition="center"
                  content={
                    <View style={styles.popableContent}>
                      <View style={styles.popableInnerView}>
                        <Slider
                          style={styles.sliderStyle}
                          minimumValue={10}
                          maximumValue={2000}
                          step={100}
                          value={priceRange[0]}
                          onValueChange={value => {
                            tempValue.current = value;
                          }}
                          onSlidingComplete={value => {
                            setPriceRange([value, priceRange[1]]);
                          }}
                          minimumTrackTintColor={Colors.gradient1}
                          maximumTrackTintColor="gray"
                          thumbTintColor={Colors.gradient1}
                        />
                        <View style={styles.sliderLabelsContainer}>
                          <Text style={styles.sliderLabel}>0</Text>
                          <Text style={styles.sliderLabel}>1000</Text>
                          <Text style={styles.sliderLabel}>2000+</Text>
                        </View>
                      </View>
                    </View>
                  }>
                  <View>
                    <View
                      style={[
                        styles.filterBox,
                        {
                          borderColor:
                            Filter === item.id
                              ? Colors.gradient2
                              : Colors.inputFieldColor,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.filterText,
                          {
                            fontFamily:
                              Filter === item.id
                                ? Fonts.semiBold
                                : Fonts.fontRegular,
                          },
                        ]}>
                        {item.name}
                      </Text>
                    </View>
                  </View>
                </Popable>
              ) : (
                <View>
                  <TouchableOpacity
                    onPress={() => setFilter(item?.id)}
                    style={[
                      styles.filterBox,
                      {
                        borderColor:
                          Filter === item.id
                            ? Colors.gradient2
                            : Colors.inputFieldColor,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.filterText,
                        {
                          fontFamily:
                            Filter === item.id
                              ? Fonts.semiBold
                              : Fonts.fontRegular,
                        },
                      ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
            contentContainerStyle={styles.flatListContainer}
          />

          <Text style={styles.sectionTitle}>Cleaning Services</Text>
          <View style={styles.servicesContainer}>
            <FlatList
              data={services}
              keyExtractor={item => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={styles.serviceColumnWrapper}
              renderItem={({item}) => (
                <View style={styles.serviceItem}>
                  <ServicesCard
                    covers={item.cover}
                    name={item.name}
                    icon={item.icon}
                    price={item.price}
                    star={item.star}
                    rating={item.rating}
                    location={item.location}
                    onPress={() =>
                      navigation.navigate('ServiceDetails', {
                        item: item,
                      })
                    }
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
  scrollView: {
    paddingBottom: RFPercentage(10),
  },
  container: {
    backgroundColor: Colors.background,
    // marginTop: Platform.OS === 'android' ? RFPercentage(4) : RFPercentage(-0.8),
  },
  headerContainer: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignSelf: 'center',
  },
  logo: {
    width: RFPercentage(7),
    height: RFPercentage(7),
  },
  headerText: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2),
  },
  postJobText: {
    color: Colors.gradient1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.5),
  },
  searchContainer: {
    width: '90%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(1.5),
  },
  sectionTitle: {
    width: '90%',
    alignSelf: 'center',
    marginTop: RFPercentage(3),
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
  },
  categoryBox: {
    width: RFPercentage(9.5),
    height: RFPercentage(9.5),
    borderRadius: RFPercentage(1),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: RFPercentage(1),
    marginTop: RFPercentage(0.6),
  },
  categoryIcon: {
    width: RFPercentage(4),
    height: RFPercentage(4),
  },
  categoryText: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.3),
    textAlign: 'center',
    top: RFPercentage(0.9),
  },
  flatListPadding: {
    paddingHorizontal: RFPercentage(1.4),
  },
  filterBox: {
    width: RFPercentage(12.5),
    height: RFPercentage(4.3),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RFPercentage(0.8),
    marginHorizontal: RFPercentage(1),
    marginTop: RFPercentage(-0.3),
  },
  filterText: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.5),
  },
  serviceColumnWrapper: {
    justifyContent: 'space-between',
  },
  serviceItem: {
    margin: RFPercentage(1),
    width: '46%',
    marginTop: RFPercentage(1),
  },
  servicesContainer: {
    marginTop: RFPercentage(0.5),
    width: '95%',
    alignSelf: 'center',
  },
  popableStyle: {
    width: RFPercentage(24),
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  popableContent: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    width: RFPercentage(24),
  },
  popableInnerView: {
    width: '100%',
    alignItems: 'center',
  },
  sliderStyle: {
    width: RFPercentage(24),
    height: RFPercentage(3),
  },
  sliderLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: RFPercentage(22),
    bottom: 5,
    // marginTop: -4,
  },
  sliderLabel: {
    color: Colors.secondaryText,
    fontSize: 8,
    fontFamily: Fonts.semiBold,
  },
  flatListContainer: {
    paddingHorizontal: RFPercentage(1.2),
    paddingTop: RFPercentage(1.5),
  },
});
