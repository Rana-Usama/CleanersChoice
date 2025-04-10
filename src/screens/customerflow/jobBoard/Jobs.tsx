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
  ActivityIndicator,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../constants/Themes';
import {useNavigation} from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import JobCard from '../../../components/JobCard';
import {BlurView} from '@react-native-community/blur';
import CustomModal from '../../../components/CustomModal';
import {useFocusEffect} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {Icons} from '../../../constants/Themes';
import Toast from 'react-native-toast-message';
import HeaderBack from '../../../components/HeaderBack';

const Jobs = () => {
  const navigation = useNavigation();
  const [active, setActive] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [Jobs, setJobs] = useState([]);
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [loading2, setLoading2] = useState(false)

  const toggle1 = () => {
    setStatus('active');
    setActive(true);
    setCompleted(false);
  };

  const toggle2 = () => {
    setStatus('completed');
    setActive(false);
    setCompleted(true);
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyJobs();
    }, [status]),
  );

  const fetchMyJobs = async () => {
    const user = auth().currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const snapshot = await firestore()
        .collection('Jobs')
        .where('jobId', '==', user.uid)
        .where('status', '==', status)
        .get();

      const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobs(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async () => {
    setLoading2(true)
    try {
      await firestore().collection('Jobs').doc(selectedJobId).delete();
      setModalVisible(false);
      fetchMyJobs();
      Toast.show({
        type: 'success',
        text1: 'Job Deleted',
        text2: 'Job deleted successfully',
        position: 'top',
        topOffset: RFPercentage(8),
        text1Style: {fontFamily: Fonts.fontBold, fontSize: RFPercentage(1.7)},
        text2Style: {
          fontFamily: Fonts.fontRegular,
          fontSize: RFPercentage(1.4),
        },
      });
    } catch (error) {
      console.error('Error deleting job:', error);
    }
    finally {
      setLoading2(false)
    }
  };


  const getTruncatedText = text => {
    const maxChars = 15;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).trim() + '... ';
  };

  const getTruncatedText2 = text => {
    const maxChars = 25;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).trim() + '... ';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}>
          <HeaderBack title='My Posted Jobs' right={true} rightText='Post Job' textStyle={{fontSize:RFPercentage(1.8)}} onPress={()=> navigation.navigate('PostJob',{jobId:null})}  />
        <View style={styles.container}>
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
        </View>
        <View style={styles.listContainer}>
          {loading ? (
            <>
              <ActivityIndicator
                size={RFPercentage(5)}
                color={Colors.placeholderColor}
                style={{marginTop: RFPercentage(30)}}
              />
            </>
          ) : (
            <>
              {Jobs.length > 0 ? (
                <>
                  <FlatList
                    data={Jobs}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({item}) => (
                      <JobCard
                        name={getTruncatedText(item.title)}
                        location={getTruncatedText2(item.location)}
                        price={item.priceRange}
                        date={item.createdAt}
                        onPress={() => navigation.navigate('JobDetails', {item : item})}
                        onPress2={() => {
                          setSelectedJobId(item.id);
                          setModalVisible(true);
                        }}
                        delete={true}
                      />
                    )}
                  />
                </>
              ) : (
                <>
                  <View style={styles.noServiceContainer}>
                    <Image
                      source={Icons.empty}
                      resizeMode="contain"
                      style={styles.noServiceImg}
                    />
                    <Text style={styles.noServiceText}>No Jobs found</Text>
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
      {modalVisible && (
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <BlurView style={styles.blurView} blurType="light" blurAmount={5} />
            <CustomModal
              title={'Are you sure you want to delete this job?'}
              onPress={() => setModalVisible(false)}
              onPress2={handleDeleteJob}
              loader={loading2}
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
    width: '90%',
    alignSelf: 'center',
    marginTop:RFPercentage(4)
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
    // marginTop: RFPercentage(3),
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
    width: '100%',
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
  noServiceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: RFPercentage(20),
  },
  noServiceImg: {
    width: RFPercentage(10),
    height: RFPercentage(10),
  },
  noServiceText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
    textAlign: 'center',
    marginTop: RFPercentage(1),
  },
});
