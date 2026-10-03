import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useDispatch} from 'react-redux';
import {Colors, Fonts} from '../../../constants/Themes';
import GradientButton from '../../../components/GradientButton';
import CityStateField from '../../../components/CityStateField';
import {useExitAppOnBack} from '../../../utils/ExitApp';
import {showToast} from '../../../utils/ToastMessage';
import {resolveCleanerRouteAsync} from '../../../utils/cleanerRoute';
import {setProfileData} from '../../../redux/ProfileData/Actions';
import {parseCityStateFromAddress} from '../../../utils/locationFormat';
import {
  formatServiceAreaName,
  isValidPhone,
  isValidServiceArea,
  saveRequiredCleanerProfile,
  ServiceArea,
} from '../../../utils/cleanerProfile';

/**
 * Required business info: Service/Business name, phone, service city + state.
 *
 * Two modes:
 *  - `gate` (default) — routed here by resolveCleanerRoute for cleaners who
 *    signed up before these fields were required. Unskippable: no back button
 *    and hardware back exits the app, same as CleanerInstructions. On save the
 *    cleaner continues to wherever the router sends them next (paywall or
 *    dashboard).
 *  - `edit` — opened from the Dashboard / Setup Services to change the values.
 *    Has a back button and returns on save.
 *
 * New sign-ups never see the gate: SignUp collects the same three fields.
 */

type Mode = 'gate' | 'edit';

