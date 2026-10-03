import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import axios from 'axios';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {GOOGLE_PLACES_API_KEY} from '@env';
import {Colors, Fonts} from '../constants/Themes';
import {parseAddressComponents} from '../utils/addressComponents';
import {formatServiceAreaName, ServiceArea} from '../utils/cleanerProfile';

/**
 * Inline "City, State" picker used for the cleaner's required service location.
 *
 * Replaces the old path (Dashboard → Complete Profile → Setup Services → tap the
 * location card → full-screen map) with a plain form field the cleaner fills in
 * where they fill in everything else.
 *
 * - Google Places Autocomplete restricted to `(cities)` in the US, so the value
 *   is always a city/state — never a street address (privacy, and it matches
 *   what the client asked for).
 * - Place Details is requested with an explicit `fields` mask (geometry +
 *   address_components only) and a session token, so a pick is billed as one
 *   autocomplete session instead of per-keystroke + full details.
 * - Typing after a pick clears the value: the field is only valid when a real
 *   suggestion was chosen, which guarantees coordinates for distance search.
 * - Suggestions render in the normal layout flow (not absolutely positioned) so
 *   they are never clipped by a parent ScrollView / KeyboardAwareScrollView.
 */

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting?: {main_text?: string; secondary_text?: string};
}

interface Props {
  value: ServiceArea | null;
  onChange: (area: ServiceArea | null) => void;
  error?: string | null;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  inputTextStyle?: StyleProp<TextStyle>;
  onFocus?: () => void;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

const newSessionToken = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const CityStateField: React.FC<Props> = ({
  value,
  onChange,
  error,
  placeholder = 'Service City, State',
  containerStyle,
  inputContainerStyle,
  inputTextStyle,
  onFocus,
}) => {
  const [query, setQuery] = useState(value?.name ?? '');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const sessionToken = useRef(newSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  // Keep the text in sync when the parent sets/prefills a value.
  useEffect(() => {
    if (value?.name) setQuery(value.name);
  }, [value?.name]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const fetchPredictions = async (text: string) => {
    const id = ++requestId.current;
    setSearching(true);
    try {
      const res = await axios.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        {
          params: {
            input: text,
            key: GOOGLE_PLACES_API_KEY,
            language: 'en',
            types: '(cities)',
            components: 'country:us',
            sessiontoken: sessionToken.current,
          },
        },
      );
      if (id !== requestId.current) return; // a newer keystroke won
      const status = res?.data?.status;
      if (status === 'OK') {
        setPredictions(res.data.predictions ?? []);
        setLookupError(null);
      } else if (status === 'ZERO_RESULTS') {
        setPredictions([]);
        setLookupError(null);
      } else {
        console.log('[CityStateField] autocomplete error:', res?.data);
        setPredictions([]);
        setLookupError('Location search is unavailable. Please try again.');
      }
    } catch (err: any) {
      if (id !== requestId.current) return;
      console.log('[CityStateField] autocomplete failed:', err?.message);
      setPredictions([]);
      setLookupError('Network error. Check your connection and try again.');
    } finally {
      if (id === requestId.current) setSearching(false);
    }
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (value) onChange(null); // editing invalidates the previous pick
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < MIN_QUERY_LENGTH) {
      requestId.current++;
      setPredictions([]);
      setSearching(false);
      return;
    }
    debounceRef.current = setTimeout(
      () => fetchPredictions(text.trim()),
      DEBOUNCE_MS,
    );
  };

  const handleSelect = async (prediction: Prediction) => {
    Keyboard.dismiss();
    setResolving(true);
    setPredictions([]);
    try {
      const res = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: prediction.place_id,
            key: GOOGLE_PLACES_API_KEY,
            fields: 'geometry,address_components,place_id',
            sessiontoken: sessionToken.current,
          },
        },
      );
      const result = res?.data?.result;
      const lat = result?.geometry?.location?.lat;
      const lng = result?.geometry?.location?.lng;
      const {city, state} = parseAddressComponents(result?.address_components);
      const fallbackCity = prediction.structured_formatting?.main_text ?? null;
      const resolvedCity = city ?? fallbackCity;

      if (
        !resolvedCity ||
        !state ||
        typeof lat !== 'number' ||
        typeof lng !== 'number'
      ) {
        console.log('[CityStateField] incomplete place details:', res?.data);
        setLookupError('Please choose a city from the list.');
        onChange(null);
        return;
      }

