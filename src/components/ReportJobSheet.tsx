import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Keyboard,
  KeyboardEvent,
  LayoutAnimation,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts} from '../constants/Themes';
import GradientButton from './GradientButton';
import {
  REPORT_DETAILS_MAX,
  REPORT_REASONS,
  ReportReason,
} from '../types/report';

interface Props {
  visible: boolean;
  jobTitle?: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (opts: {reason: ReportReason; details: string}) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.8, RFPercentage(75));
/** Space always left above the sheet so it never touches the status bar. */
const TOP_GAP = RFPercentage(6);

/**
 * Bottom sheet for a cleaner to report a job / the customer who posted it.
 * Purely presentational — the caller owns submission (reportService).
 *
 * WHY THIS IS NOT A <Modal>: on Android a Modal is a separate Dialog window.
 * RN's Keyboard events are computed from the ACTIVITY window's insets
 * (ReactRootView.checkForKeyboardEvents), so they don't fire for an input
 * inside a Dialog, and with targetSdk 35+ (edge-to-edge enforced) the Dialog
 * isn't resized for the IME either — the details field ended up behind the
 * keyboard. Rendered in-tree instead (as an absolute overlay — the caller must
 * mount it as the LAST child of a full-screen root), Keyboard events are
 * reliable on both platforms.
 *
 * Keyboard offset = how far the keyboard actually overlaps this overlay
 * (overlay bottom − keyboard top), not the raw keyboard height. On devices
 * where the window IS resized (adjustResize, Android < 15) the overlay shrinks
 * and the overlap goes to 0, so the offset is never double-counted.
 */