const formatPhoneNumber = (raw: string = ''): string => {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('1')) digits = digits.slice(1);
  if (digits.startsWith('0')) digits = digits.slice(1);
  digits = digits.slice(-10);
  if (digits.length < 10) return digits.length ? `+1-${digits}` : '';
  return `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

/**
 * Best-effort prefill from a legacy listing location (a full street address
 * with coordinates). Only used when the city/state can be read confidently —
 * otherwise the cleaner simply picks their city.
 */
const areaFromLegacyLocation = (location: any): ServiceArea | null => {
  if (!location) return null;
  if (isValidServiceArea(location)) {
    return {
      ...location,
      name: location.name || formatServiceAreaName(location.city, location.state),
    };
  }
  const lat = location.latitude;
  const lng = location.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  const {city, state} = location.city && location.state
    ? {city: location.city, state: location.state}
    : parseCityStateFromAddress(location.name);
  if (!city || !state) return null;
  return {
    name: formatServiceAreaName(city, state),
    city,
    state,
    latitude: lat,
    longitude: lng,
    placeId: null,
  };
};

const CompleteBusinessInfo = ({navigation, route}: any) => {
  const mode: Mode = route?.params?.mode === 'edit' ? 'edit' : 'gate';
  const isGate = mode === 'gate';
  const dispatch = useDispatch();

  const [userData, setUserData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceArea, setServiceArea] = useState<ServiceArea | null>(null);

  // Gate mode is mandatory — back must not slip past it.
  const ExitGuard = isGate ? GateBackGuard : NoopGuard;

  const load = useCallback(async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      const [userDoc, serviceDoc] = await Promise.all([
        firestore().collection('Users').doc(uid).get(),
        firestore().collection('CleanerServices').doc(uid).get(),
      ]);
      const user = userDoc.data() ?? null;
      const service = serviceDoc.exists ? serviceDoc.data() ?? null : null;
      setUserData(user);
      setName(user?.name ?? service?.name ?? '');
      setPhone(user?.phone ?? '');
      setServiceArea(
        areaFromLegacyLocation(user?.serviceLocation) ??
          areaFromLegacyLocation(service?.location),
      );
    } catch (error) {
      console.log('[CompleteBusinessInfo] load failed:', error);
      showToast({
        type: 'error',
        title: 'Could not load your profile',
        message: 'Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const errors = useMemo(
    () => ({
      name: name.trim() ? null : 'Service / business name is required',
      phone: isValidPhone(phone)
        ? null
        : phone
        ? 'Enter a valid US phone number (e.g. +1-321-659-6898)'
        : 'Phone number is required',
      serviceArea: isValidServiceArea(serviceArea)
        ? null
        : 'Select your service city from the list',
    }),
    [name, phone, serviceArea],
  );
  const isValid = !errors.name && !errors.phone && !errors.serviceArea;

  const handleSave = async () => {
    setSubmitted(true);
    if (!isValid || saving) return;
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    setSaving(true);
    try {
      const merged = await saveRequiredCleanerProfile({
        uid,
        name,
        phone,
        serviceArea: serviceArea as ServiceArea,
        user: userData,
      });
      dispatch(setProfileData(merged));

      if (isGate) {
        const next = await resolveCleanerRouteAsync();
        navigation.reset({index: 0, routes: [{name: next}]});
      } else {
        showToast({
          type: 'success',
          title: 'Business info updated',
          message: 'Your listing details have been saved.',
        });
        navigation.goBack();
      }
    } catch (error) {
      console.log('[CompleteBusinessInfo] save failed:', error);
      showToast({
        type: 'error',
        title: 'Could not save',
        message: 'Please check your connection and try again.',
      });
      setSaving(false);
    }
  };

  const showError = (key: keyof typeof errors) =>
    submitted && errors[key] ? (
      <Text style={styles.errorText}>{errors[key]}</Text>
    ) : null;

  return (
    <View style={styles.safeArea}>
      <ExitGuard />
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent
      />

      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        {isGate ? (
          <View style={styles.headerBadge}>
            <MaterialCommunityIcons
              name="storefront-outline"
              size={RFPercentage(2)}
              color={Colors.white}
            />
            <Text style={styles.headerBadgeText}>One last step</Text>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Go back">
            <MaterialIcons
              name="keyboard-backspace"
              size={RFPercentage(2.8)}
              color={Colors.white}
            />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {isGate ? 'Complete your business info' : 'Business info'}
        </Text>
        <Text style={styles.headerSubtitle}>
          Customers see these details on your listing. You’ll be visible to
          customers once this is complete and your membership is active.
        </Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.gradient1} />
        </View>
      ) : (
        <KeyboardAwareScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          extraScrollHeight={Platform.OS === 'ios' ? 24 : 12}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Service / Business Name</Text>
          <View
            style={[
              styles.inputContainer,
              submitted && errors.name && styles.inputError,
            ]}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Sparkle Home Cleaning"
              placeholderTextColor={Colors.placeholderColor}
              autoCapitalize="words"
              style={styles.inputText}
            />
          </View>
          {showError('name')}

          <Text style={[styles.label, styles.labelGap]}>Phone Number</Text>
          <View
            style={[
              styles.inputContainer,
              submitted && errors.phone && styles.inputError,
            ]}>
            <TextInput
              value={phone}
              onChangeText={text => setPhone(formatPhoneNumber(text))}
              placeholder="+1-321-659-6898"
              placeholderTextColor={Colors.placeholderColor}
              keyboardType="phone-pad"
              maxLength={15}
              style={styles.inputText}
            />
          </View>
          {showError('phone')}

          <Text style={[styles.label, styles.labelGap]}>Service Location</Text>
          <Text style={styles.hint}>
            The city you work in. Customers near this city will find you.
          </Text>
          <CityStateField
            value={serviceArea}
            onChange={setServiceArea}
            error={submitted ? errors.serviceArea : null}
            inputContainerStyle={styles.inputContainer}
            inputTextStyle={styles.inputText}
          />
        </KeyboardAwareScrollView>
      )}

      <View style={styles.footer}>
        <GradientButton
          title={isGate ? 'Save & Continue' : 'Save Changes'}
          onPress={handleSave}
          loading={saving}
          disabled={saving || loading}
          style={[
            styles.saveButton,
            (!isValid || loading) && styles.saveButtonDisabled,
          ]}
          textStyle={styles.saveButtonText}
        />
      </View>
    </View>
  );
};

/** Hooks can't be conditional, so the back-guard is a tiny component. */
const GateBackGuard = () => {
  useExitAppOnBack();
  return null;
};
const NoopGuard = () => null;

export default CompleteBusinessInfo;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: Colors.background},
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? RFPercentage(8) : RFPercentage(6),
    paddingHorizontal: RFPercentage(2.4),
    paddingBottom: RFPercentage(2.4),
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.whiteOverlay20,
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(2),
    gap: RFPercentage(0.6),
    marginBottom: RFPercentage(1.2),
  },
  headerBadgeText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.white,
  },
  backButton: {
    width: RFPercentage(4.6),
    height: RFPercentage(4.6),
    borderRadius: RFPercentage(2.3),
    backgroundColor: Colors.whiteOverlay20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFPercentage(1.2),
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.3),
    color: Colors.white,
  },
  headerSubtitle: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.55),
    lineHeight: RFPercentage(2.3),
    color: Colors.whiteOverlay90,
    marginTop: RFPercentage(0.6),
  },
  loader: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  body: {flex: 1},
  bodyContent: {
    paddingHorizontal: RFPercentage(2.4),
    paddingTop: RFPercentage(2.6),
    paddingBottom: RFPercentage(4),
  },
  label: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.75),
    color: Colors.gray800,
    marginBottom: RFPercentage(0.8),
    marginLeft: RFPercentage(0.45),
  },
  labelGap: {marginTop: RFPercentage(2.2)},
  hint: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
    marginTop: -RFPercentage(0.4),
    marginBottom: RFPercentage(0.9),
    marginLeft: RFPercentage(0.45),
  },
  inputContainer: {
    height: RFPercentage(7),
    borderWidth: RFPercentage(0.14),
    borderColor: Colors.gray200,
    borderRadius: RFPercentage(2.1),
    paddingHorizontal: RFPercentage(2.2),
    backgroundColor: Colors.white,
    justifyContent: 'center',
  },
  inputError: {borderColor: Colors.error},
  inputText: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.fontRegular,
    color: Colors.inputTextColor,
    paddingVertical: 0,
  },
  errorText: {
    color: Colors.error,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    marginTop: RFPercentage(0.55),
    marginLeft: RFPercentage(0.45),
  },
  footer: {
    paddingHorizontal: RFPercentage(2.4),
    paddingTop: RFPercentage(1.4),
    paddingBottom: Platform.OS === 'ios' ? RFPercentage(4) : RFPercentage(2.4),
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
    backgroundColor: Colors.white,
    alignItems:"center"
  },
  saveButton: {borderRadius: RFPercentage(2.1), width:"100%"},
  saveButtonDisabled: {opacity: 0.55,  width:"100%"},
  saveButtonText: {fontFamily: Fonts.semiBold},
});
