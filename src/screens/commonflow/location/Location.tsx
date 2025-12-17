import React, {useRef, useState} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  Text,
  TextInput,
  FlatList,
  Keyboard,
  StatusBar,
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
import {GOOGLE_PLACES_API_KEY} from '@env';

export default function Location({navigation, route}: any) {
  const mapRef = useRef<MapView>(null);
  const [marker, setMarker] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>({
    latitude: null,
    longitude: null,
    name: '',
  });
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);
  const dispatch = useDispatch();
  const {location: isLocationSelect} = route?.params || {};

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
          params: {input: text, key: GOOGLE_PLACES_API_KEY, language: 'en'},
        },
      );
      if (res.data.status === 'OK') setSuggestions(res.data.predictions);
      else console.log('⚠️ Places API Error:', res.data.status);
    } catch (err: any) {
      console.log('❌ Autocomplete Error:', err.message);
    }
  };

  const handlePlaceSelectAndroid = async (item: any) => {
    setIsSelectingSuggestion(true);
    
    try {
      Keyboard.dismiss();
      const detailRes = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {params: {place_id: item.place_id, key: GOOGLE_PLACES_API_KEY}},
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

      // Clear the selecting flag after a short delay
      setTimeout(() => {
        setIsSearchFocused(false);
        setIsSelectingSuggestion(false);
      }, 400);

      if (isNaN(coordinate.latitude) || isNaN(coordinate.longitude)) {
        console.log('Invalid coordinates:', coordinate);
        return;
      }

      mapRef.current?.animateToRegion({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error: any) {
      console.log('❌ Place Detail Error:', error.message);
      setIsSelectingSuggestion(false);
    }
  };

  const handleMapPress = async (event: any) => {
    // Prevent map interaction when suggestions are visible or selecting
    if (isSelectingSuggestion || (isSearchFocused && suggestions.length > 0)) {
      return;
    }

    const coordinate = event.nativeEvent.coordinate;

    if (isNaN(coordinate.latitude) || isNaN(coordinate.longitude)) {
      console.log('Invalid coordinates:', coordinate);
      return;
    }

    mapRef.current?.animateToRegion({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    setMarker(coordinate);
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${GOOGLE_PLACES_API_KEY}`,
      );
      const address =
        response.data.results[0]?.formatted_address || 'Selected Location';
      setSelectedLocation({...coordinate, name: address});
      setQuery(address);
    } catch (error: any) {
      console.log('❌ Reverse Geocode Error:', error.message);
    }
  };

  const handleTextInputBlur = () => {
    if (!isSelectingSuggestion) {
      setIsSearchFocused(false);
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
            <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      
      <View style={styles.topRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          style={[styles.backButton, {backgroundColor: 'white'}]}>
          <AntDesign name="arrowleft" size={RFPercentage(2.7)} color="gray" />
        </TouchableOpacity>
        <View style={{width: '90%'}}>
          <TextInput
            value={query}
            onChangeText={fetchPlacesAndroid}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={handleTextInputBlur}
            placeholder="Search Location"
            placeholderTextColor="gray"
            style={styles.input}
          />

          {isSearchFocused && suggestions?.length > 0 && (
            <View style={styles.suggestionsContainer}>
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
                    <Text style={styles.description}>{item.description}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      </View>

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
        onPress={handleMapPress}>
        {marker?.latitude && marker?.longitude && (
          <Marker
            coordinate={marker}
            title={selectedLocation?.name || 'Selected Location'}
          />
        )}
      </MapView>

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
  topRow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? RFPercentage(8) : RFPercentage(8),
    flexDirection: 'row',
    width: '90%',
    alignSelf: 'center',
    zIndex: 10,
  },
  backButton: {
    width: RFPercentage(5.3),
    height: RFPercentage(5.3),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: RFPercentage(1),
    elevation: 3,
    top: Platform.OS === 'android' ? RFPercentage(0.5) : 2,
  },
  input: {
    height: RFPercentage(6),
    fontSize: RFPercentage(1.8),
    backgroundColor: 'white',
    color: 'black',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '90%',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? RFPercentage(7) : RFPercentage(7),
    width: '90%',
    zIndex: 1000,
  },
  listView: {
    backgroundColor: 'white',
    borderRadius: 8,
    maxHeight: RFPercentage(40),
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