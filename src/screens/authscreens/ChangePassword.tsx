import {
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {Fonts, IMAGES, Colors, Icons} from '../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../routers/StackNavigator';
import InputField from '../../components/InputField';
import GradientButton from '../../components/GradientButton';
import Entypo from 'react-native-vector-icons/Entypo';

const {width, height} = Dimensions.get('window');

const ChangePassword: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'ChangePassword'>
    >();

    const [loading, setLoading] = useState(false)
              
                const handleNext = () => {
                  setLoading(true)
                  setTimeout(() => {
                    navigation.navigate('SignIn')
                    setLoading(false)
                  }, 2000);
                }
    
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <View style={styles.container}>
          <View
            style={{
              marginVertical: RFPercentage(2),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width:'90%',
              alignSelf:'center'
            }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Entypo
                name="chevron-thin-left"
                color={Colors.secondaryText}
                size={RFPercentage(2)}
              />
            </TouchableOpacity>
            <Text
              style={{
                color: Colors.primaryText,
                fontFamily: Fonts.semiBold,
                fontSize: RFPercentage(2.3),
                textAlign: 'center',
              }}>
              Set New Password
            </Text>
            <View></View>
          </View>

          <View
            style={{
              alignSelf: 'center',
              marginTop: RFPercentage(1.8),
              width: '95%',
              alignItems: 'center',
            }}>
            <InputField placeholder="Enter new Password" />
            <InputField placeholder="Repeat new Password" />
          </View>

          <View
            style={{
              alignSelf: 'center',
              marginTop: RFPercentage(5),
              width: '90%',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <GradientButton title="Save" onPress={handleNext} loading={loading} />
          </View>
        </View>
        <View
          style={{
            position: 'absolute',
            bottom: RFPercentage(6),
            right: RFPercentage(1.5),
          }}>
          <Image
            source={IMAGES.stars}
            resizeMode="contain"
            style={{
              width: RFPercentage(8),
              height: RFPercentage(8),
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChangePassword;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    marginTop: Platform.OS == 'android' ? RFPercentage(4) : RFPercentage(-0.8),
    backgroundColor: Colors.background,
  },
 
});
