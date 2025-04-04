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
  TouchableWithoutFeedback,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import React, {useState, useRef, useCallback} from 'react';
import {Colors, Fonts, Icons, IMAGES} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import SearchField from '../../../components/SearchField';
import ServicesCard from '../../../components/ServicesCard';
import {useNavigation} from '@react-navigation/native';
import HeaderBack from '../../../components/HeaderBack';
import {RootStackParamList} from '../../../routers/StackNavigator';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Popable} from 'react-native-popable';
import Slider from '@react-native-community/slider';
import {useFocusEffect} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import {BlurView} from '@react-native-community/blur';
import AntDesign from 'react-native-vector-icons/AntDesign';
import InputField from '../../../components/InputField';
import GradientButton from '../../../components/GradientButton';

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
];

const Home = () => {
  const [Filter, setFilter] = useState(null);
  const [categorySelection, setCategorySelection] = useState(1);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([10, 2000]);
  const tempValue = useRef(priceRange[0]);
  const [servicesData, setServicesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [rangeSelector, setRangeSelector] = useState(false);
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState('');
 const [loctionFilter, setLocationFilter] = useState(false)


  useFocusEffect(
    useCallback(() => {
      serviceDetails(); 
    }, []),
  );

  const serviceDetails = async () => {
    setLoading(true);
    try {
      const querySnapshot = await firestore()
        .collection('CleanerServices')
        .get();

      if (!querySnapshot.empty) {
        const servicesArray = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setServicesData(servicesArray);

        const locationsArray = servicesArray
          .map(service => service.location)
          .filter(location => location !== undefined);
        setLocations(locationsArray);
      } else {
        setServicesData([]);
        setLocations([]);
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServicesData = servicesData.filter(service => {
    const servicePrice = service?.packages[0]?.price;
    return servicePrice >= 0 && servicePrice <= priceRange[0];
  });

 const filteredLocationServices = servicesData.filter(service =>
    service?.location.toLowerCase().includes(query.toLowerCase()))


  const handleSearch = query => {
    setQuery(query);
    const filtered = locations.filter(location =>
      location.toLowerCase().includes(query.toLowerCase()),
    );
    setLocations(filtered);
  };

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
              return (
                <View>
                  <TouchableOpacity
                    onPress={() => {
                      setFilter(item?.id);
                      setModalVisible(true);
                    }}
                    style={[
                      styles.filterBox,
                      {
                        borderColor:
                          Filter === item.id && (priceRange || loctionFilter)
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
              data={rangeSelector ? filteredServicesData : loctionFilter ? filteredLocationServices : servicesData}
              keyExtractor={item => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={styles.serviceColumnWrapper}
              renderItem={({item}) => (
                <View style={styles.serviceItem}>
                  <ServicesCard
                    covers={item.serviceImages}
                    name={item.name}
                    icon={item.image}
                    price={item.packages[0].price}
                    star={IMAGES.star}
                    rating={5}
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
      {Filter === 1 && modalVisible && (
        <>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalContainer}>
              <BlurView
                style={styles.blurView}
                blurType="light"
                blurAmount={5}
              />
              <Modal
                visible={modalVisible}
                transparent={true}
                onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  style={{flex: 1}}>
                  <View
                    style={{
                      width: '90%',
                      height: '50%',
                      alignSelf: 'center',
                      backgroundColor: 'rgba(226, 238, 255, 0.8)',
                      alignItems: 'center',
                      borderRadius: RFPercentage(2.5),
                      top: RFPercentage(20),
                      paddingHorizontal: RFPercentage(1.6),
                      paddingVertical: RFPercentage(2.5),
                    }}>
                    <View
                      style={{
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Text
                        style={{
                          color: Colors.secondaryText,
                          fontFamily: Fonts.fontMedium,
                          fontSize: RFPercentage(1.6),
                        }}>
                        Apply Location
                      </Text>
                      <TouchableOpacity
                        style={{position: 'absolute', right: 0}}
                        onPress={() => setModalVisible(false)}>
                        <AntDesign
                          name="closecircleo"
                          size={RFPercentage(2.5)}
                          color={'rgba(184, 184, 184, 1)'}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={{width: '100%', marginTop: RFPercentage(2)}}>
                      <SearchField
                        placeholder="Search Location"
                        customStyle={{borderColor: 'rgba(39, 38, 38, 0.29)'}}
                        value={query}
                        onChangeText={handleSearch}
                      />
                    </View>

                    {query.length > 0 && (
                      <View
                        style={{
                          top: RFPercentage(0.5),
                          width: '100%',
                          backgroundColor: 'white',
                          borderRadius: 5,
            
                        }}>
                        <FlatList
                          data={locations}
                          keyExtractor={(item, index) => index.toString()}
                          renderItem={({item}) => (
                            <TouchableOpacity
                              onPress={() => {
                                setQuery(item); 
                              }}>
                              <Text
                                style={{
                                  padding: 10,
                                  fontSize: RFPercentage(1.8),
                                  borderBottomWidth: 1,
                                  borderBottomColor: 'rgba(184, 184, 184, 0.8)',
                                }}>
                                {item}
                              </Text>
                            </TouchableOpacity>
                          )}
                        />
                      </View>
                    )}
                    <View
                      style={{position: 'absolute', bottom: RFPercentage(2)}}>
                      <GradientButton
                        title="Apply"
                        onPress={() => 
                        {
                          setLocationFilter(true)
                          setModalVisible(false)
                        }
                        }
                      />
                    </View>
                  </View>
                </KeyboardAvoidingView>
              </Modal>
            </View>
          </TouchableWithoutFeedback>
        </>
      )}

      {Filter === 2 && modalVisible && (
        <>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalContainer}>
              <BlurView
                style={styles.blurView}
                blurType="light"
                blurAmount={5}
              />
              <Modal
                visible={modalVisible}
                transparent={true}
                onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  style={{flex: 1}}>
                  <View
                    style={{
                      width: '90%',
                      height: '40%',
                      alignSelf: 'center',
                      backgroundColor: 'rgba(228, 238, 253, 0.8)',
                      alignItems: 'center',
                      borderRadius: RFPercentage(2.5),
                      top: RFPercentage(25),
                      paddingHorizontal: RFPercentage(1.6),
                      paddingVertical: RFPercentage(2.5),
                    }}>
                    <View
                      style={{
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: RFPercentage(1),
                      }}>
                      <Text
                        style={{
                          color: Colors.primaryText,
                          fontFamily: Fonts.fontMedium,
                          fontSize: RFPercentage(1.6),
                        }}>
                        Price Range Selection
                      </Text>
                      <TouchableOpacity
                        style={{position: 'absolute', right: 0}}
                        onPress={() => setModalVisible(false)}>
                        <AntDesign
                          name="closecircleo"
                          size={RFPercentage(2.5)}
                          color={'rgba(144, 144, 144, 0.77)'}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={{width: '100%', marginTop: RFPercentage(8)}}>
                      <Slider
                        style={styles.sliderStyle}
                        minimumValue={10}
                        maximumValue={2000}
                        step={10}
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
                        <Text
                          style={[styles.sliderLabel, {left: RFPercentage(1)}]}>
                          0$
                        </Text>
                        <Text
                          style={[styles.sliderLabel, {left: RFPercentage(1)}]}>
                          1000$
                        </Text>
                        <Text style={styles.sliderLabel}>2000$+</Text>
                      </View>
                      <View style={{marginTop: RFPercentage(5)}}>
                        <Text
                          style={{
                            textAlign: 'center',
                            fontFamily: Fonts.fontMedium,
                            fontSize: RFPercentage(1.5),
                            color: Colors.primaryText,
                          }}>
                          Price Range: {tempValue.current}$
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{position: 'absolute', bottom: RFPercentage(2)}}>
                      <GradientButton
                        title="Apply"
                        onPress={() => {
                          setRangeSelector(true);
                          setModalVisible(false);
                        }}
                      />
                    </View>
                  </View>
                </KeyboardAvoidingView>
              </Modal>
            </View>
          </TouchableWithoutFeedback>
        </>
      )}
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
    // justifyContent: 'space-between',
    // backgroundColor:'red'
  },
  serviceItem: {
    margin: RFPercentage(0.6),
    width: '47.5%',
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
    width: '100%',
    height: RFPercentage(3),
  },
  sliderLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    // bottom: 5,
    // marginTop: -4,
  },
  sliderLabel: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(2),
    fontFamily: Fonts.semiBold,
  },
  flatListContainer: {
    paddingHorizontal: RFPercentage(1.2),
    paddingTop: RFPercentage(1.5),
  },
  modalContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurView: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
});
