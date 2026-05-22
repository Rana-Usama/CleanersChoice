import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  visible: boolean;
  message: string;
  durationMs?: number;
  onUndo: () => void;
  onTimeout: () => void;
}

const DEFAULT_DURATION = 5000;

const UndoSnackbar: React.FC<Props> = ({
  visible,
  message,
  durationMs = DEFAULT_DURATION,
  onUndo,
  onTimeout,
}) => {
  const slide = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: 40,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Slide up + fade in
    progress.setValue(1);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
      }),
    ]).start();

    // Progress countdown
    Animated.timing(progress, {
      toValue: 0,
      duration: durationMs,
      useNativeDriver: false,
    }).start();

    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, durationMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visible, durationMs, onTimeout, opacity, slide, progress]);

  if (!visible) return null;

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          opacity,
          transform: [{translateY: slide}],
        },
      ]}>
      <View style={styles.container}>
        <View style={styles.row}>
          <MaterialCommunityIcons
            name="check-circle"
            size={RFPercentage(2.2)}
            color={Colors.green500}
          />
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onUndo}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            style={styles.undoBtn}>
            <Text style={styles.undoText}>UNDO</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressBar, {width: progressWidth}]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

export default UndoSnackbar;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: RFPercentage(2),
    right: RFPercentage(2),
    bottom: RFPercentage(11),
    zIndex: 999,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(1.4),
    borderWidth: 1,
    borderColor: Colors.blueBorderOverlay50,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(1.6),
    paddingVertical: RFPercentage(1.3),
    gap: RFPercentage(1),
  },
  message: {
    flex: 1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.primaryText,
  },
  undoBtn: {
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.4),
  },
  undoText: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.5),
    color: Colors.gradient1,
    letterSpacing: 1,
  },
  progressTrack: {
    height: RFPercentage(0.3),
    backgroundColor: Colors.lightGrayBg,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.gradient1,
  },
});
