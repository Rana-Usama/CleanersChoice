import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Image,
  ImageResizeMode,
  ImageSourcePropType,
  ImageStyle,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {Colors} from '../constants/Themes';
import {
  getCachedImageUri,
  getMemoryCachedUri,
  invalidateCachedImage,
  isRemoteUrl,
} from '../utils/imageCache';

/**
 * Drop-in replacement for `<Image>` for remote images.
 *
 * Adds four things the stock component doesn't give us:
 *  - a persistent disk cache (see `utils/imageCache`), so an image downloads
 *    once and afterwards renders instantly on every later mount;
 *  - `fallbackSource`, drawn underneath from the very first frame and revealed
 *    whenever there is nothing better to show — no image on the record, still
 *    downloading, or every retry failed. An avatar therefore never leaves an
 *    empty hole where a face should be;
 *  - a shimmering placeholder (when no `fallbackSource` is given) that occupies
 *    the exact final layout;
 *  - bounded retries — a single dropped request used to leave a permanently
 *    blank image until the user backed out and re-entered the screen.
 *
 * Local `require`d assets and `file://` URIs bypass the network path entirely
 * and are drawn immediately, so this is safe for a source that may be either.
 *
 * Layout note: `style` is applied to a wrapper `View` and the image fills it
 * absolutely, so the style must define the box (width/height, or flex from a
 * sized parent). Every call site in this app already does. Styles that rely on
 * the image's intrinsic size, or on `tintColor`, should keep using `<Image>`.
 */

const MAX_RETRIES = 2;
const FADE_DURATION_MS = 150;

/**
 * Values that are technically strings but mean "no image". Firestore records
 * written from an empty picker end up with some of these, and passing one to
 * `<Image>` renders nothing at all rather than falling back.
 */
const EMPTY_URI_VALUES = new Set(['', 'null', 'undefined', 'false', 'nan']);

type SourceLike =
  | ImageSourcePropType
  | {uri?: string | null}
  | string
  | null
  | undefined;

interface CachedImageProps {
  source: SourceLike;
  style?: StyleProp<ImageStyle>;
  /** Extra style for the wrapper, e.g. a background behind a transparent PNG. */
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
  /**
   * Drawn under the real image and revealed whenever the real image can't be:
   * missing, loading, or failed. Pass `IMAGES.defaultPic` for any avatar.
   */
  fallbackSource?: ImageSourcePropType;
  /**
   * Resize mode for `fallbackSource` only. Defaults to `resizeMode`, which is
   * right for an avatar (fallback and photo are both full-bleed) but wrong for a
   * logo placeholder, where the mark must be contained rather than cropped.
   */
  fallbackResizeMode?: ImageResizeMode;
  /**
   * Sizes the fallback instead of letting it fill the box. When given, the
   * fallback is centred inside the container rather than stretched across it —
   * e.g. `{width: '50%', height: '50%'}` for a logo sitting in the middle of a
   * white card. Omit for the full-bleed avatar behaviour.
   */
  fallbackStyle?: StyleProp<ImageStyle>;
  /** Set false where a shimmer would be more noise than help (small avatars). */
  showSkeleton?: boolean;
  /** Jump the download queue — use for whatever is on screen right now. */
  highPriority?: boolean;
  fadeIn?: boolean;
  onLoadEnd?: () => void;
  testID?: string;
}

const isUsableUri = (value?: string | null): boolean =>
  typeof value === 'string' &&
  !EMPTY_URI_VALUES.has(value.trim().toLowerCase());

const normalizeSource = (
  source: SourceLike,
): {uri: string} | ImageSourcePropType | null => {
  if (source === null || source === undefined) {
    return null;
  }
  if (typeof source === 'string') {
    return isUsableUri(source) ? {uri: source.trim()} : null;
  }
  if (typeof source === 'object' && !Array.isArray(source) && 'uri' in source) {
    const {uri} = source as {uri?: string | null};
    return isUsableUri(uri) ? {uri: (uri as string).trim()} : null;
  }
  // Local asset from `require()` (a number) or an array of sources.
  return source as ImageSourcePropType;
};

