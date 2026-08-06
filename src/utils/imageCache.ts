import ReactNativeBlobUtil from 'react-native-blob-util';

/**
 * Persistent, cross-platform disk cache for remote images.
 *
 * Why this exists
 * ---------------
 * Service images live in Firebase Storage and are rendered through the stock
 * React Native `<Image>`, which delegates caching to the platform HTTP stack.
 * Firebase download URLs are served without a long-lived `Cache-Control`
 * header unless the object metadata sets one, so iOS (NSURLCache) treats them
 * as non-cacheable and re-downloads the full JPEG every single time the
 * Service Details screen mounts. Android's Fresco cache is more forgiving but
 * is still evicted aggressively and is not shared with the fullscreen viewer.
 *
 * This module puts a cache we control in front of that: every remote URL is
 * downloaded exactly once into the OS cache directory and afterwards rendered
 * from a `file://` URI, which decodes immediately and works offline.
 *
 * It also acts as the single scheduler for remote image downloads. The Home
 * list renders a card per cleaner, so without a concurrency cap a dozen
 * requests compete for bandwidth and the images the user is actually looking
 * at finish last. Downloads are capped and the screen in the foreground can
 * jump the queue via `highPriority`.
 */

const CACHE_DIR = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/service-images`;

/** Soft ceiling for the cache. Pruning trims back to 80% of this. */
const MAX_CACHE_BYTES = 120 * 1024 * 1024;

/** Parallel downloads. Above ~4 the requests just starve each other. */
const MAX_CONCURRENT_DOWNLOADS = 4;

const DOWNLOAD_TIMEOUT_MS = 25000;

type PrefetchOptions = {
  /** Push to the front of the download queue (screen currently visible). */
  highPriority?: boolean;
};

/** Remote URL -> local `file://` URI. Synchronous hits avoid a loading flash. */
const memoryCache = new Map<string, string>();

/** Dedupes concurrent resolutions of the same URL (gallery + viewer + card). */
const inFlight = new Map<string, Promise<string>>();

export const isRemoteUrl = (value?: string | null): boolean =>
  typeof value === 'string' && /^https?:\/\//i.test(value);

/**
 * Stable, filesystem-safe filename for a URL. Firebase URLs contain the
 * object path plus a token, so hashing the whole thing keeps distinct images
 * distinct while staying well under filename length limits.
 */
const cacheKey = (url: string): string => {
  let hash = 5381;
  for (let i = 0; i < url.length; i++) {
    hash = (hash * 33) ^ url.charCodeAt(i);
  }
  return `${(hash >>> 0).toString(36)}_${url.length.toString(36)}.img`;
};

let dirPromise: Promise<void> | null = null;

const ensureCacheDir = (): Promise<void> => {
  if (!dirPromise) {
    dirPromise = (async () => {
      const exists = await ReactNativeBlobUtil.fs.isDir(CACHE_DIR);
      if (!exists) {
        await ReactNativeBlobUtil.fs.mkdir(CACHE_DIR);
      }
    })().catch(() => {
      // Reset so a later call can retry (e.g. transient storage error).
      dirPromise = null;
    });
  }
  return dirPromise as Promise<void>;
};

/* ------------------------------------------------------------------ *
 * Download queue                                                      *
 * ------------------------------------------------------------------ */

const queue: Array<() => void> = [];
let activeDownloads = 0;

const runNext = (): void => {
  if (activeDownloads >= MAX_CONCURRENT_DOWNLOADS) {
    return;
  }
  const next = queue.shift();
  if (!next) {
    return;
  }
  activeDownloads += 1;
  next();
};

const enqueue = <T>(job: () => Promise<T>, highPriority = false): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const start = () => {
      job()
        .then(resolve, reject)
        .finally(() => {
          activeDownloads -= 1;
          runNext();
        });
    };

    if (highPriority) {
      queue.unshift(start);
    } else {
      queue.push(start);
    }
    runNext();
  });

/* ------------------------------------------------------------------ *
 * Pruning                                                             *
 * ------------------------------------------------------------------ */

let prunedThisSession = false;

/**
 * Trims the oldest entries when the cache outgrows its budget. Runs at most
 * once per app session and never blocks an image from rendering.
 */
const pruneCache = async (): Promise<void> => {
  if (prunedThisSession) {
    return;
  }
  prunedThisSession = true;

  try {
    const files = await ReactNativeBlobUtil.fs.lstat(CACHE_DIR);
    let totalBytes = files.reduce(
      (sum, file) => sum + (Number(file.size) || 0),
      0,
    );
    if (totalBytes <= MAX_CACHE_BYTES) {
      return;
    }

    const oldestFirst = [...files].sort(
      (a, b) => (Number(a.lastModified) || 0) - (Number(b.lastModified) || 0),
    );
    const target = MAX_CACHE_BYTES * 0.8;

    for (const file of oldestFirst) {
      if (totalBytes <= target) {
        break;
      }
      await ReactNativeBlobUtil.fs.unlink(file.path).catch(() => {});
      totalBytes -= Number(file.size) || 0;

      for (const [url, uri] of memoryCache) {
        if (uri.endsWith(`/${file.filename}`)) {
          memoryCache.delete(url);
        }
      }
    }
  } catch {
    // Pruning is best-effort housekeeping.
  }
};

