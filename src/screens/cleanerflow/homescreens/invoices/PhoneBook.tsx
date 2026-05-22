import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import HeaderBack from '../../../../components/HeaderBack';
import CustomerCard from '../../../../components/CustomerCard';
import {Colors, Fonts} from '../../../../constants/Themes';
import {Customer} from '../../../../types/customer';
import {
  deleteCustomer,
  filterCustomers,
  getCustomers,
  seedPhoneBookFromInvoices,
} from '../../../../services/customerService';
import {showToast} from '../../../../utils/ToastMessage';

const PhoneBook = ({navigation}: any) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getCustomers();
      setCustomers(list);
    } catch (error) {
      console.error('[PhoneBook.fetchCustomers]', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load contacts',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // One-shot auto-seed from existing invoices, then refresh the list.
  // The service guards itself with AsyncStorage so this is safe on every mount.
  const seedAndFetch = useCallback(async () => {
    setLoading(true);
    try {
      const created = await seedPhoneBookFromInvoices();
      if (created > 0) {
        showToast({
          type: 'info',
          title: 'Phone Book ready',
          message: `Imported ${created} contact${
            created !== 1 ? 's' : ''
          } from your invoices`,
        });
      }
      const list = await getCustomers();
      setCustomers(list);
    } catch (error) {
      console.error('[PhoneBook.seedAndFetch]', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      seedAndFetch();
    }, [seedAndFetch]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers().finally(() => setRefreshing(false));
  };

  const filtered = filterCustomers(customers, search);

  const handleAdd = () => {
    navigation.navigate('CustomerForm', {customer: null});
  };

  const handleView = (customer: Customer) => {
    navigation.navigate('CustomerForm', {customer});
  };

  const handleEdit = (customer: Customer) => {
    navigation.navigate('CustomerForm', {customer});
  };

  const handleDelete = (customer: Customer) => {
    if (!customer.id) return;
    Alert.alert(
      'Delete contact?',
      `${
        customer.name || 'This contact'
      } will be removed from your Phone Book. Existing invoices for this customer will not be affected.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!customer.id) return;
            setDeletingId(customer.id);
            // Optimistic remove
            const snapshot = customers;
            setCustomers(prev => prev.filter(c => c.id !== customer.id));
            try {
              await deleteCustomer(customer.id);
              showToast({
                type: 'success',
                title: 'Deleted',
                message: 'Contact removed',
              });
            } catch (error) {
              console.error('[PhoneBook.delete]', error);
              setCustomers(snapshot);
              showToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to delete contact',
              });
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent
      />
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Phone Book</Text>
          <View style={{width: 40}} />
        </View>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id || item.matchKey}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gradient1}
          />
        }
        ListHeaderComponent={
          <>
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

            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                {filtered.length} contact{filtered.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </>
        }
        renderItem={({item}) => (
          <View style={{opacity: deletingId === item.id ? 0.5 : 1}}>
            <CustomerCard
              customer={item}
              onPress={() => handleView(item)}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.gradient1} />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconBox}>
                <MaterialCommunityIcons
                  name="contacts-outline"
                  size={RFPercentage(5)}
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
              {!search && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleAdd}
                  style={styles.emptyCta}>
                  <Feather
                    name="plus"
                    size={RFPercentage(2)}
                    color={Colors.white}
                  />
                  <Text style={styles.emptyCtaText}>Add customer</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />

      {/* FAB */}
      <View style={styles.fabWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.fab}
          onPress={handleAdd}>
          <Feather name="plus" size={RFPercentage(3)} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PhoneBook;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? RFPercentage(8) : RFPercentage(6),
    paddingHorizontal: RFPercentage(2),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: RFPercentage(2),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
  },
  headerText: {
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
    paddingHorizontal: RFPercentage(2),
  },
  searchBar: {
    marginTop: RFPercentage(2),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
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
  resultHeader: {
    marginTop: RFPercentage(2),
    marginBottom: RFPercentage(0.5),
  },
  resultTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    color: Colors.primaryText,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(10),
  },
  loadingText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.secondaryText,
    marginTop: RFPercentage(1),
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(8),
    paddingHorizontal: RFPercentage(2),
  },
  emptyIconBox: {
    width: RFPercentage(11),
    height: RFPercentage(11),
    borderRadius: RFPercentage(5.5),
    backgroundColor: Colors.primaryBlueOverlay10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFPercentage(2),
  },
  emptyTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2),
    color: Colors.primaryText,
  },
  emptyText: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    color: Colors.secondaryText,
    marginTop: RFPercentage(0.6),
    textAlign: 'center',
    marginBottom: RFPercentage(2),
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.6),
    paddingHorizontal: RFPercentage(2.4),
    paddingVertical: RFPercentage(1.4),
    borderRadius: RFPercentage(100),
    backgroundColor: Colors.gradient1,
  },
  emptyCtaText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.white,
  },
  fabWrapper: {
    position: 'absolute',
    bottom: RFPercentage(3),
    right: RFPercentage(2.5),
    zIndex: 100,
  },
  fab: {
    width: RFPercentage(6.5),
    height: RFPercentage(6.5),
    borderRadius: RFPercentage(3.25),
    backgroundColor: Colors.gradient1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
        shadowColor: 'transparent',
      },
    }),
  },
});