/**
 * Corner radii have to be mirrored onto the child image, because Android does
 * not reliably clip absolutely-positioned children to a rounded parent and a
 * circular avatar would render as a square.
 *
 * They must also be CLAMPED first. This codebase rounds things off with
 * `borderRadius: RFPercentage(100)` (~852 on a modern iPhone) as a "make it a
 * circle" idiom, which is harmless on a `View` but hands a ~43px avatar image a
 * radius twenty times its own size. Passing that straight through produced an
 * empty circle: the wrapper drew its border and background, the image inside
 * drew nothing at all. Half the shorter side is the largest radius that means
 * anything, so that is the ceiling.
 */
const extractRadii = (flat?: ImageStyle): ImageStyle => {
  if (!flat) {
    return {};
  }

  const {width, height} = flat;
  const shorterSide = Math.min(
    typeof width === 'number' ? width : Infinity,
    typeof height === 'number' ? height : Infinity,
  );

  // Percentage or flex-derived sizes give us no pixel box to clamp against.
  // Mirroring an unverifiable radius risks the blank-image failure above, so
  // skip it and let the wrapper's `overflow: 'hidden'` do the rounding.
  if (!Number.isFinite(shorterSide)) {
    return {};
  }
  const limit = shorterSide / 2;

  const radii: ImageStyle = {};
  const keys = [
    'borderRadius',
    'borderTopLeftRadius',
    'borderTopRightRadius',
    'borderBottomLeftRadius',
    'borderBottomRightRadius',
  ] as const;

  keys.forEach(key => {
    const value = flat[key];
    if (value !== undefined) {
      (radii as Record<string, unknown>)[key] =
        typeof value === 'number' ? Math.min(value, limit) : value;
    }
  });
  return radii;
};

const Skeleton: React.FC = () => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.skeletonBase]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.skeletonPulse,
          {
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.7],
            }),
          },
        ]}
      />
    </View>
  );
};

