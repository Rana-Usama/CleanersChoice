import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
} from 'react-native';
import React from 'react';
import {Colors, Fonts} from '../../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import HeaderBack from '../../../../components/HeaderBack';

interface Data {
  id: number;
  q: string;
  e: string;
}

const data: Data[] = [
  {
    id: 1,
    q: 'Personal Data',
    e: `While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:
i) Email address
ii) First name and last name
iii) Phone number
iv) Usage Data`,
  },
  {
    id: 2,
    q: `Use of Your Personal Data`,
    e: `The Company may use Personal Data for the following purposes:
- To provide and maintain our Service, including to monitor the usage of our Service.
- To manage Your Account: to manage Your registration as a user of the Service.
- To contact You: To contact You by email, telephone calls, SMS.
- To provide You with news, special offers and general information about other goods, services.
- To manage Your requests: To attend and manage Your requests to Us.`,
  },
  {
    id: 3,
    q: 'Retention of Your Personal Data',
    e: 'The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations to resolve disputes, and enforce our legal agreements and policies.',
  },
  {
    id: 4,
    q: 'Security of Your Personal Data',
    e: `The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.`,
  },
  {
    id: 5,
    q: 'Changes to this Privacy Policy',
    e: `We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.
We will let You know via email and/or a prominent notice on Our Service, prior to the change becoming effective and update the "Last updated" date at the top of this Privacy Policy.`,
  },
  {
    id: 6,
    q: 'Contact Us',
    e: `If you have any questions about this Privacy Policy, You can contact us by email: 
- Harrisonscleaningservice2033s@gmail.com`,
  },
];

const Privacy: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBack
        title={`Privacy Policy`}
        textStyle={{fontSize: RFPercentage(2)}}
        left={true}
      />
      <ScrollView
        contentContainerStyle={{paddingBottom: RFPercentage(10)}}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={{marginTop: 15}}>
            <Text style={styles.e}>
              This Privacy Policy describes Our policies and procedures on the
              collection, use and disclosure of Your information when You use
              the Service and tells You about Your privacy rights and how the
              law protects You.We use Your Personal data to provide and improve
              the Service. By using the Service, You agree to the collection and
              use of information in accordance with this Privacy Policy.
            </Text>
            <FlatList
              data={data}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => {
                return (
                  <>
                    <View style={{marginTop: RFPercentage(2.5)}}>
                      <Text style={styles.q}>{item.q}</Text>
                      <Text style={styles.e}>{item.e}</Text>
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
  q: {
    color: Colors.brown,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
    textAlign: 'justify',
    lineHeight: RFPercentage(3),
  },
  e: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
    textAlign: 'justify',
    lineHeight: RFPercentage(2.8),
    marginTop: RFPercentage(1),
  },
});
