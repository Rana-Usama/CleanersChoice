import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StatusBar,
  SafeAreaView,
  Dimensions,
  TextInput,
} from 'react-native';
import React, {useState, useEffect, useRef} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons} from '../../../constants/Themes';
import HeaderBack from '../../../components/HeaderBack';
import InputField from '../../../components/InputField';
import CustomDropDown from '../../../components/DropDown';
import GradientButton from '../../../components/GradientButton';
import {useNavigation} from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import DescriptionField from '../../../components/DescriptionField';
import InfoHeader from '../../../components/InfoHeader';
import moment from 'moment';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {showToast} from '../../../utils/ToastMessage';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSoftInputAdjustNothing} from '../../../hooks/useSoftInputMode';
import DollarIcon from '../../../assets/svg/DollarIcon';
import SquareFeetIcon from '../../../assets/svg/SquareFeetIcon';

const {width} = Dimensions.get('window');

// Data for dropdown (objects with id and label)
const serviceTypes = [
  {
    id: 1,
    label: 'Window Cleaning',
  },
  {
    id: 2,
    label: 'Chimney Cleaning',
  },
  {
    id: 3,
    label: 'Carpet Cleaning',
  },
  {
    id: 4,
    label: 'Car Cleaning',
  },
  {
    id: 5,
    label: 'Residential Cleaning',
  },
  {
    id: 6,
    label: 'Pressure Washing',
  },
  {
    id: 7,
    label: 'Lawn Care',
  },
  {
    id: 8,
    label: 'Others',
  },
];

// Separate array with icons for display
const serviceTypesWithIcons = [
  {
    id: 1,
    label: 'Window Cleaning',
    icon: 'window-open',
  },
  {
    id: 2,
    label: 'Chimney Cleaning',
    icon: 'fireplace',
  },
  {
    id: 3,
    label: 'Carpet Cleaning',
    icon: 'vacuum',
  },
  {
    id: 4,
    label: 'Car Cleaning',
    icon: 'car-wash',
  },
  {
    id: 5,
    label: 'Residential Cleaning',
    icon: 'home',
  },
  {
    id: 6,
    label: 'Pressure Washing',
    icon: 'water-pump',
  },
  {
    id: 7,
    label: 'Lawn Care',
    icon: 'leaf',
  },
  {
    id: 8,
    label: 'Others',
    icon: 'dots-horizontal',
  },
];