      const area: ServiceArea = {
        name: formatServiceAreaName(resolvedCity, state),
        city: resolvedCity,
        state,
        latitude: lat,
        longitude: lng,
        placeId: prediction.place_id,
      };
      setQuery(area.name);
      setLookupError(null);
      onChange(area);
    } catch (err: any) {
      console.log('[CityStateField] place details failed:', err?.message);
      setLookupError('Could not load that city. Please try again.');
      onChange(null);
    } finally {
      // A session ends with a details call — start a fresh one for the next pick.
      sessionToken.current = newSessionToken();
      setResolving(false);
    }
  };

  const handleClear = () => {
    requestId.current++;
    setQuery('');
    setPredictions([]);
    setLookupError(null);
    onChange(null);
  };

  const shownError = lookupError || error;
  const showList = focused && predictions.length > 0;
  const isSelected = !!value;

  const rightAdornment = useMemo(() => {
    if (searching || resolving) {
      return <ActivityIndicator size="small" color={Colors.gradient1} />;
    }
    if (isSelected) {
      return (
        <Ionicons
          name="checkmark-circle"
          size={RFPercentage(2.3)}
          color={Colors.green500}
        />
      );
    }
    if (query.length > 0) {
      return (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          accessibilityLabel="Clear service location">
          <Ionicons
            name="close-circle"
            size={RFPercentage(2.2)}
            color={Colors.gray400}
          />
        </TouchableOpacity>
      );
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searching, resolving, isSelected, query.length]);

  return (
    <View style={containerStyle}>
      <View
        style={[
          styles.inputContainer,
          inputContainerStyle,
          focused && styles.inputFocused,
          !!shownError && styles.inputError,
        ]}>
        <View style={styles.row}>
          <Ionicons
            name="location-outline"
            size={RFPercentage(2.2)}
            color={isSelected ? Colors.gradient1 : Colors.secondaryText}
            style={styles.leadingIcon}
          />
          <TextInput
            value={query}
            onChangeText={handleChangeText}
            onFocus={() => {
              setFocused(true);
              onFocus?.();
            }}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            placeholderTextColor={Colors.placeholderColor}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
            style={[styles.inputText, inputTextStyle, styles.flex]}
            accessibilityLabel="Service location, city and state"
          />
          {rightAdornment}
        </View>
      </View>

      {showList && (
        <View style={styles.suggestions}>
          {predictions.slice(0, 5).map((item, index) => (
            <TouchableOpacity
              key={item.place_id}
              activeOpacity={0.7}
              onPress={() => handleSelect(item)}
              style={[
                styles.suggestionItem,
                index > 0 && styles.suggestionDivider,
              ]}>
              <Ionicons
                name="business-outline"
                size={RFPercentage(1.9)}
                color={Colors.secondaryText}
              />
              <View style={styles.flex}>
                <Text style={styles.suggestionMain} numberOfLines={1}>
                  {item.structured_formatting?.main_text ?? item.description}
                </Text>
                {!!item.structured_formatting?.secondary_text && (
                  <Text style={styles.suggestionSecondary} numberOfLines={1}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {shownError ? (
        <Text style={styles.errorText}>{shownError}</Text>
      ) : !isSelected && focused ? (
        <Text style={styles.helperText}>
          Start typing your city, then pick it from the list.
        </Text>
      ) : null}
    </View>
  );
};

export default CityStateField;

const styles = StyleSheet.create({
  flex: {flex: 1},
  row: {flexDirection: 'row', alignItems: 'center'},
  inputContainer: {
    height: RFPercentage(7),
    borderWidth: RFPercentage(0.14),
    borderColor: Colors.gray200,
    borderRadius: RFPercentage(2.1),
    paddingHorizontal: RFPercentage(2.2),
    backgroundColor: Colors.white,
    justifyContent: 'center',
  },
  inputFocused: {borderColor: Colors.gradient1},
  inputError: {borderColor: Colors.error},
  leadingIcon: {marginRight: RFPercentage(1)},
  inputText: {
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.fontRegular,
    color: Colors.inputTextColor,
    paddingVertical: 0,
  },
  suggestions: {
    marginTop: RFPercentage(0.8),
    borderRadius: RFPercentage(1.6),
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(1.2),
    paddingHorizontal: RFPercentage(1.8),
    paddingVertical: RFPercentage(1.4),
  },
  suggestionDivider: {borderTopWidth: 1, borderTopColor: Colors.slate100},
  suggestionMain: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.75),
    color: Colors.gray800,
  },
  suggestionSecondary: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
    marginTop: 1,
  },
  errorText: {
    color: Colors.error,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
    marginTop: RFPercentage(0.55),
    marginLeft: RFPercentage(0.45),
  },
  helperText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.45),
    fontFamily: Fonts.fontRegular,
    marginTop: RFPercentage(0.55),
    marginLeft: RFPercentage(0.45),
  },
});
