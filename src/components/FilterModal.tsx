import {StyleSheet, Text, View, KeyboardAvoidingView, TouchableOpacity,Modal, Animated,FlatList, Platform} from 'react-native';
import React, {useEffect, useRef} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import { BlurView } from '@react-native-community/blur';
import SearchField from './SearchField';
import GradientButton from './GradientButton';
import AntDesign from 'react-native-vector-icons/AntDesign'


const FilterModal = (props : any) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (props.modalVisible) {
          Animated.parallel([
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 10,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          Animated.parallel([
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }, [props.modalVisible]);


  return (
    <View style={styles.modalContainer}>
    <BlurView style={styles.blurView} blurType="light" blurAmount={5} />
    <Modal
      visible={props.modalVisible}
      transparent={true}
      animationType="none"
      onRequestClose={props.setModalVisible}>
      <KeyboardAvoidingView
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        style={{
          flex: 1,
          alignItems: 'center',
        }}>
        <Animated.View
          style={[
            styles.locationModal,
            {opacity: opacityAnim, transform: [{scale: scaleAnim}]},
          ]}>
          <View style={styles.modalInner}>
            <Text style={styles.applyLocation}>Apply Location</Text>
            <TouchableOpacity
              style={{position: 'absolute', right: 0}}
              onPress={props.setModalVisible}>
              <AntDesign
                name="closecircleo"
                size={RFPercentage(2.5)}
                color={Colors.secondaryText}
              />
            </TouchableOpacity>
          </View>
          <View style={{width: '100%', marginTop: RFPercentage(2)}}>
            <SearchField
              placeholder="Search Location"
              customStyle={{borderColor: 'rgba(39, 38, 38, 0.29)'}}
              value={props.query}
              onChangeText={props.handleSearch}
            />
          </View>
          {props.query.length > 0 && props.selectedLocation.length === 0 && (
            <View style={styles.queryContainer}>
              {props.filteredLocations.length === 0 ? (
                <>
                  <Text style={styles.queryText}>
                    No Location exist
                  </Text>
                </>
              ) : (
                <>
                  <FlatList
                    data={props.filteredLocations}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({item}) => (
                      <TouchableOpacity
                        onPress={() => {
                          props.setQuery(item);
                          props.setSelectedLocation(item);
                        }}>
                        <Text style={styles.queryText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </>
              )}
            </View>
          )}
          <View style={{position: 'absolute', bottom: RFPercentage(3)}}>
            <GradientButton
              title="Apply"
              onPress={props.handleLocationApply}
              loading={props.loactionLoading}
              disabled={
                props.query.length > 0 && props.filteredLocations.length != 0
                  ? false
                  : true
              }
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  </View>
  );
};

export default FilterModal;

const styles = StyleSheet.create({
    modalContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      },
      blurView: {
        width: '100%',
        height: '100%',
        position: 'absolute',
      },
      sliderStyle: {
        width: '100%',
        height: RFPercentage(3),
      },
      sliderLabelsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
      },
      sliderLabel: {
        color: Colors.secondaryText,
        fontSize: RFPercentage(1.8),
        fontFamily: Fonts.semiBold,
      },
      flatListContainer: {
        paddingHorizontal: RFPercentage(1.2),
        paddingTop: RFPercentage(1.5),
      },
      locationModal: {
        width: '90%',
        height: RFPercentage(50),
        alignSelf: 'center',
        backgroundColor: 'rgba(226, 238, 255, 0.9)',
        alignItems: 'center',
        borderRadius: RFPercentage(2.5),
        paddingHorizontal: RFPercentage(1.6),
        paddingVertical: RFPercentage(2.5),
        top: RFPercentage(20),
      },
      modalInner: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      },
      applyLocation: {
        color: Colors.secondaryText,
        fontFamily: Fonts.fontMedium,
        fontSize: RFPercentage(1.8),
      },
      queryContainer: {
        top: RFPercentage(0.5),
        width: '100%',
        backgroundColor: 'white',
        borderRadius: RFPercentage(1),
      },
      queryText: {
        padding: RFPercentage(2),
        fontSize: RFPercentage(1.6),
        borderBottomWidth: 1,
        borderBottomColor: Colors.inputFieldColor,
        fontFamily: Fonts.fontRegular,
        color: Colors.placeholderColor,
      },
      rangeModal: {
        width: '90%',
        height: '50%',
        alignSelf: 'center',
        backgroundColor: 'rgba(226, 238, 255, 0.9)',
        alignItems: 'center',
        borderRadius: RFPercentage(2.5),
        top: RFPercentage(20),
        paddingHorizontal: RFPercentage(1.6),
        paddingVertical: RFPercentage(2.5),
      },
      range: {
        textAlign: 'center',
        fontFamily: Fonts.fontMedium,
        fontSize: RFPercentage(1.7),
        color: Colors.primaryText,
      },
});
