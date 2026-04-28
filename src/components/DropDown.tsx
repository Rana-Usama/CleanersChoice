import {StyleSheet, Text, View, TouchableOpacity, FlatList} from 'react-native';
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
  placeholderColor?: any;
}

const CustomDropDown: React.FC<Props> = (props: Props) => {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.container,
          styles.inputBorder,
          open && styles.inputBorderOpen,
        ]}
        onPress={() => setOpen(!open)}>
        <View style={styles.rowContainer}>
          <Text
            style={[
              styles.placeholderText,
              {color: '#9CA3AF'},
            ]}>
            {selectedLabel || props.placeholder}
          </Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setOpen(!open)}>
            <Entypo
              name="chevron-right"
              color="#9CA3AF"
              size={22}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownContainer}>
          <FlatList
            data={props.data}
            keyExtractor={item => item.id.toString()}
            renderItem={({item, index}) => {
              const isSelected = selectedLabel === item.label;
              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setOpen(false);
                    setSelectedLabel(item.label);
                    props.setValue && props.setValue(item);
                  }}>
                  <View style={[styles.listItem, isSelected && styles.selectedListItem]}>
                    <Text style={styles.listItemText}>{item.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
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
    height: RFPercentage(6.5),
    borderRadius: RFPercentage(1.3),
    marginTop: RFPercentage(1),
    justifyContent: 'center',
    paddingHorizontal: RFPercentage(1.5),
    backgroundColor: Colors.white,
  },
  inputBorder: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#9CA3AF1A',
  },
  inputBorderOpen: {
    borderColor: '#9CA3AF1A',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.9),
  },
  dropdownContainer: {
    marginTop: RFPercentage(1),
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(1.3),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#9CA3AF1A',
    paddingVertical: RFPercentage(0.8),
  },
  listItem: {
    paddingVertical: RFPercentage(1.5),
    backgroundColor: 'transparent',
    borderRadius: RFPercentage(1.3),
    paddingHorizontal: RFPercentage(1.5),
    marginHorizontal: RFPercentage(1),
  },
  selectedListItem: {
    backgroundColor: '#9CA3AF1A',
  },
  listItemText: {
    color: '#9CA3AF',
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.7),
  },
});
