import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

/**
 * Remote-configured static app content.
 *
 * The Cleaner intro video is NOT bundled with the app. Its Storage path and
 * version live in Firestore (`AppConfig/cleanerIntro`) so the client can swap
 * the video, or disable the feature entirely, without an app release.
 */

export type CleanerIntroConfig = {
  version: number;
  durationSec: number;
  videoUrl: string;
  posterUrl?: string;
};

/**
 * Cached shape. `sourceKey` fingerprints the config inputs so that editing
 * `storagePath` invalidates the cache on its own.
 *
 * `version` alone is NOT sufficient: it exists to re-show the video to users,
 * which is a separate concern from "the resolved URL is stale". Keying the
 * cache on version alone silently ignores a path change.
 */
type CachedConfig = CleanerIntroConfig & {sourceKey: string};

type CleanerIntroConfigDoc = {
  storagePath?: string;
  /**
   * Optional dev-only override, used ONLY on a simulator/emulator in a debug
   * build. Exists because the iOS Simulator's audio pipeline cannot initialize
   * an AAC track — AVPlayer then fails the whole asset with a generic
   * AVFoundation -11800. Point this at an audio-stripped copy of the video.
   *
   * Never consulted in a release build, so a silent asset cannot reach users.
   */
  simulatorStoragePath?: string;
  posterPath?: string;
  version?: number;
  durationSec?: number;
  enabled?: boolean;
};

const CONFIG_COLLECTION = 'AppConfig';
const CONFIG_DOC = 'cleanerIntro';
const CACHE_KEY = 'cleanerIntroConfigCache';

/**
 * Normalises whatever was typed into the Firestore config into a usable
 * Storage reference path.
 *
 * The Firestore Console is a hand-edited surface, so the stored value picks up
 * predictable junk that all surface as an opaque `storage/object-not-found`:
 *   - surrounding whitespace from a paste
 *   - surrounding quotes, when the value was copied out of a code snippet
 *   - a leading slash, which is a different object key entirely
 * Normalise rather than trusting the input.
 */
const normalizePath = (raw: string): string =>
  raw
    .trim()
    // Strip one matching pair of surrounding quotes/backticks, if present.
    .replace(/^(['"`])([\s\S]*)\1$/, '$2')
    .trim()
    .replace(/^\/+/, '');

const buildSourceKey = (
  version: number,
  storagePath: string,
  posterPath?: string,
): string =>
  `${version}|${normalizePath(storagePath)}|${normalizePath(posterPath ?? '')}`;

/**
 * True only in a debug build running on a simulator/emulator.
 *
 * `__DEV__` is compiled to `false` in release bundles, so the dev override
 * below is unreachable in anything shipped to users.
 */
const isDevSimulator = (): boolean => {
  if (!__DEV__) {
    return false;
  }
  try {
    return DeviceInfo.isEmulatorSync();
  } catch {
    return false;
  }
};

/**
 * Chooses which asset to play. Production always gets `storagePath`; only a
 * debug simulator build may fall back to `simulatorStoragePath`.
 */
const pickVideoPath = (data: CleanerIntroConfigDoc): string => {
  const productionPath = (data.storagePath ?? '').trim();
  const simulatorPath = (data.simulatorStoragePath ?? '').trim();

  if (simulatorPath && isDevSimulator()) {
    console.log(
      '[appContentService] DEV SIMULATOR override active — playing ' +
        'simulatorStoragePath (audio-stripped). Release builds always use ' +
        'storagePath.',
    );
    return simulatorPath;
  }

  return productionPath;
};

const readCache = async (): Promise<CachedConfig | null> => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as CachedConfig;
    return parsed?.videoUrl ? parsed : null;
  } catch {
    return null;
  }
};

const writeCache = async (config: CachedConfig): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(config));
  } catch {
    // Cache failures are non-fatal — the config still works for this session.
  }
};

/** Clears the cached config. Useful from a dev menu or after a failed load. */
export const clearCleanerIntroCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore — nothing depends on the removal succeeding.
  }
};

