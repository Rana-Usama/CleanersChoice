import { useState, useEffect, useCallback } from "react";
import {
  PermissionsAndroid,
  Platform,
} from "react-native";
import Geolocation from "@react-native-community/geolocation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import haversine from "haversine";
import axios from "axios";

const LOCATION_DISCLOSURE_KEY = "@location_disclosure_accepted";

interface Location {
  latitude: number;
  longitude: number;
  address: string | null;
}
import {GOOGLE_PLACES_API_KEY} from '@env';

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


export const useCurrentLocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [disclosureVisible, setDisclosureVisible] = useState<boolean>(false);

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_PLACES_API_KEY}`
      );

      const formattedAddress =
        response.data?.results?.[0]?.formatted_address || "Unknown Address";

      return formattedAddress;
    } catch (err) {
      console.log("Reverse Geocoding Error:", err);
      return null;
    }
  };

  const requestPermission = useCallback(async () => {
    if (Platform.OS === "ios") {
      return new Promise((resolve) => {
        Geolocation.requestAuthorization(
          () => resolve(true),
          () => resolve(false)
        );
      });
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      return false;
    }
  }, []);

  const fetchLocation = useCallback(async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setError("Location permission denied");
        return null;
      }

      setLoading(true);
      setError(null);

      return new Promise<Location | null>((resolve) => {
        const timeout = setTimeout(() => {
          setError("Location request timed out");
          setLoading(false);
          resolve(null);
        }, 20000);

        Geolocation.getCurrentPosition(
          async (position) => {
            clearTimeout(timeout);

            const { latitude, longitude } = position.coords;

            // 🔥 Fetch full formatted address
            const address = await getAddressFromCoordinates(latitude, longitude);

            const newLocation: Location = {
              latitude,
              longitude,
              address,
            };

            setLocation(newLocation);
            setLoading(false);
            // Fire-and-forget: never block the caller on the sync.
            syncCleanerLocation(latitude, longitude);
            resolve(newLocation);
          },
          (err) => {
            clearTimeout(timeout);
            setError(err.message);
            setLoading(false);
            resolve(null);
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
      setError("Failed to get location");
      setLoading(false);
      return null;
    }
  }, [requestPermission]);

  /**
   * Google Play "Prominent Disclosure and Consent Requirement":
   * the in-app disclosure must be shown and accepted BEFORE the runtime
   * permission dialog is triggered. Acceptance is persisted so the
   * disclosure is only shown once.
   */
  const getLocation = useCallback(async () => {
    try {
      const accepted = await AsyncStorage.getItem(LOCATION_DISCLOSURE_KEY);
      if (accepted !== "true") {
        setDisclosureVisible(true);
        return null;
      }
    } catch (err) {
      console.log("Location disclosure flag read error:", err);
    }
    return fetchLocation();
  }, [fetchLocation]);

  const acceptDisclosure = useCallback(async () => {
    setDisclosureVisible(false);
    try {
      await AsyncStorage.setItem(LOCATION_DISCLOSURE_KEY, "true");
    } catch (err) {
      console.log("Location disclosure flag write error:", err);
    }
    await fetchLocation();
  }, [fetchLocation]);

  const declineDisclosure = useCallback(() => {
    setDisclosureVisible(false);
    setError("Location access declined");
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return {
    location,
    loading,
    error,
    refresh: getLocation,
    disclosureVisible,
    acceptDisclosure,
    declineDisclosure,
  };
};
