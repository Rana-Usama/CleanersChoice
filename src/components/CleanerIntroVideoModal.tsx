import React from 'react';
import {Modal, StyleSheet, View} from 'react-native';
import IntroVideoPlayer from './IntroVideoPlayer';
import {useCleanerIntroAutoPlay} from '../hooks/useCleanerIntroVideo';
import {Colors} from '../constants/Themes';

interface Props {
  /**
   * Only run the gate when the host screen is actually for a Cleaner.
   * Passing false costs zero Firestore reads.
   */
  enabled: boolean;
}

/**
 * First-run intro video for Cleaners, presented as a full-screen modal over
 * the paywall.
 *
 * Rendering it as a modal rather than a navigation step is deliberate:
 *  - Premium is reached from three separate places (SignUp, SignIn and the
 *    initialRoute in StackNavigator). Gating here covers all three without
 *    touching the subscription flow.
 *  - No route flash — the modal covers the paywall instantly.
 *  - Dismissing lands the cleaner directly on an already-mounted paywall.
 */
const CleanerIntroVideoModal: React.FC<Props> = ({enabled}) => {
  const {visible, config, dismiss} = useCleanerIntroAutoPlay(enabled);

  if (!visible || !config) {
    return null;
  }

  return (
    <Modal
      visible
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={() => dismiss(false)}>
      <View style={styles.container}>
        <IntroVideoPlayer
          videoUrl={config.videoUrl}
          posterUrl={config.posterUrl}
            ignoreSilentSwitch="inherit"
          dismissLabel="Skip"
          startMuted={false}
          onComplete={() => dismiss(true)}
          onDismiss={() => dismiss(false)}
        />
      </View>
    </Modal>
  );
};

export default CleanerIntroVideoModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
});