const ReportJobSheet: React.FC<Props> = ({
  visible,
  jobTitle,
  loading,
  onClose,
  onSubmit,
}) => {
  const [mounted, setMounted] = useState(visible);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [overlayHeight, setOverlayHeight] = useState(SCREEN_HEIGHT);

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const overlayRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const keyboardTopRef = useRef<number | null>(null);
  const inputFocusedRef = useRef(false);
  const wasVisibleRef = useRef(visible);

  /* ---------------- open / close ---------------- */
  useEffect(() => {
    if (visible) {
      wasVisibleRef.current = true;
      setMounted(true);
      setReason(null);
      setDetails('');
      translateY.setValue(SHEET_HEIGHT);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }
    if (!wasVisibleRef.current) return;
    wasVisibleRef.current = false;
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({finished}) => {
      if (finished) setMounted(false);
    });
  }, [visible, translateY, backdropOpacity]);

  /* ---------------- Android back button ---------------- */
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!loading) onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, loading, onClose]);

  /* ---------------- keyboard ---------------- */
  const recomputeInset = useCallback(() => {
    const keyboardTop = keyboardTopRef.current;
    if (keyboardTop == null || !overlayRef.current) {
      setKeyboardInset(0);
      return;
    }
    overlayRef.current.measureInWindow((_x, y, _w, height) => {
      setKeyboardInset(Math.max(0, Math.round(y + height - keyboardTop)));
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const isIOS = Platform.OS === 'ios';
    const animate = (event?: KeyboardEvent) => {
      if (isIOS) {
        LayoutAnimation.configureNext(
          LayoutAnimation.create(event?.duration || 250, 'keyboard', 'opacity'),
        );
      }
    };
    const showSub = Keyboard.addListener(
      isIOS ? 'keyboardWillShow' : 'keyboardDidShow',
      event => {
        keyboardTopRef.current = event.endCoordinates.screenY;
        animate(event);
        recomputeInset();
      },
    );
    const hideSub = Keyboard.addListener(
      isIOS ? 'keyboardWillHide' : 'keyboardDidHide',
      event => {
        keyboardTopRef.current = null;
        animate(event);
        setKeyboardInset(0);
      },
    );
    return () => {
      showSub.remove();
      hideSub.remove();
      keyboardTopRef.current = null;
      setKeyboardInset(0);
    };
  }, [mounted, recomputeInset]);

  // Keep the focused field in view once the sheet has moved above the keyboard.
  useEffect(() => {
    if (keyboardInset > 0 && inputFocusedRef.current) {
      const timer = setTimeout(
        () => scrollRef.current?.scrollToEnd({animated: true}),
        50,
      );
      return () => clearTimeout(timer);
    }
  }, [keyboardInset]);

  const handleOverlayLayout = (event: LayoutChangeEvent) => {
    setOverlayHeight(event.nativeEvent.layout.height);
    // A late window resize (adjustResize) changes the overlap — re-measure.
    if (keyboardTopRef.current != null) recomputeInset();
  };

  /* ---------------- form ---------------- */
  const detailsRequired = reason === 'other';
  const canSubmit =
    !!reason && (!detailsRequired || details.trim().length > 0) && !loading;

  const handleSubmit = () => {
    if (!canSubmit || !reason) return;
    Keyboard.dismiss();
    onSubmit({reason, details: details.trim()});
  };

  if (!mounted) return null;

  const sheetMaxHeight = Math.max(
    RFPercentage(30),
    overlayHeight - keyboardInset - TOP_GAP,
  );

  return (
    <View
      ref={overlayRef}
      style={styles.overlay}
      onLayout={handleOverlayLayout}>
      <TouchableWithoutFeedback onPress={loading ? undefined : onClose}>
        <Animated.View
          style={[styles.backdrop, {opacity: backdropOpacity}]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        accessibilityViewIsModal
        style={[
          styles.sheet,
          {
            maxHeight: sheetMaxHeight,
            marginBottom: keyboardInset,
            transform: [{translateY}],
          },
        ]}>
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather
              name="flag"
              size={RFPercentage(2)}
              color={Colors.dangerRed}
            />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.title}>Report this job</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {jobTitle || 'Tell us what went wrong'}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close"
            activeOpacity={0.7}
            onPress={onClose}
            disabled={loading}
            style={styles.closeBtn}>
            <Feather
              name="x"
              size={RFPercentage(2.4)}
              color={Colors.secondaryText}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <Text style={styles.fieldLabel}>What's the problem?</Text>
          <View style={styles.reasons}>
            {REPORT_REASONS.map(option => {
              const active = reason === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  accessibilityRole="radio"
                  accessibilityState={{selected: active}}
                  activeOpacity={0.85}
                  disabled={loading}
                  onPress={() => setReason(option.key)}
                  style={[styles.reasonRow, active && styles.reasonRowActive]}>
                  <MaterialCommunityIcons
                    name={active ? 'radiobox-marked' : 'radiobox-blank'}
                    size={RFPercentage(2.4)}
                    color={active ? Colors.gradient1 : Colors.secondaryText}
                  />
                  <Text
                    style={[
                      styles.reasonText,
                      active && styles.reasonTextActive,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>
            {detailsRequired ? 'Details' : 'Details (optional)'}
          </Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Add anything that helps us look into this"
              placeholderTextColor={Colors.placeholderColor}
              value={details}
              onChangeText={setDetails}
              onFocus={() => {
                inputFocusedRef.current = true;
              }}
              onBlur={() => {
                inputFocusedRef.current = false;
              }}
              editable={!loading}
              multiline
              maxLength={REPORT_DETAILS_MAX}
              textAlignVertical="top"
            />
          </View>
          <Text style={styles.helper}>
            Our team reviews every report. Accounts found to be fake or
            misleading are removed.
          </Text>
        </ScrollView>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.8}
            onPress={onClose}
            disabled={loading}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <GradientButton
            title="Submit Report"
            onPress={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
            style={[
              styles.submitBtn,
              !canSubmit && !loading && styles.submitDisabled,
            ]}
            textStyle={styles.submitText}
          />
        </View>
      </Animated.View>
    </View>
  );
};

export default ReportJobSheet;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    // Above the screen's own elevated views (e.g. JobDetails' action bar).
    zIndex: 1000,
    elevation: 1000,
  },
  body: {
    flexGrow: 0,
    flexShrink: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.blackOverlay50,
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: RFPercentage(3),
    borderTopRightRadius: RFPercentage(3),
    paddingHorizontal: RFPercentage(2.2),
    paddingBottom: Platform.OS === 'ios' ? RFPercentage(3) : RFPercentage(1.5),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: RFPercentage(1.2),
    paddingBottom: RFPercentage(0.5),
  },
  handle: {
    width: RFPercentage(5),
    height: RFPercentage(0.5),
    borderRadius: RFPercentage(0.5),
    backgroundColor: Colors.gray300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(1.6),
    gap: RFPercentage(1),
  },
  headerIcon: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    backgroundColor: Colors.redBg50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.1),
    color: Colors.primaryText,
  },
  subtitle: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
    marginTop: 2,
  },
  closeBtn: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
    marginBottom: RFPercentage(0.7),
  },
  reasons: {
    gap: RFPercentage(0.8),
    marginBottom: RFPercentage(1.8),
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(1),
    paddingHorizontal: RFPercentage(1.4),
    paddingVertical: RFPercentage(1.3),
    borderRadius: RFPercentage(1.2),
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
  },
  reasonRowActive: {
    borderColor: Colors.gradient1,
    backgroundColor: Colors.primaryBlueOverlay10,
  },
  reasonText: {
    flex: 1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.65),
    color: Colors.primaryText,
  },
  reasonTextActive: {
    color: Colors.gradient1,
  },
  inputWrap: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: RFPercentage(1.2),
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1),
  },
  input: {
    minHeight: RFPercentage(10),
    maxHeight: RFPercentage(16),
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    color: Colors.inputTextColor,
    padding: 0,
  },
  helper: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.35),
    color: Colors.secondaryText,
    marginTop: RFPercentage(0.8),
    marginBottom: RFPercentage(1.6),
    lineHeight: RFPercentage(2),
  },
  actionRow: {
    flexDirection: 'row',
    gap: RFPercentage(1.2),
  },
  cancelBtn: {
    flex: 1.2,
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.5),
    borderWidth: 1.5,
    borderColor: Colors.gradient1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  cancelText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.gradient1,
  },
  submitBtn: {
    flex: 2.4,
    width: undefined,
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.5),
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
  },
});
