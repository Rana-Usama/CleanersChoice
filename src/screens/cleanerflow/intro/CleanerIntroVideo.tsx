import React from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Feather from 'react-native-vector-icons/Feather';
import IntroVideoPlayer from '../../../components/IntroVideoPlayer';
import {useCleanerIntroConfig} from '../../../hooks/useCleanerIntroVideo';
import {Colors, Fonts, FontScaling} from '../../../constants/Themes';

/**
 * On-demand replay of the Cleaner intro video (Settings -> Watch Intro Video).
 *
 * Deliberately does NOT touch the `introVideoSeen` flag — a replay is not a
 * first view, and re-marking it would corrupt the completed/skipped signal.
 */
const CleanerIntroVideo = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {config, loading, unavailable, reload} = useCleanerIntroConfig();

  const close = () => navigation.goBack();

  if (loading) {
    return (
      <View style={styles.stateContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.black} />
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  if (unavailable || !config) {
    return (
      <View style={styles.stateContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.black} />

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={close}
          style={[styles.closeButton, {top: insets.top + RFPercentage(1.2)}]}>
          <Feather name="x" size={RFPercentage(2.4)} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.emptyContent}>
          <View style={styles.emptyIconCircle}>
            <Feather
              name="video-off"
              size={RFPercentage(3.4)}
              color={Colors.white}
            />
          </View>
          <Text
            style={styles.emptyTitle}
            maxFontSizeMultiplier={FontScaling.maxMultiplier}>
            Video unavailable
          </Text>
          <Text
            style={styles.emptySubtitle}
            maxFontSizeMultiplier={FontScaling.maxMultiplier}>
            The intro video isn't available right now. Please check your
            connection and try again.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={reload}
            style={styles.retryButton}>
            <Feather
              name="refresh-cw"
              size={RFPercentage(1.9)}
              color={Colors.white}
            />
            <Text
              style={styles.retryText}
              maxFontSizeMultiplier={FontScaling.maxMultiplier}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <IntroVideoPlayer
      videoUrl={config.videoUrl}
      posterUrl={config.posterUrl}
      dismissLabel="Close"
      startMuted={false}
      onComplete={close}
      onDismiss={close}
    />
  );
};

export default CleanerIntroVideo;

const styles = StyleSheet.create({
  stateContainer: {
    flex: 1,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: RFPercentage(2),
    width: RFPercentage(4.6),
    height: RFPercentage(4.6),
    borderRadius: RFPercentage(2.3),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.whiteOverlay15,
  },
  emptyContent: {
    alignItems: 'center',
    paddingHorizontal: RFPercentage(4),
  },
  emptyIconCircle: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.whiteOverlay15,
    marginBottom: RFPercentage(2.5),
  },
  emptyTitle: {
    color: Colors.white,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.2),
    textAlign: 'center',
    marginBottom: RFPercentage(1),
  },
  emptySubtitle: {
    color: Colors.whiteOverlay70,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    textAlign: 'center',
    lineHeight: RFPercentage(2.6),
    marginBottom: RFPercentage(3),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RFPercentage(1),
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(3),
    borderRadius: RFPercentage(1.4),
    backgroundColor: Colors.whiteOverlay15,
  },
  retryText: {
    color: Colors.white,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
  },
});
