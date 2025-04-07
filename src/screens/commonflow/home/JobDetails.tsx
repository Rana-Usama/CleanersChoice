import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import GradientButton from '../../../components/GradientButton';
import NextButton from '../../../components/NextButton';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../routers/StackNavigator';
import firestore from '@react-native-firebase/firestore';
import {setJobId} from '../../../redux/Job/Actions';

const items = [
  {
    id: '11',
    name: 'Window Cleaning',
  },
  {
    id: '22',
    name: 'Chimney Cleaning',
  },
  {
    id: '33',
    name: 'Carpet Cleaning',
  },
  {
    id: '44',
    name: 'Residential Cleaning',
  },
  {
    id: '55',
    name: 'Pressure Washing',
  },
  {
    id: '66',
    name: 'Car Washing',
  },
  {
    id: '77',
    name: 'Others',
  },
];

const JobDetails = ({route}) => {
  const {item} = route.params;
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'JobDetails'>
    >();
  const [visibleItems, setVisibleItems] = useState(5);
  const userData = useSelector(state => state.profile.profileData);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const getServiceNames = serviceIds => {
    return serviceIds
      ?.map(id => {
        const serviceItem = items.find(item => item.id === id);
        return serviceItem ? serviceItem.name : null;
      })
      .filter(name => name !== null);
  };
  const serviceNames = getServiceNames(item?.type.slice(0, visibleItems));

  const markComplete = async (jobId, newStatus) => {
    setLoading(true);
    try {
      await firestore().collection('Jobs').doc(jobId).update({
        status: newStatus,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error updating job status:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const dispatch = useDispatch();
  dispatch(setJobId(item.id));

  const handleEditButton = () => {
    setLoading2(true)
    setTimeout(() => {
      setLoading2(false)
      navigation.navigate('PostJob')
    }, 1000);
  }
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <HeaderBack title="Posted Job Details" textStyle={styles.headerText} />
        <View style={styles.container}>
          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <Image
                source={Icons.verify}
                resizeMode="contain"
                style={styles.icon}
              />
              <Text style={styles.label}>Job Title:</Text>
            </View>
            <Text style={styles.value}>{item.title}</Text>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <Image
                source={Icons.bars}
                resizeMode="contain"
                style={styles.icon}
              />
              <Text style={styles.label}>Description:</Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <Image
                source={Icons.location}
                resizeMode="contain"
                style={styles.icon}
              />
              <Text style={styles.label}>Location:</Text>
            </View>
            <Text style={styles.value}>{item.location}</Text>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <Image
                source={Icons.verify}
                resizeMode="contain"
                style={styles.icon}
              />
              <Text style={styles.label}>Service Type:</Text>
            </View>
            <View>
              <FlatList
                data={serviceNames}
                numColumns={2}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{marginLeft: RFPercentage(-1)}}
                renderItem={({item, index}) => (
                  <View style={{marginHorizontal: RFPercentage(1)}}>
                    <Text style={styles.value}>{item}</Text>
                  </View>
                )}
              />
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <Image
                source={Icons.priceRange}
                resizeMode="contain"
                style={styles.icon}
              />
              <Text style={styles.label}>Budget:</Text>
            </View>
            <Text style={styles.value}>{item.priceRange}$</Text>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.rowAlign}>
              <Image
                source={Icons.calendar}
                resizeMode="contain"
                style={styles.icon}
              />
              <Text style={styles.label}>Due Date & Time:</Text>
            </View>
            <Text style={styles.value}>{item.createdAt}</Text>
          </View>
        </View>
        {item.status === 'active' && userData.role === 'Customer' ? (
          <>
            <View style={styles.buttonWrapper}>
              <NextButton
                title="Edit Job Post"
                onPress={handleEditButton}
                textStyle={styles.buttonText}
                disabled={loading2}
                loading={loading2 || loading}

              />
              <View style={styles.buttonSpacing}>
                <GradientButton
                  title="Mark as complete"
                  textStyle={styles.buttonText}
                  onPress={() => {
                    markComplete(item.id, 'completed');
                  }}
                  loading={loading}
                  disabled={loading || loading2}
                />
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default JobDetails;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollViewContent: {
    paddingBottom: RFPercentage(10),
  },
  container: {
    backgroundColor: Colors.background,
    width: '88%',
    alignSelf: 'center',
  },
  sectionContainer: {
    marginTop: RFPercentage(3),
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: RFPercentage(2.1),
    height: RFPercentage(2.1),
    bottom: 0.7,
  },
  label: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    left: 5,
  },
  value: {
    color: 'rgba(75, 85, 99, 1)',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    marginTop: 4,
  },
  description: {
    color: 'rgba(75, 85, 99, 1)',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    marginTop: 4,
    textAlign: 'justify',
    lineHeight: 18,
  },
  buttonWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: RFPercentage(8),
  },
  buttonSpacing: {
    marginLeft: RFPercentage(2),
  },
  buttonText: {
    fontSize: RFPercentage(1.4),
  },
  headerText: {
    fontSize: RFPercentage(1.8),
  },
});
