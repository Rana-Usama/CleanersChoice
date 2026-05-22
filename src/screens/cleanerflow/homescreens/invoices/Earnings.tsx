import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {useFocusEffect} from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts} from '../../../../constants/Themes';
import HeaderBack from '../../../../components/HeaderBack';
import NotFound from '../../../../components/NotFound';
import {Invoice} from '../../../../types/invoice';
import {invoiceToFormData} from '../../../../services/invoiceService';
import {
  buildAnnualEarningsSummary,
  getMonthLabel,
  getPaidInvoiceYears,
  paidAtToDate,
  parseInvoiceAmount,
} from '../../../../services/earningsService';

const PER_PAGE = 10;
const BAR_MAX_HEIGHT = RFPercentage(12);
const CURRENT_YEAR = new Date().getFullYear();

const formatCurrency = (amount: number): string =>
  `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatPaidDate = (paidAt: any): string => {
  const date = paidAtToDate(paidAt);
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const Earnings = ({navigation}: any) => {
  const [paidInvoices, setPaidInvoices] = useState<Invoice[]>([]);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPaidInvoices = useCallback(async () => {
    const user = auth().currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const snapshot = await firestore()
        .collection('Invoices')
        .where('cleanerId', '==', user.uid)
        .where('paymentStatus', '==', 'paid')
        .get();

      const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Invoice[];

      invoices.sort((a, b) => {
        const aTime = paidAtToDate(a.paidAt)?.getTime() || 0;
        const bTime = paidAtToDate(b.paidAt)?.getTime() || 0;
        return bTime - aTime;
      });

      setPaidInvoices(invoices);
    } catch (error) {
      console.error('Error fetching earnings invoices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPaidInvoices();
    }, [fetchPaidInvoices]),
  );

  const years = useMemo(
    () => getPaidInvoiceYears(paidInvoices, CURRENT_YEAR),
    [paidInvoices],
  );

  const summary = useMemo(
    () => buildAnnualEarningsSummary(paidInvoices, selectedYear),
    [paidInvoices, selectedYear],
  );

  const maxMonthlyTotal = Math.max(
    1,
    ...summary.monthly.map(month => month.total),
  );
  const displayedInvoices = useMemo(() => {
    if (selectedMonth === null) {
      return summary.paidInvoices;
    }
    return summary.paidInvoices.filter(invoice => {
      const paidAt = paidAtToDate(invoice.paidAt);
      return paidAt?.getMonth() === selectedMonth;
    });
  }, [selectedMonth, summary.paidInvoices]);

  const totalPages = Math.max(
    1,
    Math.ceil(displayedInvoices.length / PER_PAGE),
  );
  const paginatedInvoices = displayedInvoices.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaidInvoices().finally(() => setRefreshing(false));
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setSelectedMonth(null);
    setCurrentPage(1);
  };

  const handleMonthPress = (month: number) => {
    setSelectedMonth(prev => (prev === month ? null : month));
    setCurrentPage(1);
  };

  const handleInvoicePress = (invoice: Invoice) => {
    navigation.navigate('InvoicePreview', {
      formData: invoiceToFormData(invoice),
      jobItem: {id: invoice.jobId, jobId: invoice.customerId},
      invoice,
      viewOnly: true,
      paymentActionsDisabled: true,
    });
  };

  const yoyText =
    summary.yoyPercent === null
      ? summary.total > 0
        ? `New vs ${selectedYear - 1}`
        : `No paid invoices in ${selectedYear - 1}`
      : `${summary.yoyPercent >= 0 ? '+' : ''}${summary.yoyPercent.toFixed(
          0,
        )}% vs ${selectedYear - 1}`;

  return (
    <View style={styles.safeArea}>
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
          <Text style={styles.headerTitle}>Earnings</Text>
          <View style={{width: 40}} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gradient1}
          />
        }>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryEyebrow}>
            Total earned in {selectedYear}
          </Text>
          <Text style={styles.totalText}>{formatCurrency(summary.total)}</Text>
          <View
            style={[
              styles.yoyPill,
              summary.yoyPercent !== null &&
                summary.yoyPercent < 0 &&
                styles.yoyPillNegative,
            ]}>
            <Feather
              name={
                summary.yoyPercent !== null && summary.yoyPercent < 0
                  ? 'trending-down'
                  : 'trending-up'
              }
              size={RFPercentage(1.7)}
              color={
                summary.yoyPercent !== null && summary.yoyPercent < 0
                  ? Colors.red500
                  : Colors.green500
              }
            />
            <Text
              style={[
                styles.yoyText,
                summary.yoyPercent !== null &&
                  summary.yoyPercent < 0 &&
                  styles.yoyTextNegative,
              ]}>
              {yoyText}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearChips}>
          {years.map(year => {
            const active = selectedYear === year;
            return (
              <TouchableOpacity
                key={year}
                activeOpacity={0.8}
                onPress={() => handleYearChange(year)}
                style={[styles.yearChip, active && styles.yearChipActive]}>
                <Text
                  style={[
                    styles.yearChipText,
                    active && styles.yearChipTextActive,
                  ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.gradient1} />
            <Text style={styles.loadingText}>Loading earnings...</Text>
          </View>
        ) : summary.paidInvoices.length === 0 ? (
          <NotFound text="No paid invoices yet" />
        ) : (
          <>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Monthly earnings</Text>
                {selectedMonth !== null ? (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => handleMonthPress(selectedMonth)}
                    style={styles.clearMonthBtn}>
                    <Text style={styles.clearMonthText}>All months</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.chart}>
                {summary.monthly.map(month => {
                  const active = selectedMonth === month.month;
                  const height = Math.max(
                    RFPercentage(1),
                    (month.total / maxMonthlyTotal) * BAR_MAX_HEIGHT,
                  );
                  return (
                    <TouchableOpacity
                      key={month.month}
                      activeOpacity={0.8}
                      onPress={() => handleMonthPress(month.month)}
                      style={styles.barColumn}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.bar,
                            {height},
                            active && styles.barActive,
                            month.total === 0 && styles.barEmpty,
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.barLabel,
                          active && styles.barLabelActive,
                        ]}>
                        {month.shortLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedMonth !== null ? (
                <Text style={styles.drilldownText}>
                  Showing {getMonthLabel(selectedMonth)} paid invoices
                </Text>
              ) : null}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Top customers this year</Text>
              {summary.topCustomers.length === 0 ? (
                <Text style={styles.emptySectionText}>No customers yet</Text>
              ) : (
                summary.topCustomers.map((customer, index) => (
                  <View key={customer.customerId} style={styles.customerRow}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.customerInfo}>
                      <Text style={styles.customerName} numberOfLines={1}>
                        {customer.name}
                      </Text>
                      <Text style={styles.customerMeta} numberOfLines={1}>
                        {customer.count} paid invoice
                        {customer.count !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Text style={styles.customerAmount}>
                      {formatCurrency(customer.total)}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedMonth === null
                    ? 'All paid invoices'
                    : `${getMonthLabel(selectedMonth)} paid invoices`}
                </Text>
                <Text style={styles.invoiceCount}>
                  {displayedInvoices.length}
                </Text>
              </View>

              {paginatedInvoices.length === 0 ? (
                <Text style={styles.emptySectionText}>
                  No paid invoices for this month
                </Text>
              ) : (
                paginatedInvoices.map(invoice => (
                  <TouchableOpacity
                    key={invoice.id || invoice.invoiceId}
                    activeOpacity={0.82}
                    onPress={() => handleInvoicePress(invoice)}
                    style={styles.invoiceRow}>
                    <View style={styles.invoiceIcon}>
                      <MaterialCommunityIcons
                        name="file-document-outline"
                        size={RFPercentage(2.2)}
                        color={Colors.gradient1}
                      />
                    </View>
                    <View style={styles.invoiceInfo}>
                      <Text style={styles.invoiceTitle} numberOfLines={1}>
                        {invoice.invoiceId}
                      </Text>
                      <Text style={styles.invoiceMeta} numberOfLines={1}>
                        {invoice.toName} · Paid {formatPaidDate(invoice.paidAt)}
                      </Text>
                    </View>
                    <View style={styles.invoiceAmountWrap}>
                      <Text style={styles.invoiceAmount}>
                        {formatCurrency(parseInvoiceAmount(invoice.price))}
                      </Text>
                      <Feather
                        name="chevron-right"
                        size={RFPercentage(2)}
                        color={Colors.gray400}
                      />
                    </View>
                  </TouchableOpacity>
                ))
              )}

              {displayedInvoices.length > PER_PAGE ? (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    disabled={currentPage === 1}
                    onPress={() => setCurrentPage(page => page - 1)}
                    style={[
                      styles.pageButton,
                      currentPage === 1 && styles.pageButtonDisabled,
                    ]}>
                    <Feather
                      name="chevron-left"
                      size={RFPercentage(2)}
                      color={
                        currentPage === 1 ? Colors.gray300 : Colors.gradient1
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
                  <Text style={styles.pageText}>
                    {currentPage} / {totalPages}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    disabled={currentPage === totalPages}
                    onPress={() => setCurrentPage(page => page + 1)}
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
                      size={RFPercentage(2)}
                      color={
                        currentPage === totalPages
                          ? Colors.gray300
                          : Colors.gradient1
                      }
                    />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default Earnings;

const styles = StyleSheet.create({
  safeArea: {
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
  scrollContent: {
    paddingHorizontal: RFPercentage(2),
    paddingBottom: RFPercentage(8),
    paddingTop:RFPercentage(5)
  },
  summaryCard: {
    marginTop: RFPercentage(-2.2),
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(2),
    borderWidth: 1,
    borderColor: Colors.blueBorderOverlay50,
    padding: RFPercentage(2),
    shadowColor: Colors.shadowBlueGrayLight,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryEyebrow: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
  },
  totalText: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(3.9),
    color: Colors.primaryText,
    marginTop: RFPercentage(0.8),
  },
  yoyPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RFPercentage(1.2),
    paddingHorizontal: RFPercentage(1.1),
    paddingVertical: RFPercentage(0.55),
    borderRadius: RFPercentage(100),
    backgroundColor: Colors.greenBg50,
    gap: RFPercentage(0.45),
  },
  yoyPillNegative: {
    backgroundColor: Colors.redBg50,
  },
  yoyText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.4),
    color: Colors.green800,
  },
  yoyTextNegative: {
    color: Colors.red500,
  },
  yearChips: {
    paddingVertical: RFPercentage(1.5),
    gap: RFPercentage(0.8),
  },
  yearChip: {
    paddingHorizontal: RFPercentage(1.6),
    paddingVertical: RFPercentage(0.85),
    borderRadius: RFPercentage(100),
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
  },
  yearChipActive: {
    backgroundColor: Colors.gradient1,
    borderColor: Colors.gradient1,
  },
  yearChipText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
  },
  yearChipTextActive: {
    color: Colors.white,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RFPercentage(12),
  },
  loadingText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    color: Colors.secondaryText,
    marginTop: RFPercentage(1),
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(1.6),
    borderWidth: 1,
    borderColor: Colors.grayBorderOverlay50,
    padding: RFPercentage(1.6),
    marginBottom: RFPercentage(1.6),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: RFPercentage(1.2),
    gap: RFPercentage(1),
  },
  sectionTitle: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
    color: Colors.primaryText,
  },
  clearMonthBtn: {
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(100),
    backgroundColor: Colors.primaryBlueOverlay10,
  },
  clearMonthText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.3),
    color: Colors.gradient1,
  },
  chart: {
    height: BAR_MAX_HEIGHT + RFPercentage(3.5),
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: RFPercentage(0.45),
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    height: BAR_MAX_HEIGHT,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '72%',
    borderTopLeftRadius: RFPercentage(0.55),
    borderTopRightRadius: RFPercentage(0.55),
    borderBottomLeftRadius: RFPercentage(0.25),
    borderBottomRightRadius: RFPercentage(0.25),
    backgroundColor: Colors.gradient1,
  },
  barActive: {
    backgroundColor: Colors.green500,
  },
  barEmpty: {
    backgroundColor: Colors.gray200,
  },
  barLabel: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.15),
    color: Colors.secondaryText,
    marginTop: RFPercentage(0.6),
  },
  barLabelActive: {
    color: Colors.green800,
  },
  drilldownText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
    marginTop: RFPercentage(1.2),
  },
  emptySectionText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.secondaryText,
    paddingVertical: RFPercentage(1),
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RFPercentage(1),
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorderOverlay50,
    gap: RFPercentage(1),
    marginTop:RFPercentage(2)
  },
  rankBadge: {
    width: RFPercentage(3.2),
    height: RFPercentage(3.2),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBlueOverlay10,
  },
  rankText: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.4),
    color: Colors.gradient1,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.55),
    color: Colors.primaryText,
  },
  customerMeta: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.25),
    color: Colors.secondaryText,
    marginTop: 2,
  },
  customerAmount: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.55),
    color: Colors.green800,
  },
  invoiceCount: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.45),
    color: Colors.gradient1,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RFPercentage(1.2),
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorderOverlay50,
    gap: RFPercentage(1),
  },
  invoiceIcon: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(1),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBlueOverlay10,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.5),
    color: Colors.primaryText,
  },
  invoiceMeta: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.25),
    color: Colors.secondaryText,
    marginTop: 2,
  },
  invoiceAmountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.2),
  },
  invoiceAmount: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.45),
    color: Colors.primaryText,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: RFPercentage(1.4),
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(0.3),
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: RFPercentage(1),
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.8),
  },
  pageButtonDisabled: {
    backgroundColor: Colors.gray50,
  },
  pageButtonText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.35),
    color: Colors.gradient1,
  },
  pageButtonTextDisabled: {
    color: Colors.gray300,
  },
  pageText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.45),
    color: Colors.primaryText,
  },
});
