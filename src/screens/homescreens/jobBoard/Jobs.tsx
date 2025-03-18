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
import React, {act, useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons} from '../../../constants/Themes';
import {useNavigation} from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import JobCard from '../../../components/JobCard';
import {BlurView} from '@react-native-community/blur';
import GradientButton from '../../../components/GradientButton';
import NextButton from '../../../components/NextButton';
import CustomModal from '../../../components/CustomModal';
const jobData = [
  {
    id: 1,
    name: 'Garden Cleaning',
    date: ' 26 April, 2024 | 5PM',
    location: 'Blumenwag 5, 8008 Zürich, Ohio',
    price: '50$-200$',
  },
  {
    id: 2,
    name: 'Garden Cleaning',
    date: ' 26 April, 2024 | 5PM',
    location: 'Blumenwag 5, 8008 Zürich, Ohio',
    price: '50$-200$',
  },
  {
    id: 3,
    name: 'Garden Cleaning',
    date: ' 26 April, 2024 | 5PM',
    location: 'Blumenwag 5, 8008 Zürich, Ohio',
    price: '50$-200$',
  },
];

const Jobs = () => {
  const navigation = useNavigation();
  const [active, setActive] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

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
        contentContainerStyle={{paddingBottom: RFPercentage(10)}}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: 'row',
            }}>
            <View>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Entypo
                  name="chevron-thin-left"
                  color={Colors.secondaryText}
                  size={RFPercentage(2)}
                />
              </TouchableOpacity>
            </View>
            <View>
              <Text
                style={{
                  color: Colors.primaryText,
                  fontFamily: Fonts.semiBold,
                  fontSize: RFPercentage(2),
                  left: RFPercentage(1),
                }}>
                My Posted Jobs
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('PostJob')}>
              <Text
                style={{
                  color: Colors.gradient1,
                  fontFamily: Fonts.semiBold,
                  fontSize: RFPercentage(1.5),
                }}>
                Post Job
              </Text>
            </TouchableOpacity>
          </View>
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: RFPercentage(3),
              }}>
              <TouchableOpacity onPress={toggle1}>
                <View
                  style={{
                    width: RFPercentage(13),
                    height: RFPercentage(4),
                    borderRadius: RFPercentage(100),
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      active === true ? Colors.gradient1 : 'transparent',
                    borderWidth: 1,
                    borderColor:
                      active === true ? 'transparent' : Colors.inputFieldColor,
                  }}>
                  <Text
                    style={{
                      color:
                        active === true
                          ? Colors.background
                          : Colors.placeholderColor,
                      fontFamily:
                        active === true ? Fonts.fontMedium : Fonts.fontRegular,
                      fontSize: RFPercentage(1.5),
                    }}>
                    Active
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggle2}
                style={{left: RFPercentage(2.4)}}>
                <View
                  style={{
                    width: RFPercentage(13),
                    height: RFPercentage(4),
                    borderRadius: RFPercentage(100),
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      completed === true ? Colors.gradient1 : 'transparent',
                    borderWidth: 1,
                    borderColor:
                      completed === true
                        ? 'transparent'
                        : Colors.inputFieldColor,
                  }}>
                  <Text
                    style={{
                      color:
                        completed === true
                          ? Colors.background
                          : Colors.placeholderColor,
                      fontFamily:
                        completed === true
                          ? Fonts.fontMedium
                          : Fonts.fontRegular,
                      fontSize: RFPercentage(1.5),
                    }}>
                    Completed
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{marginTop: RFPercentage(2)}}>
            <FlatList
              data={jobData}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => {
                return (
                  <JobCard
                    name={item.name}
                    location={item.location}
                    price={item.price}
                    date={item.date}
                    onPress={() => navigation.navigate('JobDetails')}
                    onPress2={() => setModalVisible(true)}
                  />
                );
              }}
            />
          </View>
        </View>
      </ScrollView>

      {modalVisible && (
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={{position: 'absolute', width: '100%', height: '100%'}}>
            <BlurView
              style={{width: '100%', height: '100%', position: 'absolute'}}
              blurType="light"
              blurAmount={5}
            />
            <CustomModal title={'Are you sure you want to delete this job?'}  onPress={()=> setModalVisible(false)}  onPress2={()=> setModalVisible(false)} />
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
  container: {
    backgroundColor: Colors.background,
    marginTop: Platform.OS == 'android' ? RFPercentage(6) : RFPercentage(-0.8),
    width: '90%',
    alignSelf: 'center',
  },
});