/**
 * Resolves a media reference to a playable URL.
 *
 * Accepts three formats so the config is forgiving of however the path was
 * entered:
 *   - a Storage object path  ("app-content/cleaner-intro/intro-v1.mp4")
 *   - a gs:// URI           ("gs://bucket/app-content/intro-v1.mp4")
 *   - a full https:// URL   (used as-is, no Storage call)
 */
const resolveMediaUrl = async (rawPath: string): Promise<string> => {
  // Normalise first, so a quoted or slash-prefixed value is still recognised
  // as a URL rather than falling through to a doomed Storage lookup.
  const value = normalizePath(rawPath);

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (/^gs:\/\//i.test(value)) {
    return storage().refFromURL(value).getDownloadURL();
  }

  return storage().ref(value).getDownloadURL();
};

/**
 * Resolves the Cleaner intro video config.
 *
 * Returns `null` when the feature is disabled, unconfigured, or unreachable —
 * callers MUST treat null as "skip the video entirely" and never as an error
 * worth blocking the user on.
 */
export const getCleanerIntroConfig =
  async (): Promise<CleanerIntroConfig | null> => {
    let requestedPath = '';

    try {
      const doc = await firestore()
        .collection(CONFIG_COLLECTION)
        .doc(CONFIG_DOC)
        .get();

      if (!doc.exists) {
        console.log(
          '[appContentService] AppConfig/cleanerIntro does not exist — ' +
            'create the doc to enable the intro video.',
        );
        return null;
      }

      const data = (doc.data() ?? {}) as CleanerIntroConfigDoc;

      // Remote kill switch — client can turn the feature off instantly.
      if (data.enabled !== true) {
        return null;
      }

      if (!data.storagePath || !data.storagePath.trim()) {
        console.log(
          '[appContentService] AppConfig/cleanerIntro is enabled but ' +
            'storagePath is empty.',
        );
        return null;
      }

      // Production always resolves storagePath; only a debug simulator build
      // may substitute the audio-stripped asset.
      const chosenPath = pickVideoPath(data);
      requestedPath = normalizePath(chosenPath);

      const version = data.version ?? 1;
      const sourceKey = buildSourceKey(version, chosenPath, data.posterPath);

      // Reuse the cached download URL only when BOTH the version and the
      // underlying paths are unchanged — so editing storagePath in the
      // Firestore Console takes effect immediately, with no version bump.
      const cached = await readCache();
      if (cached && cached.sourceKey === sourceKey) {
        console.log(
          `[appContentService] serving cached config (version ${version})`,
        );
        return cached;
      }

      const [videoUrl, posterUrl] = await Promise.all([
        resolveMediaUrl(chosenPath),
        data.posterPath && data.posterPath.trim()
          ? resolveMediaUrl(data.posterPath).catch(() => undefined)
          : Promise.resolve(undefined),
      ]);

      const config: CachedConfig = {
        version,
        durationSec: data.durationSec ?? 0,
        videoUrl,
        posterUrl,
        sourceKey,
      };

      console.log(
        `[appContentService] resolved intro video (version ${version}):`,
        videoUrl,
      );

      await writeCache(config);
      return config;
    } catch (error: any) {
      const code = error?.code;

      if (code === 'storage/object-not-found') {
        console.log(
          '[appContentService] Intro video NOT FOUND in Storage.\n' +
            `  bucket        : ${storage().app.options.storageBucket}\n` +
            `  requested key : "${requestedPath}"\n` +
            '  Fix: confirm an object exists at exactly that key in\n' +
            '  Firebase Console -> Storage. Check for a trailing space, a\n' +
            '  leading slash, or a filename/case mismatch in\n' +
            '  AppConfig/cleanerIntro.storagePath.',
        );
        // A misconfiguration, not a network blip. Do NOT fall back to a stale
        // cached URL — that would mask the broken config during development.
        return null;
      }

      console.log(
        '[appContentService] cleanerIntro config failed:',
        code ?? '',
        error?.message ?? error,
      );

      // Offline / transient failure — fall back to the last known-good config
      // so a cleaner replaying from Settings isn't blocked.
      return readCache();
    }
  };
