import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import React, {useState} from 'react';
import {Colors, Icons, Fonts, IMAGES} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../routers/StackNavigator';
import HeaderBack from '../../../components/HeaderBack';
import GradientButton from '../../../components/GradientButton';
import InputField from '../../../components/InputField';

const {width, height} = Dimensions.get('window');

const EditProfile = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'EditProfile'>
    >();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{flexGrow: 1}}
            keyboardShouldPersistTaps="handled">
            <HeaderBack
              title="Edit Profile"
              textStyle={{fontSize: RFPercentage(1.8)}}
            />
            <View style={styles.container}>
              {/* Profile Image */}
              <View style={{alignSelf: 'center', marginTop: RFPercentage(2)}}>
                <View style={styles.imageContainer}>
                  <Image
                    source={IMAGES.picture}
                    resizeMode="contain"
                    style={styles.profileImage}
                  />
                  <TouchableOpacity style={styles.editIcon}>
                    <Image
                      source={Icons.edit}
                      resizeMode="contain"
                      style={styles.editImage}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Edit Info Title */}
              <View style={styles.sectionTitle}>
                <Text style={styles.sectionTitleText}>Edit Info</Text>
              </View>

              {/* Input Fields */}
              <View style={{marginTop: RFPercentage(1)}}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Name</Text>
                  <InputField
                    placeholder="Sana Asghar"
                    value={name}
                    onChangeText={setName}
                    customStyle={{width: '100%'}}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <InputField
                    placeholder="sanafahad6658@gmail.com"
                    value={email}
                    onChangeText={setEmail}
                    customStyle={{width: '100%'}}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number</Text>
                  <InputField
                    placeholder="03076590664"
                    value={phone}
                    onChangeText={setPhone}
                    customStyle={{width: '100%'}}
                  />
                </View>
              </View>

              {/* Edit Button */}
              <View style={{marginTop: RFPercentage(6), alignSelf: 'center'}}>
                <GradientButton title={'Edit'} />
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    width: '90%',
    paddingTop: RFPercentage(3),
    alignSelf: 'center',
  },
  imageContainer: {
    width: RFPercentage(16),
    height: RFPercentage(16),
    borderRadius: RFPercentage(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: RFPercentage(15),
    height: RFPercentage(15),
    borderRadius: RFPercentage(16),
  },
  editIcon: {
    position: 'absolute',
    bottom: RFPercentage(2),
    right: RFPercentage(2),
  },
  editImage: {
    width: RFPercentage(3.5),
    height: RFPercentage(3.5),
  },
  sectionTitle: {
    marginTop: RFPercentage(2),
    borderBottomColor: Colors.inputFieldColor,
    borderBottomWidth: 1,
    paddingBottom: 5,
    width: RFPercentage(30),
  },
  sectionTitleText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
  },
  inputContainer: {
    marginTop: RFPercentage(1.6),
  },
  label: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
  },
});
