import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import {useSelector} from 'react-redux';
import GradientButton from '../../../components/GradientButton';
import {useDispatch} from 'react-redux';
import {cleanerAvailability} from '../../../redux/Availability/Actions';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import SetAvailability from '../../../components/SetAvailablity';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {FadeInUp, SlideInRight} from 'react-native-reanimated';
import * as Progress from 'react-native-progress';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const {width} = Dimensions.get('window');

const days = [
  {
    id: 1,
    name: 'Mon',
    fullName: 'Monday',
  },
  {
    id: 2,
    name: 'Tue',
    fullName: 'Tuesday',
  },
  {
    id: 3,
    name: 'Wed',
    fullName: 'Wednesday',
  },
  {
    id: 4,
    name: 'Thu',
    fullName: 'Thursday',
  },
  {
    id: 5,
    name: 'Fri',
    fullName: 'Friday',
  },
  {
    id: 6,
    name: 'Sat',
    fullName: 'Saturday',
  },
  {
    id: 7,
    name: 'Sun',
    fullName: 'Sunday',
  },
];

const Availability = ({navigation}: any) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState(null);
  const profileCompletion = useSelector(
    state => state?.profile?.profileCompletion,
  );
  const [loading2, setLoading2] = useState(false);
  const [availabilityData, setAvailabilityData] = useState([]);

  useEffect(() => {
    serviceDetails();
  }, []);

  const serviceDetails = async () => {
    const user = auth().currentUser;
    if (!user) return;
    setLoading2(true);
    try {
      const userDoc = await firestore()
        .collection('CleanerServices')
        .doc(user.uid)
        .get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setService(userData);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
    } finally {
      setLoading2(false);
    }
  };

  useEffect(() => {
    if (service?.availability) {
      const updatedAvailability = days.map(day => {
        const found =
          service?.availability?.length > 0 &&
          service?.availability?.find(item => item.day === day.name);
        return {
          day: day.name,
          fullName: day.fullName,
          fromTime: found
            ? new Date(
                found.fromTime?._seconds
                  ? found.fromTime._seconds * 1000
                  : found.fromTime,
              )
            : new Date(new Date().setHours(9, 0, 0, 0)),
          toTime: found
            ? new Date(
                found.toTime?._seconds
                  ? found.toTime._seconds * 1000
                  : found.toTime,
              )
            : new Date(new Date().setHours(18, 0, 0, 0)),
          checked: found ? found.checked : false,
        };
      });

      setAvailabilityData(updatedAvailability);
    } else {
      // Initialize with default data
      const defaultAvailability = days.map(day => ({
        day: day.name,
        fullName: day.fullName,
        fromTime: new Date(new Date().setHours(9, 0, 0, 0)),
        toTime: new Date(new Date().setHours(18, 0, 0, 0)),
        checked: false,
      }));
      setAvailabilityData(defaultAvailability);
    }
  }, [service?.availability]);

  const toggleCheckBox = day => {
    setAvailabilityData(prev => {
      const updated = prev.map(item =>
        item.day === day ? {...item, checked: !item.checked} : item,
      );
      return updated;
    });
  };

  const updateAvailability = (day, fromTime, toTime) => {
    setAvailabilityData(prev => {
      const updated = prev.map(item =>
        item.day === day ? {...item, fromTime, toTime} : item,
      );
      return updated;
    });
  };

  const handleSetAvailability = () => {
    const selectedDays = availabilityData.filter(day => day.checked);
    if (selectedDays.length === 0) {
      return;
    }

    setLoading(true);
    dispatch(cleanerAvailability(availabilityData));
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('ServiceOne');
    }, 800);
  };

  // Calculate days selected
  const selectedDaysCount = availabilityData.filter(day => day.checked).length;

  // Calculate completion percentage
  const completionPercentage = selectedDaysCount / 7;

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent={true}
      />

      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <HeaderBack
          title="Set Availability"
          textStyle={styles.headerText}
          left={true}
          arrowColor={'white'}
          style={{backgroundColor: 'transparent'}}
        />

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Days Selected</Text>
            <Text style={styles.progressPercent}>{selectedDaysCount}/7</Text>
          </View>
          <Progress.Bar
            progress={completionPercentage}
            width={width - 80}
            height={6}
            color="#FFFFFF"
            unfilledColor="rgba(255,255,255,0.3)"
            borderWidth={0}
            borderRadius={10}
            style={styles.progressBar}
          />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {loading2 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={Colors.gradient1}
              style={styles.loadingIndicator}
            />
            <Text style={styles.loadingText}>Loading availability...</Text>
          </View>
        ) : (
          <Animated.View entering={FadeInUp.duration(600)}>
            {/* Instructions Card */}
            <View style={styles.instructionsCard}>
              <View style={styles.instructionsHeader}>
                <MaterialIcons
                  name="schedule"
                  size={24}
                  color={Colors.gradient1}
                />
                <View style={styles.instructionsTextContainer}>
                  <Text style={styles.instructionsTitle}>
                    Set Your Working Schedule
                  </Text>
                  <Text style={styles.instructionsSubtitle}>
                    Toggle days when you're available and set your working hours
                  </Text>
                </View>
              </View>

              {/* Quick Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{selectedDaysCount}</Text>
                  <Text style={styles.statLabel}>Days Selected</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {availabilityData.filter(d => d.checked).length > 0
                      ? availabilityData
                          .find(d => d.checked)
                          ?.fromTime?.getHours() || '--'
                      : '--'}
                  </Text>
                  <Text style={styles.statLabel}>Start Time</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {availabilityData.filter(d => d.checked).length > 0
                      ? availabilityData
                          .find(d => d.checked)
                          ?.toTime?.getHours() || '--'
                      : '--'}
                  </Text>
                  <Text style={styles.statLabel}>End Time</Text>
                </View>
              </View>
            </View>

            {/* Days Selection */}
            <View style={styles.daysContainer}>
              <Text style={styles.sectionTitle}>Weekly Schedule</Text>
              <Text style={styles.sectionSubtitle}>
                Tap days to toggle availability
              </Text>

              <FlatList
                data={availabilityData}
                scrollEnabled={false}
                keyExtractor={item => item.day}
                contentContainerStyle={styles.daysList}
                renderItem={({item, index}) => (
                  <Animated.View
                    entering={SlideInRight.delay(100 + index * 50)}
                    style={styles.dayItemWrapper}>
                    <SetAvailability
                      day={item.day}
                      fullName={item.fullName}
                      fromTime={item.fromTime}
                      toTime={item.toTime}
                      checked={item.checked}
                      onUpdateAvailability={updateAvailability}
                      onToggleCheckBox={toggleCheckBox}
                    />
                  </Animated.View>
                )}
              />
            </View>

            {/* Tips Card */}
            {selectedDaysCount === 0 && (
              <View style={styles.tipsCard}>
                <View style={styles.tipsHeader}>
                  <FontAwesome name="lightbulb-o" size={18} color="#F59E0B" />
                  <Text style={styles.tipsTitle}>Pro Tip</Text>
                </View>
                <Text style={styles.tipsText}>
                  Select at least 3-5 days to maximize your booking
                  opportunities. Customers prefer cleaners with consistent
                  availability.
                </Text>
              </View>
            )}

            {/* Bulk Actions */}
            <View style={styles.bulkActions}>
              <Text style={styles.bulkTitle}>Quick Actions</Text>
              <View style={styles.bulkButtons}>
                <TouchableOpacity
                  activeOpacity={0.6}
                  style={styles.bulkButton}
                  onPress={() => {
                    setAvailabilityData((prev: any) =>
                      prev.map((day: any) => ({...day, checked: true})),
                    );
                  }}>
                  <MaterialIcons
                    name="check-circle"
                    size={16}
                    color="#10B981"
                  />
                  <Text style={styles.bulkButtonText}>Select All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.6}
                  style={styles.bulkButton}
                  onPress={() => {
                    setAvailabilityData((prev: any) =>
                      prev.map((day: any) => ({...day, checked: false})),
                    );
                  }}>
                  <MaterialIcons
                    name="remove-circle"
                    size={16}
                    color="#EF4444"
                  />
                  <Text style={styles.bulkButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.6}
                  style={styles.bulkButton}
                  onPress={() => {
                    setAvailabilityData((prev: any) =>
                      prev.map((day: any) => ({
                        ...day,
                        checked: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(
                          day.day,
                        ),
                      })),
                    );
                  }}>
                  <MaterialIcons
                    name="work"
                    size={16}
                    color={Colors.gradient1}
                  />
                  <Text style={styles.bulkButtonText}>Weekdays Only</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  selectedDaysCount === 0 && styles.buttonDisabled,
                ]}
                onPress={handleSetAvailability}
                disabled={loading || selectedDaysCount === 0}
                activeOpacity={0.6}>
                <LinearGradient
                  colors={
                    selectedDaysCount === 0
                      ? ['#E5E7EB', '#D1D5DB']
                      : [Colors.gradient1, Colors.gradient2]
                  }
                  style={styles.buttonGradient}>
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>
                        {profileCompletion === '100'
                          ? 'Update Availability'
                          : 'Save Availability'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.requirementsText}>
                {selectedDaysCount === 0
                  ? 'Select at least one day to save'
                  : `${selectedDaysCount} day${
                      selectedDaysCount !== 1 ? 's' : ''
                    } selected`}
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    // elevation: 8,
  },
  headerText: {
    fontSize: RFPercentage(2.2),
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
  progressSection: {
    marginTop: 15,
    paddingHorizontal: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: '#FFFFFF',
    opacity: 0.9,
  },
  progressPercent: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    color: '#FFFFFF',
  },
  progressBar: {
    marginTop: 4,
    alignSelf: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  loadingIndicator: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    color: '#6B7280',
  },
  instructionsCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth:1,
    borderColor:"#d3e7f7ff"
    // elevation: 3,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  instructionsTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  instructionsTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
    color: '#1F2937',
    marginBottom: 4,
  },
  instructionsSubtitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: '#6B7280',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: RFPercentage(2),
    fontFamily: Fonts.semiBold,
    color: Colors.gradient1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontMedium,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  daysContainer: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
    color: '#1F2937',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    color: '#6B7280',
    marginBottom: 20,
  },
  daysList: {
    paddingBottom: 8,
  },
  dayItemWrapper: {
    marginBottom: 12,
  },
  tipsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.semiBold,
    color: '#92400E',
    marginLeft: 8,
  },
  tipsText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: '#92400E',
    lineHeight: 20,
  },
  bulkActions: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  bulkTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: '#374151',
    marginBottom: 12,
  },
  bulkButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bulkButtonText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontMedium,
    color: '#374151',
    marginLeft: 6,
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 40,
  },
  saveButton: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: Colors.gradient1,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    // elevation: 8,
    width: '60%',
    alignSelf: 'center',
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: '#FFFFFF',
    marginRight: 10,
  },
  buttonIcon: {
    marginTop: 2,
  },
  requirementsText: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default Availability;
