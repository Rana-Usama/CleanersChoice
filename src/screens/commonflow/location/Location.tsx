import React, {useRef, useState} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  Text,
  KeyboardAvoidingView,
  TextInput,
  FlatList,
} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useDispatch} from 'react-redux';
import axios from 'axios';
import {Colors} from '../../../constants/Themes';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {
  setUserLocation,
  setFilterLocation,
} from '../../../redux/location/Actions';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';

export default function Location({navigation, route}: any) {
  const mapRef = useRef<MapView>(null);
  const placesRef = useRef<any>(null);

  const [marker, setMarker] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>({
    latitude: null,
    longitude: null,
    name: '',
  });
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const dispatch = useDispatch();
  const {location: isLocationSelect} = route?.params || {};

  const GOOGLE_API_KEY = 'AIzaSyBpswfk8p6S57T_TqGTCUaDi7c6oHvHGuA';

  // Android: Fetch autocomplete suggestions
  const fetchPlacesAndroid = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await axios.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        {
          params: {input: text, key: GOOGLE_API_KEY, language: 'en'},
        },
      );
      if (res.data.status === 'OK') setSuggestions(res.data.predictions);
      else console.log('⚠️ Places API Error:', res.data.status);
    } catch (err: any) {
      console.log('❌ Autocomplete Error (Android):', err.message);
    }
  };

  const handlePlaceSelectAndroid = async (item: any) => {
    try {
      const detailRes = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {params: {place_id: item.place_id, key: GOOGLE_API_KEY}},
      );
      const loc = detailRes.data.result.geometry.location;
      const coordinate = {
        latitude: loc.lat,
        longitude: loc.lng,
        name: item.description,
      };
      setMarker(coordinate);
      setSelectedLocation(coordinate);
      setSuggestions([]);
      setQuery(item.description);
      setIsSearchFocused(false);
      mapRef.current?.animateToRegion({
        ...coordinate,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error: any) {
      console.log('❌ Place Detail Error:', error.message);
    }
  };

  const handleMapPress = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    setMarker(coordinate);
    mapRef.current?.animateToRegion({
      ...coordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${GOOGLE_API_KEY}`,
      );
      const address =
        response.data.results[0]?.formatted_address || 'Selected Location';
      setSelectedLocation({...coordinate, name: address});
      setQuery(address);
    } catch (error: any) {
      console.log('❌ Reverse Geocode Error:', error.message);
    }
  };

  const handleApplyFilter = () => {
    if (!selectedLocation.latitude) return;
    if (isLocationSelect) dispatch(setUserLocation(selectedLocation));
    else dispatch(setFilterLocation(selectedLocation));
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        pointerEvents={
          isSearchFocused && suggestions.length > 0 ? 'none' : 'auto'
        }
        onPress={e => {
          if (isSearchFocused && suggestions.length > 0) return;
          handleMapPress(e);
        }}>
        {marker && (
          <Marker
            coordinate={marker}
            title={selectedLocation?.name || 'Selected Location'}
          />
        )}
      </MapView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.topContainer}>
        <View style={styles.searchRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={[styles.backButton, {backgroundColor: 'white'}]}>
            <AntDesign name="arrowleft" size={RFPercentage(2.7)} color="gray" />
          </TouchableOpacity>

          <View style={styles.searchWrapper}>
            {Platform.OS === 'ios' ? (
              <GooglePlacesAutocomplete
                ref={placesRef}
                placeholder="Search Location"
                fetchDetails
                enablePoweredByContainer={false}
                debounce={300}
                minLength={2}
                predefinedPlaces={[]}
                query={{
                  key: GOOGLE_API_KEY,
                  language: 'en',
                }}
                onPress={(data, details = null) => {
                  if (!details?.geometry?.location) return;
                  const coordinate = {
                    latitude: details.geometry.location.lat,
                    longitude: details.geometry.location.lng,
                    name: data.description,
                  };
                  setMarker(coordinate);
                  setSelectedLocation(coordinate);
                  mapRef.current?.animateToRegion({
                    ...coordinate,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  });
                  setQuery(data.description);
                  setIsSearchFocused(false);
                }}
                textInputProps={{
                  onFocus: () => setIsSearchFocused(true),
                  onBlur: () => setIsSearchFocused(false),
                  clearButtonMode: 'while-editing',
                }}
                styles={{
                  textInputContainer: {
                    backgroundColor: 'white',
                    borderRadius: 8,
                  },
                  textInput: {
                    height: RFPercentage(5),
                    fontSize: RFPercentage(1.8),
                  },
                  listView: {
                    backgroundColor: 'white',
                    borderRadius: 8,
                    maxHeight: RFPercentage(40),
                    zIndex: 9999,
                    elevation: 10,
                    marginTop:10
                  },
                }}
              />
            ) : (
              <>
                <TextInput
                  value={query}
                  onChangeText={fetchPlacesAndroid}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search Location"
                  placeholderTextColor="gray"
                  style={styles.input}
                />

                {isSearchFocused && suggestions?.length > 0 && (
                  <FlatList
                    data={suggestions}
                    keyExtractor={item => item.place_id}
                    keyboardShouldPersistTaps="handled"
                    style={styles.listView}
                    renderItem={({item}) => (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handlePlaceSelectAndroid(item)}
                        style={styles.listItem}>
                        <Text style={styles.description}>
                          {item.description}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {selectedLocation?.latitude && (
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleApplyFilter}
            style={[styles.applyButton, {backgroundColor: Colors.gradient1}]}>
            <Text style={styles.applyButtonText}>Apply Location</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  map: {...StyleSheet.absoluteFillObject},
  topContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? RFPercentage(6) : RFPercentage(5),
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: RFPercentage(2),
  },
  searchRow: {flexDirection: 'row', width: '100%', top: RFPercentage(2)},
  backButton: {
    width: RFPercentage(5.3),
    height: RFPercentage(5.3),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFPercentage(1),
    elevation: 3,
    top: Platform.OS === 'android' ?  RFPercentage(0.5) : 0,
  },
  searchWrapper: {flex: 1, zIndex: 9999, position: 'relative'},
  input: {
    height: RFPercentage(6),
    fontSize: RFPercentage(1.8),
    backgroundColor: 'white',
    color: 'black',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  listView: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 8,
    maxHeight: RFPercentage(40),
    zIndex: 9999,
    position: 'absolute',
    width: '100%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  description: {color: 'black', fontSize: RFPercentage(1.7)},
  buttonWrapper: {
    position: 'absolute',
    bottom: RFPercentage(5),
    alignSelf: 'center',
    zIndex: 9998,
  },
  applyButton: {
    paddingHorizontal: RFPercentage(3),
    paddingVertical: RFPercentage(1.3),
    borderRadius: RFPercentage(10),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  applyButtonText: {
    color: 'white',
    fontSize: RFPercentage(1.8),
    fontFamily: 'Poppins-Medium',
  },
});
