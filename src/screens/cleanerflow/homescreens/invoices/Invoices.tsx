import React, {useState, useCallback} from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Text,
  Platform,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../../../constants/Themes';
import LinearGradient from 'react-native-linear-gradient';
import HeaderBack from '../../../../components/HeaderBack';
import InvoiceCard from '../../../../components/InvoiceCard';
import NotFound from '../../../../components/NotFound';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import DatePicker from 'react-native-date-picker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {useFocusEffect} from '@react-navigation/native';
import {useExitAppOnBack} from '../../../../utils/ExitApp';
import {showToast} from '../../../../utils/ToastMessage';
import moment from 'moment';
import {Invoice} from '../../../../types/invoice';
import {
  filterInvoices,
  paginateInvoices,
  generateInvoicePdf,
  shareInvoicePdf,
  downloadInvoicePdf,
  invoiceToFormData,
} from '../../../../services/invoiceService';

const PER_PAGE = 10;

const Invoices = ({navigation}: any) => {
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterMode, setFilterMode] = useState<'day' | 'month' | 'year'>('day');
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useExitAppOnBack();

  const fetchInvoices = useCallback(async () => {
    const user = auth().currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const snapshot = await firestore()
        .collection('Invoices')
        .where('cleanerId', '==', user.uid)
        .get();

      const invoicesList = snapshot.docs
        .map(doc => ({id: doc.id, ...doc.data()})) as Invoice[];

      // Sort by createdAt descending in JS to avoid requiring a composite index
      invoicesList.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      });

      setAllInvoices(invoicesList);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchInvoices();
    }, [fetchInvoices]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices().finally(() => setRefreshing(false));
  };

  // Apply search filter
  let filtered = filterInvoices(allInvoices, searchQuery);

  // Apply date filter
  if (filterDate) {
    filtered = filtered.filter(inv => {
      const invDate = inv.createdAt?.toDate
        ? moment(inv.createdAt.toDate())
        : moment(inv.createdAt);
      if (!invDate.isValid()) return false;

      if (filterMode === 'day') {
        return invDate.isSame(moment(filterDate), 'day');
      } else if (filterMode === 'month') {
        return invDate.isSame(moment(filterDate), 'month');
      } else {
        return invDate.isSame(moment(filterDate), 'year');
      }
    });
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = paginateInvoices(filtered, currentPage, PER_PAGE);

  const handleView = (invoice: Invoice) => {
    navigation.navigate('InvoicePreview', {
      formData: invoiceToFormData(invoice),
      jobItem: {id: invoice.jobId, jobId: invoice.customerId},
      viewOnly: true,
    });
  };

  const handleDownloadOrShare = async (invoice: Invoice, action: 'download' | 'share') => {
    setActionLoading(invoice.id || null);
    try {
      const pdfPath = await generateInvoicePdf(invoiceToFormData(invoice));

      if (action === 'share') {
        await shareInvoicePdf(pdfPath, invoice.invoiceId);
      } else {
        await downloadInvoicePdf(pdfPath, invoice.invoiceId);
        if (Platform.OS === 'android') {
          showToast({
            type: 'success',
            title: 'Downloaded',
            message: 'Invoice Downloaded Successfully ',
          });
        }
      }
    } catch (error: any) {
      if (
        !error?.message?.includes('User did not share') &&
        !error?.message?.includes('cancel')
      ) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to process invoice',
        });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const onDateFilterChange = (_event: any, selectedDate?: Date) => {
    // iOS spinner stays inline until filter panel is closed
    setShowFilterPicker(true);
    if (selectedDate) {
      setFilterDate(selectedDate);
      setCurrentPage(1);
    }
  };

  const onAndroidDateConfirm = (selectedDate: Date) => {
    setShowFilterPicker(false);
    setFilterDate(selectedDate);
    setCurrentPage(1);
  };

  const onAndroidDateCancel = () => {
    setShowFilterPicker(false);
  };

  const clearDateFilter = () => {
    setFilterDate(null);
    setShowDateFilter(false);
    setCurrentPage(1);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent={true}
      />
      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <HeaderBack
          title="Invoices"
          textStyle={styles.headerText}
          left={true}
          arrowColor={Colors.white}
          style={{backgroundColor: 'transparent'}}
          logo
          tintColor={Colors.white}
        />
      </LinearGradient>

      <FlatList
        data={paginated}
        keyExtractor={item => item.id || item.invoiceId}
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
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Feather
                  name="search"
                  size={RFPercentage(2)}
                  color={Colors.secondaryText}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by invoice ID or customer..."
                  placeholderTextColor={Colors.placeholderColor}
                  value={searchQuery}
                  onChangeText={text => {
                    setSearchQuery(text);
                    setCurrentPage(1);
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}>
                    <Feather
                      name="x"
                      size={RFPercentage(2)}
                      color={Colors.secondaryText}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowDateFilter(!showDateFilter)}
                style={[
                  styles.filterButton,
                  filterDate && styles.filterButtonActive,
                ]}>
                <MaterialCommunityIcons
                  name="filter-outline"
                  size={RFPercentage(2.2)}
                  color={filterDate ? Colors.white : Colors.gradient1}
                />
              </TouchableOpacity>
            </View>

            {/* Date Filter Panel */}
            {showDateFilter && (
              <View style={styles.filterPanel}>
                <View style={styles.filterModeRow}>
                  {(['day', 'month', 'year'] as const).map(mode => (
                    <TouchableOpacity
                      key={mode}
                      activeOpacity={0.7}
                      onPress={() => {
                        setFilterMode(mode);
                        setFilterDate(null);
                      }}
                      style={[
                        styles.filterModeBtn,
                        filterMode === mode && styles.filterModeBtnActive,
                      ]}>
                      <Text
                        style={[
                          styles.filterModeText,
                          filterMode === mode && styles.filterModeTextActive,
                        ]}>
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.filterActions}>
                  <TouchableOpacity
                    onPress={() => setShowFilterPicker(true)}
                    style={styles.selectDateBtn}>
                    <Feather
                      name="calendar"
                      size={16}
                      color={Colors.gradient1}
                    />
                    <Text style={styles.selectDateText}>
                      {filterDate
                        ? filterMode === 'day'
                          ? moment(filterDate).format('MMM DD, YYYY')
                          : filterMode === 'month'
                          ? moment(filterDate).format('MMM YYYY')
                          : moment(filterDate).format('YYYY')
                        : `Select ${filterMode}`}
                    </Text>
                  </TouchableOpacity>
                  {filterDate && (
                    <TouchableOpacity
                      onPress={clearDateFilter}
                      style={styles.clearFilterBtn}>
                      <Feather name="x" size={16} color={Colors.red500} />
                      <Text style={styles.clearFilterText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {showFilterPicker && Platform.OS === 'ios' && (
                  <DateTimePicker
                    value={filterDate || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={onDateFilterChange}
                  />
                )}
              </View>
            )}

            {/* Results count */}
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </>
        }
        renderItem={({item}) => (
          <View>
            <InvoiceCard
              invoice={item}
              onView={() => handleView(item)}
              onShare={() => handleDownloadOrShare(item, 'share')}
              onDownload={() => handleDownloadOrShare(item, 'download')}
            />
            {actionLoading === item.id && (
              <View style={styles.cardLoadingOverlay}>
                <ActivityIndicator size="small" color={Colors.gradient1} />
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.gradient1} />
              <Text style={styles.loadingText}>Loading invoices...</Text>
            </View>
          ) : (
            <NotFound
              text={
                searchQuery || filterDate
                  ? 'No invoices match your filters'
                  : 'No invoices yet\nGenerate your first invoice from a completed job'
              }
            />
          )
        }
        ListFooterComponent={
          filtered.length > PER_PAGE ? (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={currentPage === 1}
                onPress={() => setCurrentPage(p => p - 1)}
                style={[
                  styles.pageButton,
                  currentPage === 1 && styles.pageButtonDisabled,
                ]}>
                <Feather
                  name="chevron-left"
                  size={18}
                  color={
                    currentPage === 1
                      ? Colors.gray300
                      : Colors.gradient1
                  }
                />
                <Text
                  style={[
                    styles.pageButtonText,
                    currentPage === 1 && styles.pageButtonTextDisabled,
                  ]}>
                  Previous
                </Text>
              </TouchableOpacity>

              <Text style={styles.pageInfo}>
                {currentPage} / {totalPages}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                disabled={currentPage === totalPages}
                onPress={() => setCurrentPage(p => p + 1)}
                style={[
                  styles.pageButton,
                  currentPage === totalPages && styles.pageButtonDisabled,
                ]}>
                <Text
                  style={[
                    styles.pageButtonText,
                    currentPage === totalPages &&
                      styles.pageButtonTextDisabled,
                  ]}>
                  Next
                </Text>
                <Feather
                  name="chevron-right"
                  size={18}
                  color={
                    currentPage === totalPages
                      ? Colors.gray300
                      : Colors.gradient1
                  }
                />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Android: use react-native-date-picker modal (native dialog doesn't crash) */}
      {Platform.OS === 'android' && (
        <DatePicker
          modal
          open={showFilterPicker}
          date={filterDate || new Date()}
          mode="date"
          onConfirm={onAndroidDateConfirm}
          onCancel={onAndroidDateCancel}
        />
      )}
    </View>
  );
};

export default Invoices;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
  searchContainer: {
    flexDirection: 'row',
    marginTop: RFPercentage(2),
    gap: RFPercentage(1),
  },
  searchBar: {
    flex: 1,
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
  filterButton: {
    width: RFPercentage(5.5),
    height: RFPercentage(5.5),
    borderRadius: RFPercentage(1.2),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  filterButtonActive: {
    backgroundColor: Colors.gradient1,
    borderColor: Colors.gradient1,
  },
  filterPanel: {
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(1.5),
    padding: RFPercentage(1.5),
    marginTop: RFPercentage(1),
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
  },
  filterModeRow: {
    flexDirection: 'row',
    gap: RFPercentage(0.8),
    marginBottom: RFPercentage(1.2),
  },
  filterModeBtn: {
    flex: 1,
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(0.8),
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
  },
  filterModeBtnActive: {
    backgroundColor: Colors.gradient1,
    borderColor: Colors.gradient1,
  },
  filterModeText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
  },
  filterModeTextActive: {
    color: Colors.white,
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(1),
  },
  selectDateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.6),
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: RFPercentage(0.8),
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(1),
  },
  selectDateText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.primaryText,
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(0.8),
    backgroundColor: Colors.redBg50,
  },
  clearFilterText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: Colors.red500,
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
  cardLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RFPercentage(2),
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: RFPercentage(2.5),
    marginBottom: RFPercentage(2),
    paddingHorizontal: RFPercentage(1),
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  pageButtonDisabled: {
    borderColor: Colors.lightGrayBg,
    backgroundColor: Colors.gray50,
  },
  pageButtonText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.gradient1,
  },
  pageButtonTextDisabled: {
    color: Colors.gray300,
  },
  pageInfo: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
    color: Colors.primaryText,
  },
});
