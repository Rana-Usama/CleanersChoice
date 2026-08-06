import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  BackHandler,
  Image,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Video, {VideoRef} from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts, FontScaling} from '../constants/Themes';

/**
 * Minimal structural types for the react-native-video callbacks.
 * Declared locally rather than imported so a minor version bump in the
 * library's exported type names can't break the build.
 */
type VideoLoadData = {
  duration: number;
  naturalSize?: {width: number; height: number; orientation?: string};
};

type VideoProgressData = {
  currentTime: number;
  playableDuration: number;
};

/** Seconds jumped by the rewind / fast-forward controls. */
const SKIP_SECONDS = 10;

/** Keeps the final seek just short of the end so it doesn't trigger onEnd. */
const END_EPSILON = 0.25;

const THUMB_SIZE = RFPercentage(1.7);

interface Props {
  videoUrl: string;
  posterUrl?: string;
  /**
   * Container hint for AVFoundation. Required for extension-less URLs —
   * Firebase Storage download URLs end in `?alt=media&token=...`, so iOS
   * cannot infer the container and fails with AVFoundation -11800 / -12746
   * unless this is supplied.
   */
  videoType?: string;
  /**
   * iOS audio-session behaviour for the hardware mute switch.
   * 'ignore' plays audio even when the ringer switch is silenced, which is what
   * production wants. Set to 'inherit' when debugging simulator playback —
   * the Simulator's audio session can fail to activate and take the whole
   * asset down with a generic AVFoundation -11800.
   */
  ignoreSilentSwitch?: 'ignore' | 'obey' | 'inherit';
  /** Label for the dismiss control. "Skip" on first run, "Close" on replay. */
  dismissLabel?: string;
  /** Start muted. First-run auto-play should stay unmuted — it's a pitch. */
  startMuted?: boolean;
  /** Fired when the video plays to the end. */
  onComplete: () => void;
  /** Fired when the cleaner dismisses early, or the video can't be played. */
  onDismiss: () => void;
}

