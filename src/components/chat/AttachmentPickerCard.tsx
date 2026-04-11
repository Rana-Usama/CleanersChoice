import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../constants/Themes';
import AttachmentOptionItem from './AttachmentOptionItem';
import GalleryIcon from '../../assets/svg/GalleryIcon';
import DocumentIcon from '../../assets/svg/DocumentIcon';

interface AttachmentPickerCardProps {
  visible: boolean;
  onClose: () => void;
  onPickImage: () => void;
  onPickDocument: () => void;
}

const SHEET_TRANSLATE = 350;
const ANIM_DURATION_IN = 280;
const ANIM_DURATION_OUT = 200;
const PICKER_DELAY = 300;

const AttachmentPickerCard: React.FC<AttachmentPickerCardProps> = ({
  visible,
  onClose,
  onPickImage,
  onPickDocument,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIM_DURATION_IN,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          damping: 22,
          stiffness: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isRendered) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIM_DURATION_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIM_DURATION_OUT,
          useNativeDriver: true,
        }),
      ]).start(({finished}) => {
        if (finished) setIsRendered(false);
      });
    }
  }, [visible]);

  const handleOption = (action: () => void) => {
    onClose();
    // Delay picker launch until close animation completes.
    // Fixes Android: Modal onDismiss only fires on iOS.
    setTimeout(action, PICKER_DELAY);
  };

  if (!isRendered) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_TRANSLATE, 0],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, {opacity: fadeAnim}]} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{translateY}],
            opacity: fadeAnim,
          },
        ]}>
        {/* Title */}
        <Text style={styles.title}>Share</Text>
        {/* Divider */}
        <View style={styles.divider} />
        {/* Options row */}
        <View style={styles.options}>
          <AttachmentOptionItem
            icon={<GalleryIcon width={52} height={52} />}
            label="Gallery"
            onPress={() => handleOption(onPickImage)}
          />
          <AttachmentOptionItem
            icon={<DocumentIcon width={52} height={52} />}
            label="Documents"
            onPress={() => handleOption(onPickDocument)}
          />
        </View>
        {/* Cancel button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.cancelButton}
          onPress={() => {
            onClose();
          }}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: RFPercentage(3),
    borderTopRightRadius: RFPercentage(3),
    paddingHorizontal: RFPercentage(4),
    paddingTop: RFPercentage(2),
    paddingBottom: RFPercentage(4),
  },
  title: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2.2),
    color: Colors.primaryText,
    textAlign: 'center',
    marginTop: RFPercentage(2),
    marginBottom: RFPercentage(1),
  },
  divider: {
    height: 1,
    backgroundColor: Colors.coolGray200,
  },
  options: {
    flexDirection: 'row',
    gap: RFPercentage(5),
    paddingVertical: RFPercentage(2.5),
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: RFPercentage(1.4),
    borderRadius: RFPercentage(1.5),
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.coolGray200,
  },
  cancelText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.9),
    color: Colors.primaryText,
  },
});

export default AttachmentPickerCard;