/* ------------------------------------------------------------------ *
 * Public API                                                          *
 * ------------------------------------------------------------------ */

/**
 * Local URI for an already-cached URL, or `null`. Lets a component render
 * from cache on its very first frame instead of flashing a placeholder.
 */
export const getMemoryCachedUri = (url?: string | null): string | null => {
  if (!url) {
    return null;
  }
  return memoryCache.get(url) ?? null;
};

const downloadToDisk = async (
  url: string,
  highPriority: boolean,
): Promise<string> => {
  await ensureCacheDir();

  const path = `${CACHE_DIR}/${cacheKey(url)}`;

  // Already on disk from a previous session.
  if (await ReactNativeBlobUtil.fs.exists(path)) {
    const stat = await ReactNativeBlobUtil.fs.stat(path);
    if ((Number(stat.size) || 0) > 0) {
      const uri = `file://${path}`;
      memoryCache.set(url, uri);
      return uri;
    }
    // Zero-byte leftover from a killed download.
    await ReactNativeBlobUtil.fs.unlink(path).catch(() => {});
  }

  // Download to a temp path and move on success, so a cancelled or failed
  // transfer can never leave a truncated file that renders as a broken image.
  const tempPath = `${path}.part`;
  await ReactNativeBlobUtil.fs.unlink(tempPath).catch(() => {});

  try {
    const response = await enqueue(
      () =>
        ReactNativeBlobUtil.config({
          path: tempPath,
          timeout: DOWNLOAD_TIMEOUT_MS,
          overwrite: true,
        }).fetch('GET', url),
      highPriority,
    );

    const status = response.info().status;
    if (status < 200 || status >= 300) {
      throw new Error(`Image download failed with status ${status}`);
    }

    await ReactNativeBlobUtil.fs.mv(tempPath, path);

    const uri = `file://${path}`;
    memoryCache.set(url, uri);
    pruneCache();
    return uri;
  } catch (error) {
    await ReactNativeBlobUtil.fs.unlink(tempPath).catch(() => {});
    throw error;
  }
};

/**
 * Resolves a remote URL to a cached `file://` URI, downloading it if needed.
 *
 * Never rejects: if caching is impossible (storage full, offline, bad URL) the
 * original URL is returned so `<Image>` can still try the network directly.
 * Non-remote values (local `require`d assets, existing `file://` URIs) are
 * passed straight through.
 */
export const getCachedImageUri = async (
  url?: string | null,
  {highPriority = false}: PrefetchOptions = {},
): Promise<string> => {
  if (!url) {
    return '';
  }
  if (!isRemoteUrl(url)) {
    return url;
  }

  const cached = memoryCache.get(url);
  if (cached) {
    return cached;
  }

  const pending = inFlight.get(url);
  if (pending) {
    return pending;
  }

  const task = downloadToDisk(url, highPriority)
    .catch(() => url)
    .finally(() => {
      inFlight.delete(url);
    });

  inFlight.set(url, task);
  return task;
};

/**
 * Warms the cache for a set of URLs without waiting on them.
 *
 * Call this the moment a navigation to an image-heavy screen is triggered:
 * the download starts while the screen transition animates, so by the time
 * the gallery is on screen the bytes are usually already local.
 */
export const prefetchImages = (
  urls: Array<string | null | undefined>,
  {highPriority = false}: PrefetchOptions = {},
): void => {
  const pending = urls.filter(
    url => isRemoteUrl(url) && !memoryCache.has(url as string),
  ) as string[];

  if (pending.length === 0) {
    return;
  }

  // High-priority items are pushed to the front one by one, so iterate in
  // reverse to keep the original order once they are all queued.
  const ordered = highPriority ? [...pending].reverse() : pending;

  ordered.forEach(url => {
    getCachedImageUri(url, {highPriority}).catch(() => {});
  });
};

/**
 * Drops a URL from the cache. Used when a cached file fails to decode, so the
 * retry re-downloads instead of re-reading the same corrupt bytes.
 */
export const invalidateCachedImage = async (
  url?: string | null,
): Promise<void> => {
  if (!isRemoteUrl(url)) {
    return;
  }
  const key = url as string;
  memoryCache.delete(key);
  inFlight.delete(key);
  try {
    await ReactNativeBlobUtil.fs
      .unlink(`${CACHE_DIR}/${cacheKey(key)}`)
      .catch(() => {});
  } catch {
    // Nothing to clean up.
  }
};

/** Clears the whole cache. Handy for a "clear cache" setting or debugging. */
export const clearImageCache = async (): Promise<void> => {
  memoryCache.clear();
  inFlight.clear();
  try {
    await ReactNativeBlobUtil.fs.unlink(CACHE_DIR).catch(() => {});
  } finally {
    dirPromise = null;
  }
};
