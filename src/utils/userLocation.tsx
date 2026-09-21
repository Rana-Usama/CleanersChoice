import {useState, useEffect, useCallback, useRef} from "react";
import {
  Linking,
  PermissionsAndroid,
  Platform,
} from "react-native";
import Geolocation from "@react-native-community/geolocation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import haversine from "haversine";
import axios from "axios";
import {GOOGLE_PLACES_API_KEY} from '@env';

const LOCATION_DISCLOSURE_KEY = "@location_disclosure_accepted";

// Native callbacks and network requests can outlive their own advertised
// timeout. Bound every awaited stage, including the saved-address fallback.
const withDeadline = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Location request timed out')), ms);
    promise.then(
      value => { clearTimeout(timer); resolve(value); },
      error => { clearTimeout(timer); reject(error); },
    );
  });

interface Location {
  latitude: number;
  longitude: number;
  address: string | null;
}

/**
 * Where the coordinate the caller received actually came from. Screens use
 * this to tell the user they are seeing results around a saved address rather
 * than their live position, instead of presenting a fallback as a GPS fix.
 */
export type LocationSource = "gps" | "lastKnown" | "serviceAddress";

/**
 * Why we have no coordinate. "blocked" is the case the OS will not re-prompt
 * for (iOS after any denial, Android after "Don't ask again"), so it is the
 * only one where sending the user to Settings is the correct action.
 */
export type LocationFailure =
  | "blocked"
  | "denied"
  | "unavailable"
  | "timeout"
  | "unknown";

/**
 * Pin the authorization level rather than letting the library infer it.
 *
 * RNCGeolocation's 'auto' branch decides between when-in-use and always by
 * sniffing which purpose strings exist in Info.plist. Info.plist has to keep
 * NSLocationAlwaysAndWhenInUseUsageDescription for ITMS-90683, so the
 * inference is one plist edit away from silently upgrading the app to Always
 * auth and triggering the background-location prompt — which would contradict
 * the disclosure copy and the 5.1.1(iv) fix. Stating it here removes that risk.
 */
if (Platform.OS === "ios") {
  try {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: "whenInUse",
    });
  } catch (err) {
    console.log("Geolocation configuration error:", err);
  }
}

/**
 * Cleaner location sync.
 *
 * The nearby-job Cloud Function needs a coordinate for each cleaner, and the
 * only one previously stored was their service address — which disagreed with
 * the jobs list, since that filters on live device GPS. Persisting the device
 * position here keeps push radius and list radius on the same coordinate.
 *
 * Only cleaners are written: a customer's position is never needed server-side.
 * The write is fire-and-forget — a failure must never affect the location the
 * calling screen receives.
 */
const LOCATION_SYNC_MIN_INTERVAL_MS = 15 * 60 * 1000;
const LOCATION_SYNC_MIN_DISTANCE_KM = 1;

/**
 * Mirrors CURRENT_LOCATION_MAX_AGE_MS in functions/src/index.ts. The client
 * and the push function must age out lastKnownLocation identically, otherwise
 * a cleaner can be notified about a job the jobs list then refuses to show
 * (or the reverse). Keep both in sync if this ever changes.
 */
const LAST_KNOWN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

let lastSyncedLocation: {
  latitude: number;
  longitude: number;
  at: number;
} | null = null;

/**
 * This hook re-runs on every screen mount, so without a guard a cleaner
 * browsing between tabs would issue a Firestore write each time. Skip when the
 * position is both recent and essentially unchanged.
 */
const shouldSyncLocation = (latitude: number, longitude: number) => {
  if (!lastSyncedLocation) return true;

  const elapsed = Date.now() - lastSyncedLocation.at;
  if (elapsed >= LOCATION_SYNC_MIN_INTERVAL_MS) return true;

  try {
    const movedKm = haversine(
      {
        latitude: lastSyncedLocation.latitude,
        longitude: lastSyncedLocation.longitude,
      },
      {latitude, longitude},
      {unit: "km"},
    );
    return movedKm >= LOCATION_SYNC_MIN_DISTANCE_KM;
  } catch (err) {
    return true;
  }
};

