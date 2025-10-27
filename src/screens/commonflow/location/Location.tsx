import React, {useRef, useState, useEffect} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  Text,
  Alert,
} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useDispatch} from 'react-redux';
import axios from 'axios';
import {Colors} from '../../../constants/Themes';

export default function Location({navigation}: any) {
  const mapRef = useRef(null);
  const [marker, setMarker] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.latitude},${loc.longitude}&key=${'AIzaSyBpswfk8p6S57T_TqGTCUaDi7c6oHvHGuA'}`,
        );
        const results = response.data.results;
        const address = results[0]?.formatted_address || 'Current Location';
      } catch (error) {}
    };

    fetchUserLocation();
  }, []);

  const handleMapPress = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    console.log('🖱️ Map Pressed at:', coordinate);

    setMarker(coordinate);

    mapRef.current.animateToRegion({
      ...coordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${key}`,
      );
      const results = response.data.results;
      const address = results[0]?.formatted_address || 'Selected Location';

      setSelectedLocation({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        name: address,
      });

      console.log('📍 Selected Location:', {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        name: address,
      });
    } catch (error) {
      setSelectedLocation({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        name: 'Unknown Location',
      });
    }
  };

  const handleApplyFilter = () => {
    if (!selectedLocation) {
      return;
    }

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Top Row */}
      <View style={styles.topRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            console.log('🔙 Back button pressed');
            navigation.goBack();
          }}
          style={[styles.backButton, {backgroundColor: 'white'}]}>
          {/* <AntDesign
            name="arrowleft"
            size={RFPercentage(2.7)}
            color={theme.grey}
          /> */}
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            placeholder={'Search Location'}
            predefinedPlaces={[]} 
            fetchDetails={true}
            onPress={(data, details = null) => {
              const location = details?.geometry.location;
              const coordinate = {
                latitude: location.lat,
                longitude: location.lng,
                name: data.description,
              };

              mapRef?.current.animateToRegion({
                ...coordinate,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });

              setMarker(coordinate);
              setSelectedLocation(coordinate);
            }}
            query={{
              key: 'AIzaSyBpswfk8p6S57T_TqGTCUaDi7c6oHvHGuA',
              language: 'en',
            }}
            styles={{
              poweredContainer: {backgroundColor: 'white'},
              textInput: {
                height: RFPercentage(6),
                fontSize: RFPercentage(1.8),
                fontFamily: 'Poppins_400Regular',
                backgroundColor: 'white',
                color: 'black',
              },
              listView: {backgroundColor: 'white'},
              row: {backgroundColor: 'white'},
              description: {color: 'black'},
              container: {flex: 1},
            }}
            textInputProps={{
              placeholderTextColor: 'gray',
              onChangeText: text => {},
            }}
          />
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={handleMapPress}>
        {marker && (
          <Marker
            coordinate={marker}
            title={selectedLocation?.name || 'Selected Location'}
          />
        )}
      </MapView>

      {/* Apply Button */}
      {selectedLocation && (
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleApplyFilter}
            style={[styles.applyButton, {backgroundColor: Colors.gradient1}]}>
            <Text style={styles.applyButtonText}>{'Apply Location'}</Text>
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
    top: Platform.OS === 'ios' ? RFPercentage(8) : RFPercentage(2),
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
    top: RFPercentage(0.3),
  },
  searchContainer: {flex: 1},
  buttonWrapper: {
    position: 'absolute',
    bottom: RFPercentage(5),
    alignSelf: 'center',
  },
  applyButton: {
    paddingHorizontal: RFPercentage(2.4),
    paddingVertical: RFPercentage(1.5),
    borderRadius: RFPercentage(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: RFPercentage(1.8),
    fontFamily: 'Poppins_500Medium',
  },
});