const IntroVideoPlayer: React.FC<Props> = ({
  videoUrl,
  posterUrl,
  videoType = 'mp4',
  ignoreSilentSwitch = 'ignore',
  dismissLabel = 'Skip',
  startMuted = false,
  onComplete,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const videoRef = useRef<VideoRef>(null);

  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(startMuted);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  // Scrub state. While the user is dragging, the bar reflects the drag position
  // rather than onProgress — otherwise playback updates fight the gesture.
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const endedRef = useRef(false);

  /**
   * Refs mirroring state, because the PanResponder is created once and its
   * closures would otherwise capture stale values.
   */
  const durationRef = useRef(0);
  const trackWidthRef = useRef(0);
  const currentTimeRef = useRef(0);
  const pausedRef = useRef(false);
  const resumeAfterScrubRef = useRef(false);
  /** Page-x of the track's left edge, derived on gesture start. */
  const trackOriginRef = useRef(0);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Android hardware back behaves as dismiss rather than trapping the user.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onDismiss();
        return true;
      },
    );
    return () => subscription.remove();
  }, [onDismiss]);

  // Pause when the app is backgrounded so audio never plays off-screen.
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state !== 'active') {
        setPaused(true);
      }
    };
    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, []);

  const clampTime = useCallback((seconds: number) => {
    const total = durationRef.current;
    if (total <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(seconds, Math.max(total - END_EPSILON, 0)));
  }, []);

  const seekTo = useCallback(
    (seconds: number) => {
      const target = clampTime(seconds);
      // Seeking backwards after the video finished should allow replay.
      if (endedRef.current && target < durationRef.current - END_EPSILON) {
        endedRef.current = false;
      }
      videoRef.current?.seek(target);
      setCurrentTime(target);
      currentTimeRef.current = target;
    },
    [clampTime],
  );

  const skipBy = useCallback(
    (delta: number) => {
      if (!ready || durationRef.current <= 0) {
        return;
      }
      seekTo(currentTimeRef.current + delta);
    },
    [ready, seekTo],
  );

  const timeFromPageX = useCallback((pageX: number) => {
    const width = trackWidthRef.current;
    if (width <= 0 || durationRef.current <= 0) {
      return 0;
    }
    const ratio = (pageX - trackOriginRef.current) / width;
    return Math.max(0, Math.min(ratio, 1)) * durationRef.current;
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Claim the gesture so the parent Pressable's tap-to-pause doesn't fire.
        onStartShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: evt => {
          if (durationRef.current <= 0) {
            return;
          }
          // Derive the track's left edge from this touch, so we never need a
          // separate measure() call and stay correct after layout changes.
          trackOriginRef.current =
            evt.nativeEvent.pageX - evt.nativeEvent.locationX;

          resumeAfterScrubRef.current = !pausedRef.current;
          setPaused(true);
          setIsScrubbing(true);
          setScrubTime(timeFromPageX(evt.nativeEvent.pageX));
        },

        onPanResponderMove: (_evt, gesture) => {
          if (durationRef.current <= 0) {
            return;
          }
          setScrubTime(timeFromPageX(gesture.moveX));
        },

        onPanResponderRelease: (_evt, gesture) => {
          if (durationRef.current <= 0) {
            setIsScrubbing(false);
            return;
          }
          // moveX is 0 for a tap with no movement — fall back to the start x.
          const pageX = gesture.moveX || gesture.x0;
          seekTo(timeFromPageX(pageX));
          setIsScrubbing(false);
          if (resumeAfterScrubRef.current) {
            setPaused(false);
          }
        },

        onPanResponderTerminate: () => {
          setIsScrubbing(false);
          if (resumeAfterScrubRef.current) {
            setPaused(false);
          }
        },
      }),
    [seekTo, timeFromPageX],
  );

  const handleTrackLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    trackWidthRef.current = width;
    setTrackWidth(width);
  }, []);

  const handleLoad = useCallback((data: VideoLoadData) => {
    const total = data?.duration ?? 0;
    setDuration(total);
    durationRef.current = total;
    setReady(true);
    setFailed(false);
  }, []);

  const handleProgress = useCallback(
    (data: VideoProgressData) => {
      // Ignore playback updates mid-drag so they don't yank the thumb back.
      if (isScrubbing) {
        return;
      }
      setCurrentTime(data?.currentTime ?? 0);
    },
    [isScrubbing],
  );

  const handleEnd = useCallback(() => {
    if (endedRef.current) {
      return;
    }
    endedRef.current = true;
    setPaused(true);
    onComplete();
  }, [onComplete]);

  const handleError = useCallback(
    (error: any) => {
      const nativeCode = error?.error?.code;
      const nativeReason = error?.error?.localizedFailureReason;

      console.log(
        '[IntroVideoPlayer] playback error',
        nativeCode ? `(code ${nativeCode})` : '',
        nativeReason ?? '',
      );
      console.log('[IntroVideoPlayer] source uri:', videoUrl);
      console.log('[IntroVideoPlayer] source type hint:', videoType);
      console.log('[IntroVideoPlayer] raw error:', error);

      setFailed(true);
      setReady(false);
    },
    [videoUrl, videoType],
  );

  const handleRetry = useCallback(() => {
    setFailed(false);
    setReady(false);
    setCurrentTime(0);
    setPaused(false);
    setIsScrubbing(false);
    endedRef.current = false;
    setRetryKey(key => key + 1);
  }, []);

  const displayTime = isScrubbing ? scrubTime : currentTime;
  const progress = duration > 0 ? Math.min(displayTime / duration, 1) : 0;

  const formatTime = (seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (failed) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.black} />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconCircle}>
            <Feather
              name="wifi-off"
              size={RFPercentage(3.4)}
              color={Colors.white}
            />
          </View>
          <Text
            style={styles.errorTitle}
            maxFontSizeMultiplier={FontScaling.maxMultiplier}>
            Couldn't load the video
          </Text>
          <Text
            style={styles.errorSubtitle}
            maxFontSizeMultiplier={FontScaling.maxMultiplier}>
            Check your connection and try again — you can also watch it later
            from Settings.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleRetry}
            style={styles.retryButtonWrapper}>
            <LinearGradient
              colors={[Colors.gradient1, Colors.gradient2]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.retryButton}>
              <Feather
                name="refresh-cw"
                size={RFPercentage(2)}
                color={Colors.white}
              />
              <Text
                style={styles.retryText}
                maxFontSizeMultiplier={FontScaling.maxMultiplier}>
                Try Again
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={onDismiss}>
            <Text
              style={styles.errorDismiss}
              maxFontSizeMultiplier={FontScaling.maxMultiplier}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />

      <Pressable
        style={styles.videoPressable}
        onPress={() => setPaused(prev => !prev)}>
        <Video
          key={retryKey}
          ref={videoRef}
          // `type` is required for extension-less URLs (Firebase Storage
          // download URLs end in a query string) — without it iOS cannot pick
          // a demuxer and throws AVFoundation -11800 / -12746.
          source={{uri: videoUrl, type: videoType}}
          style={styles.video}
          resizeMode="contain"
          paused={paused}
          muted={muted}
          repeat={false}
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch={ignoreSilentSwitch}
          progressUpdateInterval={250}
          onLoadStart={() => console.log('[IntroVideoPlayer] load start')}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onEnd={handleEnd}
          onError={handleError}
        />

        {/* Poster holds the frame until the first video frame is decoded,
            preventing a black flash on slower devices. */}
        {!ready && posterUrl ? (
          <Image
            source={{uri: posterUrl}}
            style={styles.poster}
            resizeMode="contain"
          />
        ) : null}

        {!ready ? (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color={Colors.white} />
          </View>
        ) : null}

        {/* Center play affordance while paused (hidden mid-scrub) */}
        {ready && paused && !isScrubbing ? (
          <View style={styles.centerPlayOverlay} pointerEvents="none">
            <View style={styles.centerPlayCircle}>
              <MaterialCommunityIcons
                name="play"
                size={RFPercentage(4.5)}
                color={Colors.white}
              />
            </View>
          </View>
        ) : null}
      </Pressable>

      {/* Dismiss control */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onDismiss}
        hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
        style={[styles.dismissButton, {top: insets.top + RFPercentage(1.2)}]}>
        <Text
          style={styles.dismissText}
          maxFontSizeMultiplier={FontScaling.maxMultiplier}>
          {dismissLabel}
        </Text>
        <Feather
          name="chevron-right"
          size={RFPercentage(1.9)}
          color={Colors.white}
        />
      </TouchableOpacity>

      {/* Bottom control bar */}
      <View
        style={[
          styles.bottomBar,
          {paddingBottom: insets.bottom + RFPercentage(1.6)},
        ]}>
        {/* Scrubbable timeline */}
        <View style={styles.progressRow}>
          <Text
            style={styles.timeText}
            maxFontSizeMultiplier={FontScaling.maxMultiplier}>
            {formatTime(displayTime)}
          </Text>

          <View
            style={styles.trackTouchArea}
            onLayout={handleTrackLayout}
            {...panResponder.panHandlers}>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={[Colors.gradient1, Colors.gradient2]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={[styles.progressFill, {width: `${progress * 100}%`}]}
              />
            </View>

            {/* Thumb — grows slightly while dragging for feedback */}
            <View
              pointerEvents="none"
              style={[
                styles.thumb,
                {
                  left: Math.max(
                    0,
                    progress * trackWidth - THUMB_SIZE / 2,
                  ),
                  transform: [{scale: isScrubbing ? 1.5 : 1}],
                },
              ]}
            />
          </View>

          <Text
            style={styles.timeText}
            maxFontSizeMultiplier={FontScaling.maxMultiplier}>
            {formatTime(Math.max(duration - displayTime, 0))}
          </Text>
        </View>

        {/* Playback controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setMuted(prev => !prev)}
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
            style={styles.sideButton}>
            <Feather
              name={muted ? 'volume-x' : 'volume-2'}
              size={RFPercentage(2.1)}
              color={Colors.white}
            />
          </TouchableOpacity>

          <View style={styles.centerControls}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!ready}
              onPress={() => skipBy(-SKIP_SECONDS)}
              hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
              style={styles.skipButton}>
              <MaterialCommunityIcons
                name="rewind-10"
                size={RFPercentage(2.8)}
                color={ready ? Colors.white : Colors.whiteOverlay40}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!ready}
              onPress={() => setPaused(prev => !prev)}
              hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
              style={styles.playPauseButton}>
              <MaterialCommunityIcons
                name={paused ? 'play' : 'pause'}
                size={RFPercentage(3)}
                color={Colors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!ready}
              onPress={() => skipBy(SKIP_SECONDS)}
              hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
              style={styles.skipButton}>
              <MaterialCommunityIcons
                name="fast-forward-10"
                size={RFPercentage(2.8)}
                color={ready ? Colors.white : Colors.whiteOverlay40}
              />
            </TouchableOpacity>
          </View>

          {/* Spacer keeps the center controls optically centered */}
          <View style={styles.sideButton} />
        </View>
      </View>
    </View>
  );
};

