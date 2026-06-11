import { useState, useEffect, useCallback } from "react";
import {
  PermissionsAndroid,
  Platform,
} from "react-native";
import Geolocation from "@react-native-community/geolocation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const LOCATION_DISCLOSURE_KEY = "@location_disclosure_accepted";

interface Location {
  latitude: number;
  longitude: number;
  address: string | null;
}
import {GOOGLE_PLACES_API_KEY} from '@env';


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