const PostJob = ({route}: any) => {
  const {jobId, repost} = route.params || {};

  const navigation = useNavigation<any>();
  const [date, setDate] = useState<Date | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const formattedDate = date
    ? moment(date).format('MMM DD, YYYY  •  hh:mm A')
    : '';
  const [jobTitle, setJobTitle] = useState('');
  const [Location, setLocation] = useState('');
  const [Description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [budget, setBudget] = useState('');
  const [budgetType, setBudgetType] = useState<'flat' | 'hourly' | 'sqft'>('flat');
  const [hourlyRate, setHourlyRate] = useState('');
  const [hours, setHours] = useState('');
  const [pricePerSqFt, setPricePerSqFt] = useState('');
  const [sqFt, setSqFt] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const userLocation = useSelector((state: any) => state?.location?.location);

  useSoftInputAdjustNothing();

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSelectedItem = (item: any) => {
    setSelectedType(item.label);
    const service = serviceTypesWithIcons.find(s => s.label === item.label);
    setSelectedService(service);
  };

  // Post Job
  const postJob = async () => {
    const user = auth().currentUser;
    if (!user) return;

    if (!jobTitle.trim() || !userLocation || !selectedType || !date) {
      showToast({
        type: 'info',
        title: 'Job Post',
        message: 'Please fill all the details including job due date',
      });
      return;
    }

    // Validate budget based on type
    let computedBudget = 0;
    if (budgetType === 'flat') {
      computedBudget = parseInt(budget.replace(/[^0-9]/g, ''), 10) || 0;
    } else if (budgetType === 'hourly') {
      const rate = parseInt(hourlyRate.replace(/[^0-9]/g, ''), 10) || 0;
      const hrs = parseInt(hours, 10) || 0;
      computedBudget = rate * hrs;
    } else if (budgetType === 'sqft') {
      const ppsf = parseInt(pricePerSqFt.replace(/[^0-9]/g, ''), 10) || 0;
      const sf = parseInt(sqFt, 10) || 0;
      computedBudget = ppsf * sf;
    }

    if (!computedBudget || computedBudget < 1) {
      showToast({
        type: 'info',
        title: 'Invalid Amount',
        message: 'Budget must be greater than 0',
      });
      return;
    }

    setLoading(true);
    try {
      const jobData: any = {
        title: jobTitle.trim(),
        description: Description.trim(),
        type: selectedType,
        location: userLocation,
        priceRange: String(computedBudget),
        budgetType: budgetType,
        remarks: remarks ? remarks.trim() : '',
        jobId: user.uid,
        status: 'active',
        createdAt2: new Date(),
      };

      // Save budget type specific fields
      if (budgetType === 'hourly') {
        jobData.hourlyRate = hourlyRate.replace(/[^0-9]/g, '');
        jobData.hours = hours;
      } else if (budgetType === 'sqft') {
        jobData.pricePerSqFt = pricePerSqFt.replace(/[^0-9]/g, '');
        jobData.sqFt = sqFt;
      }

      // only set createdAt if date is selected
      if (date) {
        jobData.createdAt = moment(date).format('YYYY-MM-DD  HH:mm A');
      }

      // Reset job fields when reposting an expired job
      if (repost) {
        jobData.applicants = [];
        jobData.confirmedCleaner = firestore.FieldValue.delete();
        jobData.cancelledCleaners = [];
        jobData.expiredAt = firestore.FieldValue.delete();
        jobData.repostNotificationSent = firestore.FieldValue.delete();
        jobData.expiryWarningNotified = firestore.FieldValue.delete();
        jobData.autoCompleted = firestore.FieldValue.delete();
        jobData.completionRequestedAt = firestore.FieldValue.delete();
      }

      if (jobId) {
        await firestore().collection('Jobs').doc(jobId).update(jobData);
        showToast({
          type: 'success',
          title: repost ? 'Job Reposted!' : 'Success',
          message: repost
            ? 'Your job is now live again'
            : 'Job updated successfully',
        });
        navigation.navigate('Home');
      } else {
        await firestore().collection('Jobs').add(jobData);
        showToast({
          type: 'success',
          title: 'Congratulations!',
          message: 'Your job is now live',
        });
        navigation.navigate('JobPosted');
      }
    } catch (error) {
      console.log('Post Job Error:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to post job. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch job
  const fetchJob = async () => {
    const user = auth().currentUser;
    if (!user || !jobId) return;
    setLoading(true);
    try {
      const docSnapshot = await firestore().collection('Jobs').doc(jobId).get();

      if (docSnapshot.exists) {
        const jobData = docSnapshot.data();
        setJobTitle(jobData?.title || '');
        setDescription(jobData?.description || '');
        setLocation(jobData?.location?.name || '');
        setSelectedType(jobData?.type || null);
        setBudget(jobData?.priceRange ? `$${jobData.priceRange}` : '');
        setRemarks(jobData?.remarks || '');

        // Load budget type fields
        if (jobData?.budgetType) {
          setBudgetType(jobData.budgetType);
        }
        if (jobData?.hourlyRate) {
          setHourlyRate(`$${jobData.hourlyRate}`);
        }
        if (jobData?.hours) {
          setHours(jobData.hours);
        }
        if (jobData?.pricePerSqFt) {
          setPricePerSqFt(`$${jobData.pricePerSqFt}`);
        }
        if (jobData?.sqFt) {
          setSqFt(jobData.sqFt);
        }

        if (!repost) {
          setDate(moment(jobData?.createdAt, 'YYYY-MM-DD  HH:mm A').toDate());
        }

        const service = serviceTypesWithIcons.find(
          s => s.label === jobData?.type,
        );
        setSelectedService(service);
      }
    } catch (error) {
      console.log('Fetch Job Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, []);

  const handleBudgetChange = (text: any) => {
    const numeric = text.replace(/[^0-9]/g, '').replace(/^0+/, '');
    setBudget(numeric ? `$${numeric}` : '');
  };

  const handleNext = () => {
    if (!jobTitle.trim()) {
      showToast({
        type: 'info',
        title: 'Required',
        message: 'Please enter a job title',
      });
      return;
    }
    if (!Description.trim()) {
      showToast({
        type: 'info',
        title: 'Required',
        message: 'Please enter a job description',
      });
      return;
    }
    if (!selectedType) {
      showToast({
        type: 'info',
        title: 'Required',
        message: 'Please select a service type',
      });
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const StepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <View style={styles.stepRow}>
        {[1, 2].map(item => (
          <View key={item} style={styles.stepItem}>
            <LinearGradient
              colors={
                item <= step
                  ? [Colors.gradient1, Colors.gradient2]
                  : [Colors.gray200, Colors.gray200]
              }
              style={styles.stepCircle}>
              <Text
                style={[
                  styles.stepNumber,
                  {color: item <= step ? Colors.white : Colors.secondaryText},
                ]}>
                {item}
              </Text>
            </LinearGradient>
            <Text
              style={[
                styles.stepLabel,
                {color: item <= step ? Colors.gradient1 : Colors.secondaryText},
              ]}>
              {item === 1 ? 'Job Details' : 'Finalize'}
            </Text>
            {/* {item < 2 && (
              <View
                style={[
                  styles.stepLine,
                  {backgroundColor: step > item ? Colors.gradient1 : '#E5E7EB'},
                ]}
              />
            )} */}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent
      />

      {/* Header */}
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {repost ? 'Repost Job' : jobId ? 'Edit Job' : 'Post New Job'}
        </Text>
        <View style={{width: 40}} />
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContainer,
          keyboardHeight > 0 && {
            paddingBottom: keyboardHeight + RFPercentage(12),
          },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.contentContainer}>
            {/* Step Indicator */}
            <StepIndicator />

            {/* Progress Info */}
            <View style={styles.progressInfo}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={Colors.gradient1}
              />
              <Text style={styles.progressText}>
                {step === 1
                  ? 'Step 1 of 2: Tell us about your job'
                  : 'Step 2 of 2: Finalize your job post'}
              </Text>
            </View>

            {/* Step 1: Job Details */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                {/* Job Title Card */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.serviceTypeIconBubble}>
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={20}
                        color={Colors.gradient1}
                      />
                    </View>
                    <Text style={styles.cardTitle}>Job Title</Text>
                  </View>
                  <InputField
                    placeholder="e.g., Garden Cleaning, Window Washing"
                    customStyle={styles.inputField}
                    value={jobTitle}
                    onChangeText={setJobTitle}
                  />
                  <Text style={styles.cardHint}>
                    Be specific to attract the right professionals
                  </Text>
                </View>

                {/* Description Card */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.serviceTypeIconBubble}>
                      <MaterialCommunityIcons
                        name="text-box-outline"
                        size={20}
                        color={Colors.gradient1}
                      />
                    </View>
                    <Text style={styles.cardTitle}>Job Description</Text>
                  </View>
                  <View style={styles.descriptionContainer}>
                    <TextInput
                      style={styles.descriptionInput}
                      placeholder="Describe what needs to be done..."
                      placeholderTextColor={Colors.placeholderColor}
                      multiline
                      numberOfLines={4}
                      maxLength={200}
                      value={Description}
                      onChangeText={setDescription}
                    />
                    <View style={styles.charCounter}>
                      <Text style={styles.charText}>
                        {Description.length}/200 characters
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Service Type Card */}
                <View style={[styles.card, styles.serviceTypeCard]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.serviceTypeIconBubble}>
                      <MaterialCommunityIcons
                        name="tools"
                        size={22}
                        color={Colors.gradient1}
                      />
                    </View>
                    <Text style={styles.cardTitle}>Service Type</Text>
                  </View>
                  <CustomDropDown
                    placeholder={selectedType || 'Select service type'}
                    data={serviceTypes}
                    placeholderColor={
                      selectedType
                        ? Colors.inputTextColor
                        : Colors.placeholderColor
                    }
                    setValue={handleSelectedItem}
                  />
                  {selectedService && (
                    <View style={styles.selectedService}>
                      <MaterialCommunityIcons
                        name={selectedService.icon}
                        size={18}
                        color={Colors.gradient1}
                      />
                      <Text style={styles.selectedServiceText}>
                        {selectedService.label}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Next Button removed — rendered in fixed bottom bar */}
              </View>
            )}

            {/* Step 2: Finalize Details */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                {/* Location Card */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.serviceTypeIconBubble}>
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color={Colors.gradient1}
                      />
                    </View>
                    <Text style={styles.cardTitle}>Location</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('Location', {location: true})
                    }
                    activeOpacity={0.7}
                    style={styles.locationButton}>
                    <View style={styles.locationContent}>
                      <Ionicons name="pin" size={20} color={Colors.gradient1} />
                      <Text
                        style={[
                          styles.locationText,
                          {
                            color:
                              userLocation?.name || Location
                                ? Colors.inputTextColor
                                : Colors.placeholderColor,
                          },
                        ]}>
                        {userLocation?.name || Location || 'Select location'}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={Colors.secondaryText}
                    />
                  </TouchableOpacity>
                </View>

                {/* Budget Card */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.serviceTypeIconBubble}>
                      <DollarIcon width={20} height={20} color={Colors.gradient1} />
                    </View>
                    <Text style={styles.cardTitle}>Budget</Text>
                  </View>

                  {/* Budget Type Tabs */}
                  <View style={styles.budgetTabs}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.budgetTab,
                        styles.budgetTabFlat,
                        budgetType === 'flat' && styles.budgetTabActive,
                      ]}
                      onPress={() => setBudgetType('flat')}>
                      <View style={[
                        styles.budgetTabIconBox,
                        budgetType === 'flat' && styles.budgetTabIconBoxActive,
                      ]}>
                        <DollarIcon
                          width={16}
                          height={16}
                          color={budgetType === 'flat' ? '#4D85FE' : '#9CA3AF'}
                        />
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.budgetTabText,
                          budgetType === 'flat' && styles.budgetTabTextActive,
                        ]}>
                        Flat Rate
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.budgetTab,
                        styles.budgetTabHourly,
                        budgetType === 'hourly' && styles.budgetTabActive,
                      ]}
                      onPress={() => setBudgetType('hourly')}>
                      <View style={[
                        styles.budgetTabIconBox,
                        budgetType === 'hourly' && styles.budgetTabIconBoxActive,
                      ]}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={16}
                          color={budgetType === 'hourly' ? '#4D85FE' : '#9CA3AF'}
                        />
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.budgetTabText,
                          budgetType === 'hourly' && styles.budgetTabTextActive,
                        ]}>
                        Hourly Rate
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.budgetTab,
                        styles.budgetTabSqft,
                        budgetType === 'sqft' && styles.budgetTabActive,
                      ]}
                      onPress={() => setBudgetType('sqft')}>
                      <View style={[
                        styles.budgetTabIconBox,
                        budgetType === 'sqft' && styles.budgetTabIconBoxActive,
                      ]}>
                        <SquareFeetIcon
                          width={16}
                          height={16}
                          color={budgetType === 'sqft' ? '#4D85FE' : '#9CA3AF'}
                        />
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.budgetTabText,
                          budgetType === 'sqft' && styles.budgetTabTextActive,
                        ]}>
                        Square Footage
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Flat Rate Fields */}
                  {budgetType === 'flat' && (
                    <View>
                      <Text style={styles.budgetFieldLabel}>Total Price</Text>
                      <InputField
                        placeholder="$"
                        customStyle={styles.budgetInput}
                        value={budget}
                        onChangeText={handleBudgetChange}
                        type={'numeric'}
                      />
                    </View>
                  )}

                  {/* Hourly Rate Fields */}
                  {budgetType === 'hourly' && (
                    <View>
                      <Text style={styles.budgetFieldLabel}>Rate per Hour</Text>
                      <View style={styles.budgetRow}>
                        <InputField
                          placeholder="$"
                          customStyle={styles.budgetInputHalf}
                          value={hourlyRate}
                          onChangeText={(text: string) => {
                            const numeric = text.replace(/[^0-9]/g, '').replace(/^0+/, '');
                            setHourlyRate(numeric ? `$${numeric}` : '');
                          }}
                          type={'numeric'}
                        />
                        <View style={styles.sqftInputWrapper}>
                          <TextInput
                            placeholder="0"
                            placeholderTextColor={Colors.placeholderColor}
                            style={styles.sqftTextInput}
                            value={hours}
                            onChangeText={(text: string) => {
                              const numeric = text.replace(/[^0-9]/g, '').replace(/^0+/, '');
                              setHours(numeric);
                            }}
                            keyboardType="numeric"
                          />
                          <Text style={styles.sqftSuffix}>Hours</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Square Footage Fields */}
                  {budgetType === 'sqft' && (
                    <View>
                      <Text style={styles.budgetFieldLabel}>Price per Sq Ft</Text>
                      <View style={styles.budgetRow}>
                        <InputField
                          placeholder="$"
                          customStyle={styles.budgetInputHalf}
                          value={pricePerSqFt}
                          onChangeText={(text: string) => {
                            const numeric = text.replace(/[^0-9]/g, '').replace(/^0+/, '');
                            setPricePerSqFt(numeric ? `$${numeric}` : '');
                          }}
                          type={'numeric'}
                        />
                        <View style={styles.sqftInputWrapper}>
                          <TextInput
                            placeholder="0"
                            placeholderTextColor={Colors.placeholderColor}
                            style={styles.sqftTextInput}
                            value={sqFt}
                            onChangeText={(text: string) => {
                              const numeric = text.replace(/[^0-9]/g, '').replace(/^0+/, '');
                              setSqFt(numeric);
                            }}
                            keyboardType="numeric"
                          />
                          <Text style={styles.sqftSuffix}>Sq Ft</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  <View style={styles.budgetHintRow}>
                    <Text style={styles.budgetHint}>
                      Total cost for the service{' '}
                      <Text style={styles.budgetHintAmount}>
                        {budgetType === 'flat'
                          ? (budget || '$0')
                          : budgetType === 'hourly'
                          ? `$${(parseInt(hourlyRate.replace(/[^0-9]/g, ''), 10) || 0) * (parseInt(hours, 10) || 0)}`
                          : `$${(parseInt(pricePerSqFt.replace(/[^0-9]/g, ''), 10) || 0) * (parseInt(sqFt, 10) || 0)}`}
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Schedule Card */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.serviceTypeIconBubble}>
                      <MaterialCommunityIcons
                        name="calendar-clock"
                        size={20}
                        color={Colors.gradient1}
                      />
                    </View>
                    <Text style={styles.cardTitle}>Schedule</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setOpen(true)}
                    style={styles.dateButton}>
                    <View style={styles.dateContent}>
                      <MaterialCommunityIcons
                        name="calendar-outline"
                        size={20}
                        color={Colors.gradient1}
                      />
                      <Text
                        style={[
                          styles.dateText,
                          {
                            color: formattedDate
                              ? Colors.inputTextColor
                              : Colors.placeholderColor,
                          },
                        ]}>
                        {formattedDate || 'Select date and time'}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={Colors.secondaryText}
                    />
                  </TouchableOpacity>
                  <Text style={styles.dateHint}>
                    When do you need this service completed?
                  </Text>
                </View>

                {/* Special Instructions Card */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.serviceTypeIconBubble}>
                      <MaterialCommunityIcons
                        name="message-text-outline"
                        size={20}
                        color={Colors.gradient1}
                      />
                    </View>
                    <Text style={styles.cardTitle}>Special Instructions</Text>
                  </View>
                  <View style={styles.remarksContainer}>
                    <TextInput
                      style={styles.remarksInput}
                      placeholder="Any additional requirements or notes..."
                      placeholderTextColor={Colors.placeholderColor}
                      multiline
                      numberOfLines={3}
                      maxLength={80}
                      value={remarks}
                      onChangeText={setRemarks}
                    />
                    <View style={styles.remarksCounter}>
                      <Text style={styles.remarksCharText}>
                        Optional • {remarks.length}/80 characters
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Job Summary</Text>
                  <View style={styles.summaryContent}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Service:</Text>
                      <Text style={styles.summaryValue}>
                        {selectedType || 'Not selected'}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Budget:</Text>
                      <Text style={styles.summaryValue}>
                        {budgetType === 'flat'
                          ? budget || 'Not set'
                          : budgetType === 'hourly'
                          ? hourlyRate && hours
                            ? `${hourlyRate}/hr × ${hours}hrs`
                            : 'Not set'
                          : pricePerSqFt && sqFt
                          ? `${pricePerSqFt}/sqft × ${sqFt}sqft`
                          : 'Not set'}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Due Date:</Text>
                      <Text style={styles.summaryValue}>
                        {formattedDate || 'Not set'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons removed — rendered in fixed bottom bar */}
              </View>
            )}

            <DatePicker
              modal
              open={open}
              date={date || new Date()}
              minimumDate={new Date()}
              mode="datetime"
              onConfirm={date => {
                setOpen(false);
                setDate(date);
              }}
              onCancel={() => {
                setOpen(false);
              }}
            />
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      {/* Fixed bottom action bar */}
      <View style={styles.bottomBar}>
          {step === 1 ? (
            <GradientButton
              title="Continue"
              style={styles.bottomBarButton}
              onPress={handleNext}
              loading={loading}
            />
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => setStep(1)}
                style={styles.backButtonSecondary}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <GradientButton
                title={jobId ? 'Update Job' : 'Post Job Now'}
                style={styles.postButton}
                onPress={postJob}
                loading={loading}
                disabled={loading}
                textStyle={{fontSize: RFPercentage(1.9)}}
              />
            </View>
          )}
      </View>
    </View>
  );
};

