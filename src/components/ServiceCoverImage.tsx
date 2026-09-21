import React, {memo} from 'react';
import {
  ImageResizeMode,
  ImageStyle,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import CachedImage from './CachedImage';
import {Colors, IMAGES} from '../constants/Themes';

/**
 * A cleaner service cover image, with a branded placeholder for services that
 * have no photo: white background, app logo centred.
 *
 * Why this rather than a `covers.length ? <Image/> : <View/>` check at each call
 * site: the empty case is only one of three ways a cover ends up blank. The
 * others are "still downloading" and "the URL is dead" — a Storage object that
 * was deleted, or a record written with a stale URL. CachedImage's
 * `fallbackSource` already covers all three (it draws the fallback from the
 * first frame and only hides it once a real image has actually painted), so
 * routing through it means one placeholder handles every case instead of just
 * the easy one.
 *
 * Layout is unchanged from a plain CachedImage: `style` defines the box and the
 * image fills it absolutely, so container size, aspect ratio and any rounding
 * from the parent's `overflow: 'hidden'` all behave exactly as before.
 */

interface Props {
  /** Cover URL. Null/undefined/''/'null' all resolve to the placeholder. */
  uri?: string | null;
  /** Must define the box — width/height, or flex from a sized parent. */
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
  /** Jump the download queue for a cover that's on screen right now. */
  highPriority?: boolean;
  /**
   * Fraction of the box the logo occupies, 0-1. The default leaves generous
   * white space so the mark reads as branding rather than a cropped photo.
   */
  logoScale?: number;
  testID?: string;
}

const ServiceCoverImage: React.FC<Props> = ({
  uri,
  style,
  containerStyle,
  resizeMode = 'cover',
  highPriority = false,
  logoScale = 0.5,
  testID,
}) => {
  const size = `${Math.round(Math.min(Math.max(logoScale, 0.1), 1) * 100)}%`;

  return (
    <CachedImage
      source={{uri}}
      style={style}
      containerStyle={[styles.placeholderBackground, containerStyle]}
      resizeMode={resizeMode}
      fallbackSource={IMAGES.logo}
      fallbackResizeMode="contain"
      // Sized rather than full-bleed, so CachedImage centres it in the box.
      fallbackStyle={{width: size, height: size} as StyleProp<ImageStyle>}
      highPriority={highPriority}
      testID={testID}
    />
  );
};

export default memo(ServiceCoverImage);

const styles = StyleSheet.create({
  // Sits behind everything: it's the placeholder's white card while there is no
  // photo, and completely hidden once one paints.
  placeholderBackground: {
    backgroundColor: Colors.white,
  },
});