const CachedImage: React.FC<CachedImageProps> = ({
  source,
  style,
  containerStyle,
  resizeMode = 'cover',
  fallbackSource,
  fallbackResizeMode,
  fallbackStyle,
  showSkeleton = true,
  highPriority = false,
  fadeIn = true,
  onLoadEnd,
  testID,
}) => {
  const normalized = normalizeSource(source);
  const rawUri =
    normalized && typeof normalized === 'object' && 'uri' in normalized
      ? (normalized as {uri: string}).uri
      : null;
  const remoteUrl = isRemoteUrl(rawUri) ? (rawUri as string) : null;

  // Seed from the in-memory cache so a revisit paints on the first frame.
  const [resolvedUri, setResolvedUri] = useState<string | null>(() =>
    getMemoryCachedUri(remoteUrl),
  );
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retries = useRef(0);

  /**
   * Only a source we actually had to go to the network for gets faded in.
   * Bundled assets and cache hits start fully opaque: they have nothing to wait
   * for, and making their visibility depend on `onLoad` firing risks leaving
   * them invisible forever if the event is skipped for an already-decoded image.
   */
  const needsFetch = !!remoteUrl && !getMemoryCachedUri(remoteUrl);
  const opacity = useRef(
    new Animated.Value(fadeIn && needsFetch ? 0 : 1),
  ).current;

  useEffect(() => {
    if (!remoteUrl) {
      setResolvedUri(null);
      return;
    }

    const cached = getMemoryCachedUri(remoteUrl);
    if (cached) {
      setResolvedUri(cached);
      return;
    }

    let cancelled = false;
    setResolvedUri(null);

    getCachedImageUri(remoteUrl, {highPriority}).then(uri => {
      if (!cancelled) {
        setResolvedUri(uri || remoteUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [remoteUrl, highPriority, attempt]);

  // Reset transient state when the source itself changes (e.g. list recycling).
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    retries.current = 0;
    const willFetch = !!remoteUrl && !getMemoryCachedUri(remoteUrl);
    opacity.setValue(fadeIn && willFetch ? 0 : 1);
  }, [rawUri, remoteUrl, fadeIn, opacity]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    setFailed(false);
    Animated.timing(opacity, {
      toValue: 1,
      duration: fadeIn ? FADE_DURATION_MS : 0,
      useNativeDriver: true,
    }).start();
    onLoadEnd?.();
  }, [fadeIn, onLoadEnd, opacity]);

  const handleError = useCallback(async () => {
    if (!remoteUrl || retries.current >= MAX_RETRIES) {
      setFailed(true);
      onLoadEnd?.();
      return;
    }
    retries.current += 1;
    // Drop the cached copy so the retry actually re-downloads rather than
    // re-reading the same unusable bytes.
    await invalidateCachedImage(remoteUrl);
    setAttempt(previous => previous + 1);
  }, [onLoadEnd, remoteUrl]);

  const imageSource = remoteUrl
    ? resolvedUri
      ? {uri: resolvedUri}
      : null
    : normalized;

  const hasImage = !!imageSource && !failed;
  // The fallback stays behind the image until the image is actually painted,
  // which is what keeps an avatar slot from ever being empty.
  const showFallback = !!fallbackSource && (!hasImage || !loaded);
  // Something is either here or on its way, so a shimmer means "wait". Once a
  // load has definitively failed - or there was never a source to begin with -
  // the shimmer would pulse forever, so a flat placeholder takes over.
  const hasPendingOrRealSource = !!imageSource || !!remoteUrl;
  const showSkeletonLayer =
    showSkeleton &&
    !fallbackSource &&
    !failed &&
    hasPendingOrRealSource &&
    !loaded;
  const showEmptyPlaceholder =
    !hasImage && !fallbackSource && !showSkeletonLayer;

  const flatStyle = StyleSheet.flatten(style) as ImageStyle | undefined;
  const radii = extractRadii(flatStyle);

  return (
    <View style={[styles.container, style, containerStyle]} testID={testID}>
      {showSkeletonLayer && <Skeleton />}

      {showEmptyPlaceholder && (
        <View style={[StyleSheet.absoluteFill, styles.skeletonBase]} />
      )}

      {showFallback &&
        (fallbackStyle ? (
          /*
            A sized fallback (logo placeholder) is centred with flexbox rather
            than percentage insets, so the arithmetic belongs to the layout
            engine. No radii are mirrored here: the mark sits inside the box, so
            the wrapper's `overflow: 'hidden'` already does all the rounding.
          */
          <View style={[StyleSheet.absoluteFill, styles.fallbackCentered]}>
            <Image
              source={fallbackSource as ImageSourcePropType}
              resizeMode={fallbackResizeMode ?? 'contain'}
              style={fallbackStyle}
            />
          </View>
        ) : (
          <Image
            source={fallbackSource as ImageSourcePropType}
            resizeMode={fallbackResizeMode ?? resizeMode}
            style={[StyleSheet.absoluteFill, radii]}
          />
        ))}

      {hasImage && (
        <Animated.Image
          // Remounting on retry is what forces a fresh decode attempt.
          key={`${rawUri ?? 'local'}-${attempt}`}
          source={imageSource as ImageSourcePropType}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          style={[StyleSheet.absoluteFill, radii, {opacity}]}
          {...(Platform.OS === 'android'
            ? {resizeMethod: 'resize' as const}
            : {})}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  skeletonBase: {
    backgroundColor: Colors.skeletonLight,
  },
  skeletonPulse: {
    backgroundColor: Colors.skeletonDark,
  },
  fallbackCentered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(CachedImage);
