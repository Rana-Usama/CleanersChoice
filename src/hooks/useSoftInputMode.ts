import {useCallback} from 'react';
import {NativeModules, Platform} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';

const {SoftInputModule} = NativeModules;

/**
 * Sets Android windowSoftInputMode to ADJUST_NOTHING while the screen is focused,
 * so the keyboard overlays content without resizing the window.
 * Restores ADJUST_RESIZE when the screen loses focus.
 */
export const useSoftInputAdjustNothing = () => {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      SoftInputModule?.setAdjustNothing();
      return () => {
        SoftInputModule?.setAdjustResize();
      };
    }, []),
  );
};
