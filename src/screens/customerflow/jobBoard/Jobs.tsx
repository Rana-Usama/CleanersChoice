import {
  StyleSheet,
  Text,
  View,
  Platform,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../constants/Themes';
import {useNavigation} from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import JobCard from '../../../components/JobCard';
import {BlurView} from '@react-native-community/blur';
import CustomModal from '../../../components/CustomModal';

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
];

const Jobs = () => {
  const navigation = useNavigation();
  const [active, setActive] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const toggle1 = () => {
    setActive(true);
    setCompleted(false);
  };
  const toggle2 = () => {
    setActive(false);
    setCompleted(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Entypo
                name="chevron-thin-left"
                color={Colors.secondaryText}
                size={RFPercentage(2)}
              />
            </TouchableOpacity>
            <Text style={styles.title}>My Posted Jobs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PostJob')}>
              <Text style={styles.postJobText}>Post Job</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.toggleContainer}>
            <TouchableOpacity onPress={toggle1}>
              <View
                style={[styles.toggleButton, active && styles.activeButton]}>
                <Text style={[styles.toggleText, active && styles.activeText]}>
                  Active
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggle2} style={styles.toggleSpacing}>
              <View
                style={[styles.toggleButton, completed && styles.activeButton]}>
                <Text
                  style={[styles.toggleText, completed && styles.activeText]}>
                  Completed
                </Text>
              </View>
            </TouchableOpacity>
          </View>
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
                  onPress2={() => setModalVisible(true)}
                  delete={true}
                />
              )}
            />
          </View>
        </View>
      </ScrollView>
      {modalVisible && (
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <BlurView style={styles.blurView} blurType="light" blurAmount={5} />
            <CustomModal
              title={'Are you sure you want to delete this job?'}
              onPress={() => setModalVisible(false)}
              onPress2={() => setModalVisible(false)}
            />
          </View>
        </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
  );
};

export default Jobs;

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
    marginTop: Platform.OS === 'android' ? RFPercentage(6) : RFPercentage(0),
    width: '90%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    left: RFPercentage(1),
  },
  postJobText: {
    color: Colors.gradient1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.5),
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFPercentage(3),
  },
  toggleButton: {
    width: RFPercentage(13),
    height: RFPercentage(4),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.inputFieldColor,
  },
  activeButton: {
    backgroundColor: Colors.gradient1,
    borderColor: 'transparent',
  },
  toggleText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
  },
  activeText: {
    color: Colors.background,
    fontFamily: Fonts.fontMedium,
  },
  toggleSpacing: {
    left: RFPercentage(2.4),
  },
  listContainer: {
    marginTop: RFPercentage(2),
  },
  modalContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  blurView: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
});