const syncCleanerLocation = async (latitude: number, longitude: number) => {
  try {
    const user = auth().currentUser;
    if (!user) return;

    const role = await AsyncStorage.getItem("role");
    if (role !== "Cleaner") return;

    if (!shouldSyncLocation(latitude, longitude)) return;

    await firestore()
      .collection("Users")
      .doc(user.uid)
      .update({
        lastKnownLocation: {
          latitude,
          longitude,
          // Epoch ms to match the project's other time fields
          // (subscriptionEndDate). Lets a staleness cutoff be added later
          // without a migration.
          updatedAt: Date.now(),
        },
      });

    lastSyncedLocation = {latitude, longitude, at: Date.now()};
  } catch (err) {
    console.log("Error syncing cleaner location:", err);
  }
};

const toCoord = (value: any): number | null => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
};

/**
 * Saved-coordinate fallback, mirroring the priority the nearby-job Cloud
 * Function already applies (functions/src/index.ts): the last synced device
 * position first, then the cleaner's saved service address.
 *
 * Without this the client had no fallback at all, so a cleaner who denied
 * location — or whose GPS fix simply failed — was pushed jobs by the server
 * and then shown an empty "Location Required" screen by the app. The two now
 * resolve to the same coordinate.
 */
const loadSavedLocation = async (): Promise<{
  location: Location;
  source: LocationSource;
} | null> => {
  const user = auth().currentUser;
  if (!user) return null;

  try {
    const userDoc = await withDeadline(firestore()
      .collection("Users")
      .doc(user.uid)
      .get(), 5000);

    const lastKnown = userDoc.data()?.lastKnownLocation;
    const latitude = toCoord(lastKnown?.latitude);
    const longitude = toCoord(lastKnown?.longitude);
    const updatedAt = lastKnown?.updatedAt;

    // Records written before updatedAt existed have no age, so they are
    // treated as stale rather than trusted indefinitely.
    const age =
      typeof updatedAt === "number"
        ? Date.now() - updatedAt
        : Number.POSITIVE_INFINITY;

    if (latitude !== null && longitude !== null && age <= LAST_KNOWN_MAX_AGE_MS) {
      return {
        location: {latitude, longitude, address: null},
        source: "lastKnown",
      };
    }
  } catch (err) {
    console.log("Last known location read error:", err);
  }

  try {
    const serviceDoc = await withDeadline(firestore()
      .collection("CleanerServices")
      .doc(user.uid)
      .get(), 5000);

    const saved = serviceDoc.data()?.location;
    const latitude = toCoord(saved?.latitude);
    const longitude = toCoord(saved?.longitude);

    if (latitude !== null && longitude !== null) {
      return {
        location: {
          latitude,
          longitude,
          address: typeof saved?.name === "string" ? saved.name : null,
        },
        source: "serviceAddress",
      };
    }
  } catch (err) {
    console.log("Service address location read error:", err);
  }

  return null;
};

/**
 * "undetermined" means the iOS authorization callback never arrived — see
 * requestPermission below. It is not a denial: the caller proceeds to
 * getCurrentPosition and lets that call's own error code decide.
 */
type PermissionOutcome = "granted" | "denied" | "blocked" | "undetermined";

/**
 * How long to wait for RNCGeolocation's requestAuthorization callback before
 * giving up on it and letting getCurrentPosition speak for itself.
 *
 * The native module (RNCGeolocation.mm) pushes the success/error blocks into
 * `_queuedAuthorizationCallbacks` and only drains them from
 * `locationManagerDidChangeAuthorization:`. iOS fires that delegate on a
 * status *change*, so:
 *   - status already granted/denied -> requestWhenInUseAuthorization() is a
 *     no-op, no delegate call, neither block ever runs;
 *   - status kCLAuthorizationStatusNotDetermined -> the delegate's else-branch
 *     builds `jsError` only for Restricted/Denied, so it is nil here and the
 *     blocks are again left queued.
 * Either way the JS promise never settles. Short by design: when the system
 * prompt really is on screen, getCurrentPosition queues behind it natively in
 * `_pendingRequests` and resolves once the user answers.
 */
const IOS_AUTH_CALLBACK_GRACE_MS = 2500;

/**
 * Absolute ceiling on `resolving`. Everything below is individually bounded,
 * but this flag gates UI, so it gets a backstop that does not depend on any
 * native callback arriving.
 */
const RESOLVE_HARD_CAP_MS = 30000;

type UseCurrentLocationOptions = {
  /**
   * Opt in to the saved-coordinate fallback above. Cleaner screens want it so
   * their list agrees with the push radius; the customer flow has no service
   * address to fall back to, so it stays off by default.
   */
  savedLocationFallback?: boolean;
};