export default IntroVideoPlayer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  videoPressable: {
    flex: 1,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlayCircle: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
    backgroundColor: Colors.blackOverlay50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.whiteOverlay30,
  },
  dismissButton: {
    position: 'absolute',
    right: RFPercentage(2),
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.4),
    paddingVertical: RFPercentage(0.8),
    paddingLeft: RFPercentage(1.8),
    paddingRight: RFPercentage(1.2),
    borderRadius: RFPercentage(3),
    backgroundColor: Colors.blackOverlay60,
    borderWidth: 1,
    borderColor: Colors.whiteOverlay20,
  },
  dismissText: {
    color: Colors.white,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.7),
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(1.6),
    backgroundColor: Colors.blackOverlay40,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(1.2),
  },
  /**
   * Generous vertical padding gives the thin visual track a comfortable touch
   * target without changing how it looks.
   */
  trackTouchArea: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: RFPercentage(1.6),
  },
  progressTrack: {
    height: RFPercentage(0.5),
    borderRadius: RFPercentage(0.25),
    backgroundColor: Colors.whiteOverlay30,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RFPercentage(0.25),
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.white,
  },
  timeText: {
    color: Colors.white,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    minWidth: RFPercentage(4.5),
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: RFPercentage(0.4),
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(2.4),
  },
  sideButton: {
    width: RFPercentage(4.4),
    height: RFPercentage(4.4),
    borderRadius: RFPercentage(2.2),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.whiteOverlay15,
  },
  skipButton: {
    width: RFPercentage(4.4),
    height: RFPercentage(4.4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    width: RFPercentage(5.4),
    height: RFPercentage(5.4),
    borderRadius: RFPercentage(2.7),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.whiteOverlay15,
    borderWidth: 1,
    borderColor: Colors.whiteOverlay20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: RFPercentage(4),
  },
  errorIconCircle: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.whiteOverlay15,
    marginBottom: RFPercentage(2.5),
  },
  errorTitle: {
    color: Colors.white,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.2),
    textAlign: 'center',
    marginBottom: RFPercentage(1),
  },
  errorSubtitle: {
    color: Colors.whiteOverlay70,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    textAlign: 'center',
    lineHeight: RFPercentage(2.6),
    marginBottom: RFPercentage(3),
  },
  retryButtonWrapper: {
    width: '100%',
    marginBottom: RFPercentage(2),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RFPercentage(1),
    paddingVertical: RFPercentage(1.8),
    borderRadius: RFPercentage(1.4),
  },
  retryText: {
    color: Colors.white,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
  },
  errorDismiss: {
    color: Colors.whiteOverlay70,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
    paddingVertical: RFPercentage(1),
    textDecorationLine: Platform.OS === 'ios' ? 'none' : 'underline',
  },
});
