import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts} from '../constants/Themes';
import GradientButton from './GradientButton';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.42, RFPercentage(42));

/**
 * Shown in place of a silent failure whenever react-native-image-crop-picker
 * rejects with E_NO_LIBRARY_PERMISSION — i.e. gallery/photo access was
 * previously denied and the user tapped the image picker again. Same UI on
 * iOS and Android since both platforms surface that denial as the identical
 * error code (see utils/imagePickerErrors.ts).
 */
const GalleryPermissionSheet: React.FC<Props> = ({visible, onClose}) => {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const handleAllowAccess = () => {
    Linking.openSettings();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheet, {transform: [{translateY}]}]}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <MaterialCommunityIcons
                name="image-off-outline"
                size={RFPercentage(2.8)}
                color={Colors.gradient1}
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeBtn}>
              <Feather
                name="x"
                size={RFPercentage(2.4)}
                color={Colors.secondaryText}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Photo Access Needed</Text>
          <Text style={styles.message}>
            Gallery access is required to upload images.
          </Text>
          <Text style={styles.subtitle}>
            We only use this to let you attach photos for your services,
            profile, and documents — enable it in Settings to continue.
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.notNowBtn}
              activeOpacity={0.8}
              onPress={onClose}>
              <Text style={styles.notNowText}>Not Now</Text>
            </TouchableOpacity>
            <GradientButton
              title="Allow Access"
              onPress={handleAllowAccess}
              style={styles.allowBtn}
              textStyle={styles.allowText}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default GalleryPermissionSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
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
    paddingBottom: Platform.OS === 'ios' ? RFPercentage(3) : RFPercentage(1.8),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: RFPercentage(1),
  },
  iconBadge: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(3),
    backgroundColor: Colors.primaryBlueOverlay10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.2),
    color: Colors.primaryText,
    marginTop: RFPercentage(1.6),
  },
  message: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.primaryText,
    marginTop: RFPercentage(0.8),
    lineHeight: RFPercentage(2.2),
  },
  subtitle: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
    marginTop: RFPercentage(0.6),
    lineHeight: RFPercentage(2),
  },
  actionRow: {
    gap: RFPercentage(1.2),
    marginTop: RFPercentage(2.4),
    width:"90%",
    alignSelf:"center", 
    alignItems:"center"
  },
  notNowBtn: {
    flex: 1,
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.5),
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  notNowText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.secondaryText,
  },
  allowBtn: {
    flex: 1,
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.5),
    marginTop:RFPercentage(1)
  },
  allowText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.semiBold,
  },
});
