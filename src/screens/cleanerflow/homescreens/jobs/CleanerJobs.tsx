import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import JobCard from '../../../../components/JobCard';
import {useNavigation} from '@react-navigation/native';

const filter = [
  {id: 1, name: 'Location'},
  {id: 2, name: 'Price Range'},
  {id: 3, name: 'Service Type'},
];

const jobData = [
  {
    id: 1,
    name: 'Garden Cleaning',
    date: '26 April, 2024 | 5PM',
    location: 'Blumenwag 5, 8008 Zürich, Ohio',
    price: '50$-200$',
  },
  {
    id: 2,
    name: 'Garden Cleaning',
    date: '26 April, 2024 | 5PM',
    location: 'Blumenwag 5, 8008 Zürich, Ohio',
    price: '50$-200$',
  },
  {
    id: 3,
    name: 'Garden Cleaning',
    date: '26 April, 2024 | 5PM',
    location: 'Blumenwag 5, 8008 Zürich, Ohio',
    price: '50$-200$',
  },
  {
    id: 4,
    name: 'Garden Cleaning',
    date: '26 April, 2024 | 5PM',
    location: 'Blumenwag 5, 8008 Zürich, Ohio',
    price: '50$-200$',
  },
  {
    id: 5,
    name: 'Garden Cleaning',
    date: '26 April, 2024 | 5PM',
    location: 'Blumenwag 5, 8008 Zürich, Ohio',
    price: '50$-200$',
  },
  {
    id: 6,
    name: 'Garden Cleaning',
    date: '26 April, 2024 | 5PM',
    location: 'Blumenwag 5, 8008 Zürich, Ohio',
    price: '50$-200$',
  },
];

const CleanerJobs = () => {
  const [Filter, setFilter] = useState(null);
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <HeaderBack title={'Jobs'} textStyle={{fontSize: RFPercentage(1.8)}} />
        <View style={styles.container}>
          <View style={styles.jobPostedContainer}>
            <Text style={styles.jobPosted}>Recent Job posts by clients</Text>
          </View>
          <View>
            <Text style={styles.sectionTitle}>Apply Filters</Text>
            <FlatList
              horizontal
              data={filter}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => (
                <TouchableOpacity onPress={() => setFilter(item.id)}>
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
                </TouchableOpacity>
              )}
              contentContainerStyle={{
                paddingTop: RFPercentage(1.5),
                right:RFPercentage(0.5)
              }}
            />
          </View>
          </View>
          <View>
            <View style={styles.listContainer}>
              <FlatList
                data={jobData}
                keyExtractor={item => item.id.toString()}
                renderItem={({item}) => (
                  <JobCard
                    name={item.name}
                    location={item.location}
                    price={item.price}
                    date={item.date}
                    onPress={() => navigation.navigate('JobDetails')}
                    delete={false}
                  />
                )}
              />
            </View>
          </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CleanerJobs;

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
    width: '90%',
    alignSelf: 'center',
  },
  sectionTitle: {
    marginTop: RFPercentage(2.5),
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
  },
  filterBox: {
    width: RFPercentage(12.5),
    height: RFPercentage(4.3),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RFPercentage(0.8),
    marginHorizontal: RFPercentage(0.5),
  },
  filterText: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.5),
  },
  listContainer: {
    marginTop: RFPercentage(0.7),
    width:'100%',
  },
  jobPosted: {
    textAlign: 'center',
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
  },
  jobPostedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(2),
  },
});
