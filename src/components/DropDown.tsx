import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts, Icons} from '../constants/Themes';
import Entypo from 'react-native-vector-icons/Entypo';

interface Item {
  id: number;
  label: string;
}

interface Props {
  data: Item[];
  setValue: (item: Item) => void;
  icon?: any;
  placeholder: string;
}

const CustomDropDown: React.FC<Props> = (props: Props) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.container,
          {
            borderTopWidth: 1,
            borderLeftWidth:1,
            borderRightWidth:1,
            borderLeftColor :  Colors.inputFieldColor,
            borderTopColor: Colors.inputFieldColor,
            borderRightColor :  Colors.inputFieldColor,
            borderBottomWidth : open ? 0 : 1,
            borderBottomColor : Colors.inputFieldColor

          },
        ]}
        onPress={() => setOpen(!open)}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text
            style={{
              color: Colors.placeholderColor,
              fontFamily: Fonts.fontRegular,
              fontSize: RFPercentage(1.6),
            }}>
            {props.placeholder}
          </Text>
          <TouchableOpacity onPress={() => setOpen(!open)}>
            <Entypo
              name="chevron-small-down"
              color={Colors.placeholderColor}
              size={22}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      {open && (
        <>
          <View
            style={{
              backgroundColor: 'transparent',
              borderBottomLeftRadius: RFPercentage(2),
              borderBottomRightRadius: RFPercentage(2),
              bottom: 16,
              borderWidth: 1,
              borderColor: Colors.inputFieldColor,
            }}>
            <FlatList
              data={props.data}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => {
                return (
                  <TouchableOpacity
                  // onPress={() => {
                  //   setValue(item);
                  // }}
                  >
                    <View
                      style={{
                        paddingVertical: 8,
                        backgroundColor: 'transparent',
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(244, 244, 245, 1)',
                        paddingHorizontal: 15,
                      }}>
                      <Text
                        style={{
                          color: Colors.placeholderColor,
                          fontFamily: Fonts.fontRegular,
                          fontSize: RFPercentage(1.4),
                        }}>
                        {item.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </>
      )}
    </View>
  );
};

export default CustomDropDown;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: RFPercentage(5.4),
    borderRadius: RFPercentage(0.8),
    marginVertical: RFPercentage(1.5),
    justifyContent: 'center',
    paddingHorizontal: RFPercentage(1.5),
  },
});
