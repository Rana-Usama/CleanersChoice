import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Customer} from '../types/customer';
import {filterCustomers, getCustomers} from '../services/customerService';
import {getAvatarInitials} from '../utils/avatarInitials';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  onAddNew?: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.78;

const CustomerPickerSheet: React.FC<Props> = ({
  visible,
  onClose,
  onSelect,
  onAddNew,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getCustomers();
      setCustomers(list);
    } catch (error) {
      console.error('[CustomerPickerSheet.fetch]', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setSearch('');
      fetch();
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fetch, translateY]);

  const filtered = useMemo(
    () => filterCustomers(customers, search),
    [customers, search],
  );

  const handleSelect = (customer: Customer) => {
    Keyboard.dismiss();
    onSelect(customer);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {transform: [{translateY}]},
          ]}>
          {/* Grab handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Phone Book</Text>
              <Text style={styles.subtitle}>
                Select a customer to auto-fill the invoice
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeBtn}>
              <Feather
                name="x"
                size={RFPercentage(2.4)}
                color={Colors.secondaryText}
              />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchBar}>
            <Feather
              name="search"
              size={RFPercentage(2)}
              color={Colors.secondaryText}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email or phone..."
              placeholderTextColor={Colors.placeholderColor}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather
                  name="x"
                  size={RFPercentage(2)}
                  color={Colors.secondaryText}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={Colors.gradient1} />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id || item.matchKey}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              renderItem={({item}) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelect(item)}
                  style={styles.row}>
                  <View style={styles.rowAvatar}>
                    <Text style={styles.rowAvatarText}>
                      {getAvatarInitials(item.name) || '?'}
                    </Text>
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {item.name || 'Unnamed'}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {item.phone || item.email || 'No contact info'}
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={RFPercentage(2)}
                    color={Colors.gray400}
                  />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIconBox}>
                    <MaterialCommunityIcons
                      name="account-search-outline"
                      size={RFPercentage(4)}
                      color={Colors.gradient1}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {search ? 'No matches' : 'No contacts yet'}
                  </Text>
                  <Text style={styles.emptyText}>
                    {search
                      ? 'Try a different search term'
                      : 'Add your first customer to speed up future invoices'}
                  </Text>
                </View>
              }
            />
          )}

          {/* Add new */}
          {onAddNew && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                onAddNew();
              }}
              style={styles.addNewBtn}>
              <Feather
                name="plus"
                size={RFPercentage(2.2)}
                color={Colors.gradient1}
              />
              <Text style={styles.addNewText}>Add new customer</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CustomerPickerSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.blackOverlay50,
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: Colors.background,
    borderTopLeftRadius: RFPercentage(3),
    borderTopRightRadius: RFPercentage(3),
    paddingBottom: Platform.OS === 'ios' ? RFPercentage(3) : RFPercentage(1.5),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: RFPercentage(1.2),
    paddingBottom: RFPercentage(0.5),
  },
  handle: {
    width: RFPercentage(5),
    height: RFPercentage(0.5),
    borderRadius: RFPercentage(0.5),
    backgroundColor: Colors.gray300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RFPercentage(2.5),
    paddingBottom: RFPercentage(1.2),
    paddingTop:RFPercentage(1)
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.1),
    color: Colors.primaryText,
  },
  subtitle: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
    marginTop: 2,
  },
  closeBtn: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: RFPercentage(2.2),
    borderRadius: RFPercentage(1.2),
    paddingHorizontal: RFPercentage(1.5),
    height: RFPercentage(5.5),
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    gap: RFPercentage(0.8),
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    color: Colors.inputTextColor,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: RFPercentage(2.2),
    paddingTop: RFPercentage(1),
    paddingBottom: RFPercentage(2),
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RFPercentage(1.3),
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorderOverlay50,
    gap: RFPercentage(1.2),
  },
  rowAvatar: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    backgroundColor: Colors.primaryBlueOverlay10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatarText: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.7),
    color: Colors.gradient1,
  },
  rowName: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.primaryText,
  },
  rowMeta: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
    marginTop: 2,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: RFPercentage(0.6),
  },
  loadingText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RFPercentage(5),
  },
  emptyIconBox: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
    backgroundColor: Colors.primaryBlueOverlay10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFPercentage(1.2),
  },
  emptyTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    color: Colors.primaryText,
  },
  emptyText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
    marginTop: RFPercentage(0.4),
    textAlign: 'center',
    paddingHorizontal: RFPercentage(2),
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: RFPercentage(2.2),
    marginTop: RFPercentage(1),
    height: RFPercentage(5.8),
    borderRadius: RFPercentage(100),
    borderWidth: 1.5,
    borderColor: Colors.gradient1,
    backgroundColor: Colors.white,
    gap: RFPercentage(0.8),
  },
  addNewText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.gradient1,
  },
});
