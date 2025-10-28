import {useState, useEffect, useCallback} from 'react';
import {PermissionsAndroid, Platform, Linking, Alert} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

interface Location {
  latitude: number;
  longitude: number;
}

export const useCurrentLocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'ios') {
      // For iOS, we can use requestAuthorization
      return new Promise((resolve) => {
        Geolocation.requestAuthorization(
          () => {
            console.log('📍 iOS Location Permission granted');
            resolve(true);
          },
          (error) => {
            console.log('❌ iOS Location Permission error:', error);
            resolve(false);
          }
        );
      });
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show nearby cleaners.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        console.log('📍 Android Location Permission Status:', granted);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.log('❌ Android Location Permission Error:', err);
        return false;
      }
    }
  }, []);

  const getLocation = useCallback(async () => {
    try {
      console.log('📍 Starting location request with @react-native-community/geolocation...');
      
      const hasPermission = await requestPermission();
      console.log('📍 Has Location Permission:', hasPermission);
      
      if (!hasPermission) {
        setError('Location permission denied');
        setLoading(false);
        return null;
      }

      setLoading(true);
      setError(null);

      return new Promise<Location | null>((resolve) => {
        const locationTimeout = setTimeout(() => {
          console.log('⏰ Location request timeout');
          setError('Location request timed out. Please check your GPS settings.');
          setLoading(false);
          resolve(null);
        }, 20000);

        Geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(locationTimeout);
            console.log('📍 Location obtained:', position.coords);
            const {latitude, longitude} = position.coords;
            const newLocation = {latitude, longitude};
            setLocation(newLocation);
            setLoading(false);
            resolve(newLocation);
          },
          (error) => {
            clearTimeout(locationTimeout);
            console.log('❌ Location Error Code:', error.code);
            console.log('❌ Location Error Message:', error.message);
            
            let errorMessage = 'Failed to get location';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission denied. Please enable location permissions in app settings.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location unavailable. Please check if location services are enabled on your device.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please check your GPS signal.';
                break;
              default:
                errorMessage = error.message || 'Unknown location error';
            }
            
            setError(errorMessage);
            setLoading(false);
            resolve(null);
          },
          {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 60000,
            distanceFilter: 0,
          },
        );
      });
    } catch (err) {
      console.log('❌ Get Location Catch Error:', err);
      setError('Failed to get location');
      setLoading(false);
      return null;
    }
  }, [requestPermission]);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return {location, loading, error, refresh: getLocation};
};