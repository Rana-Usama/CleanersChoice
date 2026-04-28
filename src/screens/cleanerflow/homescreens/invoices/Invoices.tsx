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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Date range filter
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

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

  // Apply date range filter
  if (dateFrom || dateTo) {
    filtered = filtered.filter(inv => {
      const invDate = inv.createdAt?.toDate
        ? moment(inv.createdAt.toDate())
        : moment(inv.createdAt);
      if (!invDate.isValid()) return false;
      if (dateFrom && invDate.isBefore(moment(dateFrom).startOf('day'))) return false;
      if (dateTo && invDate.isAfter(moment(dateTo).endOf('day'))) return false;
      return true;
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
        await shareInvoicePdf(pdfPath, invoice.invoiceId, invoice.toEmail, invoice.toName, invoice.jobPostName);
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

  const onFromDateConfirm = (selectedDate: Date) => {
    setShowFromPicker(false);
    setDateFrom(selectedDate);
    setCurrentPage(1);
  };

  const onToDateConfirm = (selectedDate: Date) => {
    setShowToPicker(false);
    setDateTo(selectedDate);
    setCurrentPage(1);
  };

  const clearDateFilter = () => {
    setDateFrom(null);
    setDateTo(null);
    setCurrentPage(1);
    setShowFilterPanel(false);
  };

  const resetDates = () => {
    setDateFrom(null);
    setDateTo(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = !!dateFrom || !!dateTo;

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
                onPress={() => {
                  if (hasActiveFilters) {
                    clearDateFilter();
                  } else {
                    setShowFilterPanel(prev => !prev);
                  }
                }}
                style={[
                  styles.filterButton,
                  (showFilterPanel || hasActiveFilters) && styles.filterButtonActive,
                ]}>
                <MaterialCommunityIcons
                  name={hasActiveFilters ? 'filter-off-outline' : 'filter-outline'}
                  size={RFPercentage(2.2)}
                  color={(showFilterPanel || hasActiveFilters) ? Colors.white : Colors.gradient1}
                />
              </TouchableOpacity>
            </View>

            {/* Date Range */}
            {showFilterPanel && (
            <View style={styles.dateRangeContainer}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowFromPicker(true)}
                style={styles.dateRangeButton}>
                <Feather name="calendar" size={RFPercentage(1.8)} color={Colors.gradient1} />
                <Text style={styles.dateRangeText}>
                  {dateFrom ? moment(dateFrom).format('MMM DD, YYYY') : 'From Date'}
                </Text>
              </TouchableOpacity>

              <View style={styles.dateRangeSeparator}>
                <Feather name="arrow-right" size={RFPercentage(1.8)} color={Colors.secondaryText} />
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowToPicker(true)}
                style={styles.dateRangeButton}>
                <Feather name="calendar" size={RFPercentage(1.8)} color={Colors.gradient1} />
                <Text style={styles.dateRangeText}>
                  {dateTo ? moment(dateTo).format('MMM DD, YYYY') : 'To Date'}
                </Text>
              </TouchableOpacity>

            </View>
            )}

            {/* Active filters chip */}
            {hasActiveFilters && (
              <View style={styles.filterChip}>
                <Feather name="filter" size={14} color={Colors.gradient1} />
                <Text style={styles.filterChipText}>
                  {[
                    dateFrom ? `From ${moment(dateFrom).format('MMM DD, YYYY')}` : '',
                    dateTo ? `To ${moment(dateTo).format('MMM DD, YYYY')}` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}{' '}
                  — {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
                </Text>
                <TouchableOpacity onPress={resetDates}>
                  <Feather name="x" size={16} color={Colors.red500} />
                </TouchableOpacity>
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
                searchQuery || hasActiveFilters
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

      {/* FAB: Create Invoice */}
      <View style={styles.fabWrapper}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.fab}
          onPress={() => navigation.navigate('InvoiceForm', {item: null})}>
          <Feather name="plus" size={RFPercentage(3)} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Date pickers */}
      <DatePicker
        modal
        open={showFromPicker}
        date={dateFrom || new Date()}
        mode="date"
        maximumDate={dateTo || undefined}
        onConfirm={onFromDateConfirm}
        onCancel={() => setShowFromPicker(false)}
      />
      <DatePicker
        modal
        open={showToPicker}
        date={dateTo || new Date()}
        mode="date"
        minimumDate={dateFrom || undefined}
        onConfirm={onToDateConfirm}
        onCancel={() => setShowToPicker(false)}
      />
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
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFPercentage(1),
    gap: RFPercentage(0.5),
  },
  dateRangeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(1.2),
    paddingHorizontal: RFPercentage(1.2),
    height: RFPercentage(5),
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    gap: RFPercentage(0.6),
  },
  dateRangeText: {
    flex: 1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.inputTextColor,
  },
  dateRangeSeparator: {
    paddingHorizontal: RFPercentage(0.3),
  },
  dateRangeClear: {
    width: RFPercentage(4),
    height: RFPercentage(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.8),
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(1),
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1),
    marginTop: RFPercentage(1),
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  filterChipText: {
    flex: 1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.primaryText,
  },
  resultHeader: {
    marginTop: RFPercentage(2),
    marginBottom: RFPercentage(0.5),
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
