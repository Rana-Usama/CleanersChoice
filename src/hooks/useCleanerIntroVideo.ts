import {useCallback, useEffect, useRef, useState} from 'react';
import {
  getCleanerIntroConfig,
  CleanerIntroConfig,
} from '../services/appContentService';
import {markIntroVideoSeen, shouldShowIntroVideo} from '../utils/introVideo';

/**
 * Loads the intro video config on demand — used by the replay screen, where
 * the video should always be available regardless of the seen flag.
 */
export const useCleanerIntroConfig = () => {
  const [config, setConfig] = useState<CleanerIntroConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setUnavailable(false);
    const result = await getCleanerIntroConfig();
    setConfig(result);
    setUnavailable(!result);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {config, loading, unavailable, reload: load};
};

/**
 * First-run gate for the Cleaner intro video.
 *
 * Order matters: the remote config is checked BEFORE the per-user flag, so a
 * disabled or unconfigured feature costs zero extra Firestore reads.
 *
 * `visible` only ever flips to true once — dismissing marks the video seen so
 * it won't reappear on the next mount.
 */
export const useCleanerIntroAutoPlay = (enabled: boolean) => {
  const [config, setConfig] = useState<CleanerIntroConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(enabled);
  const resolvedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!enabled || resolvedRef.current) {
        setChecking(false);
        return;
      }

      const remoteConfig = await getCleanerIntroConfig();
      if (cancelled) {
        return;
      }

      if (!remoteConfig) {
        setChecking(false);
        return;
      }

      const shouldShow = await shouldShowIntroVideo(remoteConfig.version);
      if (cancelled) {
        return;
      }

      resolvedRef.current = true;
      setConfig(remoteConfig);
      setVisible(shouldShow);
      setChecking(false);
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const dismiss = useCallback(
    async (completed: boolean) => {
      setVisible(false);
      if (config) {
        await markIntroVideoSeen(config.version, completed);
      }
    },
    [config],
  );

  return {visible, config, checking, dismiss};
};
