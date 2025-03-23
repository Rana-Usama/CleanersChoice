import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import React, {useState} from 'react';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import Entypo from 'react-native-vector-icons/Entypo';

interface Item {
  id: number;
  label: string;
}

interface Props {
  data: Item[];
  setValue?: (item: Item) => void;
  icon?: any;
  placeholder: string;
}

const CustomDropDown: React.FC<Props> = (props: Props) => {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.container,
          styles.borderStyle,
          open ? styles.borderOpen : styles.borderClosed,
        ]}
        onPress={() => setOpen(!open)}>
        <View style={styles.rowContainer}>
          <Text style={[styles.placeholderText,{color:selectedLabel ? Colors.inputTextColor : Colors.placeholderColor}]}>
            {selectedLabel || props.placeholder}
          </Text>
          <TouchableOpacity onPress={() => setOpen(!open)}>
            <Entypo name="chevron-small-down" color={Colors.placeholderColor} size={22} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownContainer}>
          <FlatList
            data={props.data}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
              <TouchableOpacity
                onPress={() => {
                  setOpen(false);
                  setSelectedLabel(item.label);
                }}>
                <View style={styles.listItem}>
                  <Text style={styles.listItemText}>{item.label}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
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
  borderStyle: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: Colors.inputFieldColor,
    borderTopColor: Colors.inputFieldColor,
    borderRightColor: Colors.inputFieldColor,
  },
  borderOpen: {
    borderBottomWidth: 0,
  },
  borderClosed: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.inputFieldColor,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholderText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
  },
  dropdownContainer: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: RFPercentage(2),
    borderBottomRightRadius: RFPercentage(2),
    bottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.inputFieldColor,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderRightColor: Colors.inputFieldColor,
    borderLeftColor: Colors.inputFieldColor,
    borderTopWidth:1,
    borderTopColor:Colors.inputFieldColor
  },
  listItem: {
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(244, 244, 245, 1)',
    paddingHorizontal: 15,
  },
  listItemText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
  },
});
