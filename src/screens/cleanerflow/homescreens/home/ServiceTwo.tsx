import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
  } from 'react-native';
  import React from 'react';
  import { RFPercentage } from 'react-native-responsive-fontsize';
  import { Colors, Icons, Fonts } from '../../../../constants/Themes';
  import HeaderBack from '../../../../components/HeaderBack';
  import InfoHeader from '../../../../components/InfoHeader';
  import TimeLine from '../../../../components/TimeLine';
  import GradientButton from '../../../../components/GradientButton';
import { useNavigation } from '@react-navigation/native';
  
  const images = [
    { id: 1, image: Icons.gallery },
    { id: 2, image: Icons.gallery },
    { id: 3, image: Icons.gallery },
  ];
  
  const ServiceTwo: React.FC = () => {
    const navigation = useNavigation()

    return (
      <SafeAreaView style={styles.safeArea}>
        <HeaderBack title="Service" textStyle={styles.headerText} />
        <View style={styles.container}>
          <View style={styles.infoHeaderContainer}>
            <InfoHeader />
          </View>
        </View>
  
        <View style={styles.timelineContainer}>
          <TimeLine stepTwo={true} />
        </View>
  
        <View style={styles.container}>
          <View style={styles.galleryTextContainer}>
            <Text style={styles.galleryText}>Gallery Pictures (Optional)</Text>
          </View>
          <View style={styles.flatListContainer}>
            <FlatList
              numColumns={3}
              data={images}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity>
                  <View style={styles.imageContainer}>
                    <Image source={item.image} resizeMode="contain" style={styles.image} />
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
          <View style={styles.buttonContainer}>
            <GradientButton title="Next"  onPress={()=>navigation.navigate('ServiceThree')} />
          </View>
        </View>
      </SafeAreaView>
    );
  };
  
  export default ServiceTwo;
  
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    container: {
      width: '90%',
      alignSelf: 'center',
    },
    headerText: {
      fontSize: RFPercentage(1.8),
    },
    infoHeaderContainer: {
      marginTop: RFPercentage(2.5),
    },
    timelineContainer: {
      marginTop: RFPercentage(2.8),
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    },
    galleryTextContainer: {
      marginTop: RFPercentage(2.5),
    },
    galleryText: {
      color: Colors.secondaryText,
      fontFamily: Fonts.fontMedium,
      fontSize: RFPercentage(1.6),
    },
    flatListContainer: {
      marginTop: RFPercentage(2),
    },
    imageContainer: {
      width: RFPercentage(13),
      height: RFPercentage(13),
      backgroundColor: 'rgba(243, 244, 246, 1)',
      borderRadius: RFPercentage(1),
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: RFPercentage(0.6),
    },
    image: {
      width: RFPercentage(3),
      height: RFPercentage(3),
    },
    buttonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: RFPercentage(5),
    },
  });
  