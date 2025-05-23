import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {Colors, Fonts} from '../../../constants/Themes';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../routers/StackNavigator';

const JobPosted = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'JobPosted'>>();
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      navigation.navigate('Home');
    }, 1000);
  };

  return (
    <LinearGradient
      colors={[Colors.gradient1, Colors.gradient2]}
      style={styles.safeArea}>
      <View style={styles.centeredView}>
        <AntDesign
          name="checkcircleo"
          color={Colors.background}
          size={RFPercentage(10)}
        />
        <Text style={styles.successText}>Job Posted Successfully!</Text>
      </View>
      <TouchableOpacity onPress={handleNext} disabled={loading}>
        <View style={styles.homeButton}>
          {loading ? (
            <>
              <ActivityIndicator
                size={'small'}
                color={Colors.placeholderColor}
              />
            </>
          ) : (
            <>
              <Text style={styles.homeButtonText}>Home</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default JobPosted;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    position: 'relative',
  },
  centeredView: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  successText: {
    color: Colors.background,
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(2.2),
    marginTop: RFPercentage(4),
  },
  homeButton: {
    width: RFPercentage(18),
    height: RFPercentage(5),
    backgroundColor: Colors.background,
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    bottom: RFPercentage(10),
  },
  homeButtonText: {
    color: 'rgba(37, 50, 117, 1)',
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.8),
  },
});
