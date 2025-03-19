import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
} from 'react-native';
import React, {useState} from 'react';
import {Colors, Icons, Fonts, IMAGES} from '../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Entypo from 'react-native-vector-icons/Entypo';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../routers/StackNavigator';
import HeaderBack from '../../../components/HeaderBack';

const {width, height} = Dimensions.get('window');

interface Data {
  id: number;
  q: string;
  e: string;
}

const data: Data[] = [
  {
    id: 1,
    q: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.',
    e: 'Our service enables customers to order and receive fuel delivery directly to their specified location.',
  },
  {
    id: 2,
    q: `It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. `,
    e: 'To use our services, you must be of legal age in your jurisdiction and capable of entering into a binding agreement. By using our services, you represent and warrant that you meet these eligibility requirements.',
  },
  {
    id: 3,
    q: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed.',
    e: 'Customers can place orders for fuel delivery through our App. By placing an order, you agree to provide accurate and complete information about your location, contact details, and payment information.',
  },
];

const Privacy: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Privacy'>>();
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={{paddingBottom: RFPercentage(10)}}
        showsVerticalScrollIndicator={false}>
        <HeaderBack
          title={`Privacy Policy`}
          textStyle={{fontSize: RFPercentage(1.8)}}
        />
        <View style={styles.container}>
          <View style={{marginTop: 15}}>
            <FlatList
              data={data}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => {
                return (
                  <>
                    <View style={{marginTop: RFPercentage(2.5)}}>
                      <Text
                        style={{
                          color: Colors.brown,
                          fontFamily: Fonts.fontRegular,
                          fontSize: RFPercentage(1.5),
                          textAlign: 'justify',
                          lineHeight: 23,
                        }}>
                        {item.q}
                      </Text>
                    </View>
                  </>
                );
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Privacy;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.background,
  },
  container: {
    width: '90%',
    alignSelf: 'center',
  },
});
