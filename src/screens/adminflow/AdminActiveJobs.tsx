import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import JobCard from '../../components/JobCard';
import NotFound from '../../components/NotFound';
import SearchField from '../../components/SearchField';
import {Colors, Fonts} from '../../constants/Themes';
import {fetchActiveJobs} from '../../services/adminService';
import {AdminJob} from '../../types/admin';
import {formatCityState} from '../../utils/locationFormat';
import useIsAdmin from '../../hooks/useIsAdmin';

/**
 * All ACTIVE customer-posted jobs, platform-wide.
 *
 * Reuses the same `JobCard` and the same `Jobs` + `status == 'active'` query the
 * cleaner Job List uses — the only difference is that the 50 km distance filter
 * is not applied, which is the point of the admin view. Completed, cancelled,
 * confirmed and expired jobs are excluded at the query level, so they can never
 * appear here.
 *
 * Tapping a job opens the existing JobDetails screen unchanged.
 */

/** Mirrors the truncation the cleaner Job List applies to JobCard. */
const truncate = (text: any, max: number) => {
  const str = String(text ?? '');
  return str.length <= max ? str : `${str.slice(0, max).trim()}... `;
};

const AdminActiveJobs = ({navigation}: any) => {
  const isAdmin = useIsAdmin();
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const loadJobs = useCallback(async () => {
    try {
      const result = await fetchActiveJobs();
      setJobs(result);
    } catch (error) {
      console.log('[AdminActiveJobs] fetch failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [loadJobs]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const filteredJobs = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return jobs;
    return jobs.filter(job => {
      const haystack = [job.title, job.type, job.location?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [jobs, query]);

  const renderHeader = () => (
    <View>
      <View style={styles.searchWrap}>
        <SearchField
          placeholder="Search jobs by title, type or location"
          value={query}
          onChangeText={setQuery}
          customStyle={styles.search}
        />
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          {filteredJobs.length} active job
          {filteredJobs.length === 1 ? '' : 's'}
          {query.trim() ? ` matching "${query.trim()}"` : ' platform-wide'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent={true}
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
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Active Jobs</Text>
          </View>
          <View style={{width: 40}} />
        </View>
      </LinearGradient>

      {!isAdmin ? (
        <NotFound text="You don't have access to this section." />
      ) : loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={Colors.gradient1} />
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <NotFound
              text={
                query.trim()
                  ? 'No active jobs match your search'
                  : 'No active jobs on the platform right now'
              }
            />
          }
          renderItem={({item}) => (
            <JobCard
              name={truncate(item.title, 23)}
              location={formatCityState(item.location)}
              price={truncate(item.priceRange, 30)}
              date={item.createdAt}
              onPress={() => navigation.navigate('JobDetails', {item})}
              delete={false}
            />
          )}
        />
      )}
    </View>
  );
};

export default AdminActiveJobs;

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
    backgroundColor: Colors.whiteOverlay20,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: RFPercentage(2.1),
    fontFamily: Fonts.semiBold,
  },
  headerSubtitle: {
    color: Colors.whiteOverlay80,
    fontSize: RFPercentage(1.4),
    fontFamily: Fonts.fontRegular,
    marginTop: RFPercentage(0.2),
  },
  listContent: {
    paddingHorizontal: RFPercentage(2),
    paddingBottom: RFPercentage(6),
    flexGrow: 1,
  },
  searchWrap: {
    alignItems: 'center',
  },
  search: {
    width: '100%',
  },
  summaryRow: {
    marginBottom: RFPercentage(1),
  },
  summaryText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
