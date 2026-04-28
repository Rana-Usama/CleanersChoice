import { useState, useEffect, useCallback } from "react";
import {
  PermissionsAndroid,
  Platform,
} from "react-native";
import Geolocation from "@react-native-community/geolocation";
import axios from "axios";

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

  const getLocation = useCallback(async () => {
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

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return {
    location,
    loading,
    error,
    refresh: getLocation,
  };
};
