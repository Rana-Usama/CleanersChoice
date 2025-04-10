import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import React, {useState} from 'react';
import {Colors, Icons, Fonts, IMAGES} from '../../../../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Entypo from 'react-native-vector-icons/Entypo';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../../routers/StackNavigator';
import HeaderBack from '../../../../components/HeaderBack';

interface Data {
  id: number;
  q: string;
  e: string;
}

const data: Data[] = [
  {
    id: 1,
    q: 'What areas do you serve?',
    e: 'Yes requester have the option to leave a review too for community trust.',
  },
  {
    id: 2,
    q: 'Can I post my own requests?',
    e: 'Yes requester have the option to leave a review too for community trust.',
  },
  {
    id: 3,
    q: 'Can I cancel a request after I accept it?',
    e: 'Yes requester have the option to leave a review too for community trust.',
  },
  {
    id: 4,
    q: 'Can I leave a review to requester?',
    e: 'Yes requester have the option to leave a review too for community trust.',
  },
  {
    id: 5,
    q: 'Can I accept multiple requests?',
    e: 'Yes requester have the option to leave a review too for community trust.',
  },
];

const FAQS: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'FAQS'>>();
  const [explanation, setExplanation] = useState<number | null>(null);
  const [visible, setVisible] = useState<boolean>(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <HeaderBack title={`FAQ's`} textStyle={styles.headerText} left={true} />
        <View style={styles.container}>
          <FlatList
            data={data}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => {
              return (
                <>
                  <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>{item.q}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setVisible(!visible);
                        setExplanation(item.id);
                      }}>
                      <Entypo
                        name={
                          visible && explanation === item.id
                            ? 'chevron-small-up'
                            : 'chevron-small-down'
                        }
                        color={Colors.secondaryText}
                        size={RFPercentage(3)}
                      />
                    </TouchableOpacity>
                  </View>
                  {visible && explanation === item.id && (
                    <Text style={styles.answerText}>{item.e}</Text>
                  )}
                </>
              );
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FAQS;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.background,
  },
  scrollViewContent: {
    paddingBottom: RFPercentage(10),
  },
  headerText: {
    fontSize: RFPercentage(1.8),
  },
  container: {
    width: '90%',
    alignSelf: 'center',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: Colors.inputFieldColor,
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginTop: RFPercentage(3.5),
  },
  questionText: {
    color: 'rgba(51, 65, 85, 1)',
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
  },
  answerText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    marginTop: 10,
  },
});