export default PostJob;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RFPercentage(2),
    paddingTop: Platform.OS === 'ios' ? RFPercentage(8) : RFPercentage(6),
    paddingBottom: RFPercentage(2),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.whiteOverlay20,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: RFPercentage(12),
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(2),
  },
  stepIndicatorContainer: {
    marginBottom: RFPercentage(2),
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
  },
  stepLabel: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    marginLeft: RFPercentage(0.8),
    marginRight: RFPercentage(1),
    // bottom:RFPercentage(1)
  },
  stepLine: {
    width: RFPercentage(13),
    height: 2,
    position: 'absolute',
    right: -RFPercentage(3),
    zIndex: -1,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueBg,
    padding: RFPercentage(1.5),
    borderRadius: 12,
    marginBottom: RFPercentage(2),
    gap: RFPercentage(1),
  },
  progressText: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: Colors.gradient1,
    flex: 1,
  },
  stepContainer: {
    marginBottom: RFPercentage(4),
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(2),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,

    borderBottomWidth: 2,
  },
  serviceTypeCard: {
    borderColor: '#9CA3AF1A',
    borderBottomWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(1),
  },
  serviceTypeIconBubble: {
    width: RFPercentage(3.5),
    height: RFPercentage(3.5),
    borderRadius: RFPercentage(1),
    backgroundColor: 'rgba(84, 137, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
  },
  inputField: {
    width: '100%',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    marginTop: 0,
    marginBottom: 0,
  },
  cardHint: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    marginTop: RFPercentage(1),
  },
  descriptionContainer: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    padding: RFPercentage(1.5),
  },
  descriptionInput: {
    color: Colors.inputTextColor,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontRegular,
    textAlignVertical: 'top',
    minHeight: RFPercentage(10),
    maxHeight: RFPercentage(15),
  },
  charCounter: {
    alignItems: 'flex-end',
    marginTop: RFPercentage(0.5),
  },
  charText: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
  },
  selectedService: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueBg,
    padding: RFPercentage(1),
    borderRadius: 8,
    marginTop: RFPercentage(1),
    gap: RFPercentage(0.8),
    alignSelf: 'flex-start',
  },
  selectedServiceText: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: Colors.gradient1,
  },
  continueButton: {
    marginTop: RFPercentage(2),
    width: '50%',
    alignSelf: 'center',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBg,
    padding: RFPercentage(1.5),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(1),
    flex: 1,
  },
  locationText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontRegular,
    flex: 1,
  },
  budgetContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: RFPercentage(1.5),
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: RFPercentage(1.8),
    color: Colors.placeholderColor,
    // marginRight: RFPercentage(0.5),
  },
  budgetInput: {
    width: '100%',
    height: RFPercentage(5.5),
    backgroundColor: Colors.inputBg,
    borderColor: Colors.inputBorder,
  },
  budgetHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFPercentage(1),
  },
  budgetHint: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
  },
  budgetHintAmount: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.semiBold,
    color: Colors.gradient1,
  },
  budgetTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: RFPercentage(1.5),
  },
  budgetTab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: RFPercentage(6.5),
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.6),
    borderRadius: RFPercentage(0.8),
    gap: RFPercentage(0.4),
    borderWidth: 1,
    borderColor: '#9CA3AF1A',
    backgroundColor: 'transparent',
  },
  budgetTabFlat: {
    flex: 1,
  },
  budgetTabHourly: {
    flex: 1,
    marginHorizontal: RFPercentage(0.6),
  },
  budgetTabSqft: {
    flex: 1,
  },
  budgetTabActive: {
    borderColor: '#4D85FE80',
    backgroundColor: '#4D85FE1A',
  },
  budgetTabIconBox: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    borderRadius: RFPercentage(0.8),
    backgroundColor: '#9CA3AF10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetTabIconBoxActive: {
    backgroundColor: '#4D85FE10',
  },
  budgetTabText: {
    fontSize: RFPercentage(1.34),
    lineHeight: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: '#9CA3AF',
    flexShrink: 1,
    textAlign: 'center',
    includeFontPadding: true,
  },
  budgetTabTextActive: {
    color: '#4D85FE',
  },
  budgetFieldLabel: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
    marginBottom: RFPercentage(0.8),
  },
  budgetRow: {
    flexDirection: 'row',
    gap: RFPercentage(1),
  },
  budgetInputHalf: {
    flex: 1,
    height: RFPercentage(5.5),
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  sqftInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: RFPercentage(5.5),
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: RFPercentage(1.3),
    backgroundColor: Colors.inputBg,
    paddingHorizontal: RFPercentage(1.5),
    marginVertical: RFPercentage(1),
  },
  sqftTextInput: {
    flex: 1,
    color: Colors.inputTextColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.8),
    paddingVertical: 0,
  },
  sqftSuffix: {
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBg,
    padding: RFPercentage(1.5),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(1),
    flex: 1,
  },
  dateText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontRegular,
    flex: 1,
  },
  dateHint: {
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    marginTop: RFPercentage(1),
  },
  remarksContainer: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    padding: RFPercentage(1.5),
  },
  remarksInput: {
    color: Colors.inputTextColor,
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontRegular,
    textAlignVertical: 'top',
    minHeight: RFPercentage(8),
  },
  remarksCounter: {
    alignItems: 'flex-end',
    marginTop: RFPercentage(0.5),
  },
  remarksCharText: {
    fontSize: RFPercentage(1.3),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
  },
  summaryCard: {
    backgroundColor: Colors.skyBlueBg,
    borderRadius: 16,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(2),
    borderWidth: 1,
    borderColor: Colors.skyBlue200,
  },
  summaryTitle: {
    fontSize: RFPercentage(1.9),
    fontFamily: Fonts.fontMedium,
    color: Colors.gradient1,
    marginBottom: RFPercentage(1.5),
  },
  summaryContent: {
    gap: RFPercentage(1),
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontMedium,
    color: Colors.primaryText,
    width: RFPercentage(10),
  },
  summaryValue: {
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    color: Colors.gradient1,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: RFPercentage(1.5),
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(1.5),
    paddingBottom: Platform.OS === 'ios' ? RFPercentage(4) : RFPercentage(2),
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrayBg,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomBarButton: {
    width: '75%',
    alignSelf: 'center',
    borderRadius: 20,
  },
  backButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    height: RFPercentage(5.6),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gradient1,
    flex: 0.7,
    gap: RFPercentage(0.5),
  },
  backButtonText: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.semiBold,
    color: Colors.gradient1,
  },
  postButton: {
    flex: 2,
    borderRadius: 20,
  },
});
