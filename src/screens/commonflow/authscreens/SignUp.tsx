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
import {Fonts, IMAGES, Colors, Icons} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../routers/StackNavigator';
import {RadioButtonInput} from 'react-native-simple-radio-button';
import HeaderComponent from '../../../components/HeaderComponent';
import InputField from '../../../components/InputField';
import PasswordField from '../../../components/PasswordField';
import GradientButton from '../../../components/GradientButton';
import ImagePicker from 'react-native-image-crop-picker';
import {useSelector} from 'react-redux';

const SignUp: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'SignUp'>>();
  const [selected, setSelected] = useState<boolean>(false);
  const [img, setImg] = useState(null);
  const [name, setName] = useState('');
  const [email, SetEmail] = useState('');
  const [phone, SetPhone] = useState('');
  const [password, SetPassword] = useState('');
  const [confirmPassword, SetConfirmPassword] = useState('');

  const userFlow = useSelector(state => state.userFlow);

  const handleNext = () => {
    if (userFlow?.userFlow === 'Customer') {
      navigation.navigate('Home');
    } else {
      navigation.navigate('Premium');
    }
  };

  const uploadImg = () => {
    ImagePicker.openPicker({
      width: 1000,
      height: 1000,
      cropping: true,
    })
      .then(image => {
        setImg(image);
      })
      .catch(error => {
        console.log('Image Picker Error:', error);
      });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={
          Platform.OS === 'android' ? StatusBar.currentHeight : 0
        }
        style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={{flexGrow: 1}}
          keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <HeaderComponent />
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Create an account</Text>
            </View>

            <View style={styles.imgContainer}>
              <TouchableOpacity activeOpacity={0.5} onPress={uploadImg}>
                <View style={styles.pictureContainer}>
                  {img ? (
                    <>
                      <Image
                        source={{uri: img?.path}}
                        resizeMode="cover"
                        style={styles.imgStyle}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.imgText}>Upload Picture</Text>
                    </>
                  )}
                </View>
                {img && (
                  <>
                    <TouchableOpacity onPress={uploadImg}>
                      <Image
                        source={Icons.edit}
                        resizeMode="contain"
                        style={styles.uploadedImg}
                      />
                    </TouchableOpacity>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.fieldContainer}>
              <InputField
                placeholder="Username"
                value={name}
                onChangeText={setName}
              />
              <InputField
                placeholder="Email"
                value={email}
                onChangeText={SetEmail}
              />
              <PasswordField placeholder="Password" value={password} onChangeText={SetPassword} />
              <PasswordField placeholder="Confirm Password"  value={confirmPassword} onChangeText={SetConfirmPassword} />
              <InputField
                placeholder="Phone Number"
                value={phone}
                onChangeText={SetPhone}
              />
            </View>

            <View style={styles.radioContainer}>
              <View style={styles.radioInnerContainer}>
                <RadioButtonInput
                  obj={{value: 0}}
                  index={0}
                  isSelected={selected}
                  onPress={() => setSelected(!selected)}
                  borderWidth={1}
                  buttonInnerColor={Colors.gradient1}
                  buttonOuterColor={
                    selected ? Colors.gradient1 : Colors.inputFieldColor
                  }
                  buttonSize={9}
                  buttonOuterSize={16}
                />
                <Text style={styles.radioLabel}>
                  I agree to terms and conditions
                </Text>
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <GradientButton title="Sign Up" onPress={handleNext} />
              <View style={styles.buttonInnerContainer}>
                <Text style={styles.bottomText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                  <Text style={styles.signIn}>Signin</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.starContainer}>
            <Image
              source={IMAGES.stars}
              resizeMode="contain"
              style={styles.star}
            />
          </View>
          <View style={{marginBottom: RFPercentage(5)}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    backgroundColor: Colors.background,
  },
  titleContainer: {
    alignSelf: 'center',
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(2),
  },
  title: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.9),
    textAlign: 'center',
  },
  imgContainer: {
    alignSelf: 'center',
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(3),
  },
  pictureContainer: {
    width: RFPercentage(13.5),
    height: RFPercentage(13.5),
    borderRadius: RFPercentage(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 244, 246, 1)',
    borderWidth: 1.8,
    borderColor: 'rgba(64, 123, 255, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 40,
  },
  imgStyle: {
    width: RFPercentage(12.5),
    height: RFPercentage(12.5),
    borderRadius: RFPercentage(10),
  },
  imgText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
  },
  uploadedImg: {
    width: RFPercentage(3),
    height: RFPercentage(3),
    position: 'absolute',
    left: RFPercentage(8.5),
    bottom: RFPercentage(0.5),
  },
  fieldContainer: {
    alignSelf: 'center',
    marginTop: RFPercentage(3),
    width: '95%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: '95%',
  },
  radioInnerContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    color: Colors.primaryText,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    marginLeft: RFPercentage(0.8),
  },
  buttonContainer: {
    alignSelf: 'center',
    marginTop: RFPercentage(5),
    width: '95%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFPercentage(4),
  },
  bottomText: {
    color: Colors.secondaryText,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontRegular,
  },
  signIn: {
    color: Colors.gradient1,
    fontSize: RFPercentage(1.5),
    fontFamily: Fonts.fontMedium,
    left: 3,
  },
  starContainer: {
    position: 'absolute',
    bottom: RFPercentage(14),
    right: RFPercentage(1.5),
  },
  star: {
    width: RFPercentage(8),
    height: RFPercentage(8),
  },
});