export const useCurrentLocation = (
  options: UseCurrentLocationOptions = {},
) => {
  const {savedLocationFallback = false} = options;

  const [location, setLocation] = useState<Location | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  /**
   * True until a coordinate is found or every source has been exhausted.
   *
   * Screens previously guessed at this with a fixed 2s timer while the fetch
   * itself allowed 15-20s, so a slow cold GPS fix rendered the empty state
   * over a request that was still running. Gating on this instead means the
   * empty state only appears once there is genuinely nothing left to try.
   */
  const [resolving, setResolving] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [failure, setFailure] = useState<LocationFailure | null>(null);
  const [disclosureVisible, setDisclosureVisible] = useState<boolean>(false);

  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await withDeadline(axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_PLACES_API_KEY}`,
        {timeout: 5000},
      ), 5000);

      const formattedAddress =
        response.data?.results?.[0]?.formatted_address || "Unknown Address";

      return formattedAddress;
    } catch (err) {
      console.log("Reverse Geocoding Error:", err);
      return null;
    }
  };

  const requestPermission = useCallback(async (): Promise<PermissionOutcome> => {
    if (Platform.OS === "ios") {
      return new Promise<PermissionOutcome>((resolve) => {
        let settled = false;
        const settle = (outcome: PermissionOutcome) => {
          if (settled) return;
          settled = true;
          resolve(outcome);
        };

        // Neither callback is guaranteed to fire — see
        // IOS_AUTH_CALLBACK_GRACE_MS. Silence is inconclusive, not a denial.
        const grace = setTimeout(
          () => settle("undetermined"),
          IOS_AUTH_CALLBACK_GRACE_MS,
        );

        try {
          Geolocation.requestAuthorization(
            () => {
              clearTimeout(grace);
              settle("granted");
            },
            // iOS shows the system prompt at most once. After any denial the
            // error callback fires immediately and no further prompt is
            // possible, so this is always the Settings case.
            () => {
              clearTimeout(grace);
              settle("blocked");
            },
          );
        } catch (err) {
          clearTimeout(grace);
          console.log("requestAuthorization threw:", err);
          settle("undetermined");
        }
      });
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) return "granted";
      // "Don't ask again" — request() returns instantly from here on, so
      // retrying in-app can never succeed.
      if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        return "blocked";
      }
      return "denied";
    } catch (err) {
      return "denied";
    }
  }, []);

  /**
   * Applies the saved-coordinate fallback and closes out the resolve cycle.
   * Every path that fails to produce a GPS fix ends here, so `resolving` can
   * never be left stuck on.
   */
  const settleWithFallback = useCallback(
    async (failureReason: LocationFailure, message: string, requestId = requestIdRef.current) => {
      if (!isMountedRef.current || requestId !== requestIdRef.current) return null;

      setFailure(failureReason);
      setError(message);

      if (!savedLocationFallback) {
        setResolving(false);
        return null;
      }

      const fallback = await loadSavedLocation();
      if (!isMountedRef.current || requestId !== requestIdRef.current) return null;

      if (fallback) {
        setLocation(fallback.location);
        setLocationSource(fallback.source);
      }

      setResolving(false);
      return fallback?.location ?? null;
    },
    [savedLocationFallback],
  );

  const fetchLocation = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isCurrent = () => isMountedRef.current && requestId === requestIdRef.current;
    setResolving(true);

    try {
      const permission = await withDeadline(requestPermission(), 20000);
      if (!isCurrent()) return null;

      // "undetermined" falls through: getCurrentPosition re-triggers the
      // request natively and reports code 1 if it really is denied, which is a
      // far more reliable permission signal than the queued callbacks.
      if (permission !== "granted" && permission !== "undetermined") {
        setLoading(false);
        return settleWithFallback(
          permission === "blocked" ? "blocked" : "denied",
          permission === "blocked"
            ? "Location access is turned off for this app"
            : "Location permission denied",
          requestId,
        );
      }

      setLoading(true);
      setError(null);
      setFailure(null);

      return await new Promise<Location | null>((resolve) => {
        let settled = false;
        let gpsFinished = false;

        const finish = (value: Location | null) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };

        const timeout = setTimeout(() => {
          gpsFinished = true;
          if (isCurrent()) setLoading(false);
          settleWithFallback("timeout", "Location request timed out", requestId).then(
            finish,
          );
        }, 20000);

        Geolocation.getCurrentPosition(
          async (position) => {
            clearTimeout(timeout);
            if (gpsFinished || !isCurrent()) { finish(null); return; }
            gpsFinished = true;

            const { latitude, longitude } = position.coords;

            // Coordinates are enough to show nearby jobs. Address lookup must
            // never hold the list hostage after GPS has already succeeded.
            const newLocation: Location = {
              latitude,
              longitude,
              address: null,
            };

            if (isCurrent()) {
              setLocation(newLocation);
              setLocationSource("gps");
              setError(null);
              setFailure(null);
              setLoading(false);
              setResolving(false);
            }

            // Fire-and-forget: never block the caller on the sync.
            syncCleanerLocation(latitude, longitude);
            finish(newLocation);
            const address = await getAddressFromCoordinates(latitude, longitude);
            if (isCurrent() && address) setLocation({...newLocation, address});
          },
          (err) => {
            clearTimeout(timeout);
            if (gpsFinished || !isCurrent()) { finish(null); return; }
            gpsFinished = true;
            if (isCurrent()) setLoading(false);

            // Codes come from the W3C geolocation spec: 1 permission,
            // 2 position unavailable (location services off, no signal),
            // 3 timeout.
            const reason: LocationFailure =
              err?.code === 1
                ? "blocked"
                : err?.code === 2
                ? "unavailable"
                : err?.code === 3
                ? "timeout"
                : "unknown";

            const message =
              reason === "blocked"
                ? "Location access is turned off for this app"
                : reason === "unavailable"
                ? "Your device couldn't determine a location. Check that Location Services are on."
                : reason === "timeout"
                ? "Location request timed out"
                : err?.message || "Failed to get location";

            settleWithFallback(reason, message, requestId).then(finish);
          },
          {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 60000,
            distanceFilter: 0,
          }
        );
      });
    } catch (err) {
      if (!isCurrent()) return null;
      setLoading(false);
      return settleWithFallback("unknown", "Couldn't get your location. Try again or choose a location manually.", requestId);
    }
  }, [requestPermission, settleWithFallback]);

  /**
   * Google Play "Prominent Disclosure and Consent Requirement":
   * the in-app disclosure must be shown and accepted BEFORE the runtime
   * permission dialog is triggered. Acceptance is persisted so the
   * disclosure is only shown once.
   */
  const getLocation = useCallback(async () => {
    try {
      const accepted = await withDeadline(AsyncStorage.getItem(LOCATION_DISCLOSURE_KEY), 3000);
      if (accepted !== "true") {
        // Waiting for consent is not a location request in flight.
        setDisclosureVisible(true);
        setResolving(false);
        return null;
      }
    } catch (err) {
      console.log("Location disclosure flag read error:", err);
      setDisclosureVisible(true);
      setResolving(false);
      return null;
    }
    return fetchLocation();
  }, [fetchLocation]);

  const acceptDisclosure = useCallback(async () => {
    setDisclosureVisible(false);
    try {
      await withDeadline(AsyncStorage.setItem(LOCATION_DISCLOSURE_KEY, "true"), 3000);
    } catch (err) {
      console.log("Location disclosure flag write error:", err);
    }
    await fetchLocation();
  }, [fetchLocation]);

  const declineDisclosure = useCallback(() => {
    setDisclosureVisible(false);
    // Android only (iOS has no decline path). The runtime prompt is never
    // shown, but a saved service address can still place them on the map.
    settleWithFallback("denied", "Location access declined");
  }, [settleWithFallback]);

  /**
   * Deep link to the app's own settings page — the only recovery from a
   * "blocked" outcome, since neither OS will prompt again.
   */
  const openAppSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (err) {
      console.log("Unable to open app settings:", err);
    }
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  /**
   * Backstop. `resolving` blocks UI, so it must never be able to stick on
   * because some native callback did not arrive. Every real path clears it
   * well before this fires; if one ever does not, the screen falls through to
   * its empty state (which carries Try Again / Choose a Location) instead of
   * spinning forever.
   */
  useEffect(() => {
    if (!resolving) return;
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        console.log("Location resolve exceeded hard cap — releasing UI");
        setResolving(false);
      }
    }, RESOLVE_HARD_CAP_MS);
    return () => clearTimeout(timer);
  }, [resolving]);

  return {
    location,
    locationSource,
    loading,
    resolving,
    error,
    failure,
    permissionBlocked: failure === "blocked",
    refresh: getLocation,
    openAppSettings,
    disclosureVisible,
    acceptDisclosure,
    declineDisclosure,
  };
};
