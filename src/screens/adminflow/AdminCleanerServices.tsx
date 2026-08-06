import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import AdminServiceCard from '../../components/admin/AdminServiceCard';
import NotFound from '../../components/NotFound';
import SearchField from '../../components/SearchField';
import {Colors, Fonts} from '../../constants/Themes';
import {formatServiceTypes} from '../../constants/adminModules';
import {fetchCleanerServices} from '../../services/adminService';
import {AdminCleanerService} from '../../types/admin';
import {
  matchesFilter,
  SUBSCRIPTION_FILTERS,
} from '../../utils/subscriptionStatus';
import {formatCityState} from '../../utils/locationFormat';
import useIsAdmin from '../../hooks/useIsAdmin';

/**
 * All cleaner services, platform-wide, with the owning cleaner's subscription
 * state joined from `Users.subscriptionStatus`.
 *
 * `CleanerServices` is one document per cleaner (keyed by uid), so each row is a
 * cleaner's service profile. Unlike the customer Home screen this list applies
 * no completeness filter — an incomplete profile is exactly what an admin wants
 * to see.
 *
 * Tapping a row opens the existing CleanerProfile screen, which already renders
 * `Users/{cleanerId}` + `CleanerServices/{cleanerId}` for any cleaner and guards
 * every field with optional chaining. (ServiceDetails was the other candidate,
 * but it dereferences `item.createdAt._seconds` and `item.description` without
 * guards, so an incomplete service would crash it.)
 */

/** A chip key from SUBSCRIPTION_FILTERS — one chip can cover several badges. */
type FilterKey = string;

const AdminCleanerServices = ({navigation, route}: any) => {
  const isAdmin = useIsAdmin();
  const [services, setServices] = useState<AdminCleanerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>(
    route?.params?.initialFilter ?? 'all',
  );

  const loadServices = useCallback(async () => {
    try {
      const result = await fetchCleanerServices();
      setServices(result);
    } catch (error) {
      console.log('[AdminCleanerServices] fetch failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  // Counted per CHIP rather than per badge, since a chip can cover several
  // badges (Cancelled = cancelling + cancelled).
  const counts = useMemo(() => {
    const base: Record<string, number> = {};
    SUBSCRIPTION_FILTERS.forEach(chip => {
      base[chip.key] = services.filter(s =>
        matchesFilter(chip.key, s.badge),
      ).length;
    });
    return base;
  }, [services]);

  const filteredServices = useMemo(() => {
    const term = query.trim().toLowerCase();

    return services.filter(service => {
      if (!matchesFilter(filter, service.badge)) return false;
      if (!term) return true;

      const haystack = [
        service.name,
        formatServiceTypes(service.type),
        formatCityState(service.location, ''),
        service.location?.name,
        service.cleanerEmail,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [services, query, filter]);

  /**
   * Pinned toolbar. Rendered as a sibling of the FlatList rather than as its
   * ListHeaderComponent, so the search field and filter chips stay fixed in
   * place and only the service rows scroll vertically.
   *
   * The chip row is still horizontally scrollable — that's the chips overflowing
   * their own track, not the toolbar moving.
   */
  const renderToolbar = () => (
    <View style={styles.toolbar}>
      <View style={styles.searchWrap}>
        <SearchField
          placeholder="Search by cleaner, service or city"
          value={query}
          onChangeText={setQuery}
          customStyle={styles.search}
        />
      </View>

      <ScrollView
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}>
        {SUBSCRIPTION_FILTERS.map(chip => {
          const active = filter === chip.key;
          const count = counts[chip.key] ?? 0;
          return (
            <TouchableOpacity
              key={chip.key}
              activeOpacity={0.8}
              onPress={() => setFilter(chip.key as FilterKey)}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {/* Counts are meaningless until the fetch lands */}
                {loading ? chip.label : `${chip.label} ${count}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {!loading && (
        <Text style={styles.summaryText}>
          {filteredServices.length} service
          {filteredServices.length === 1 ? '' : 's'} shown
        </Text>
      )}
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
            <Text style={styles.headerTitle}>Cleaning Services</Text>
          </View>
          <View style={{width: 40}} />
        </View>
      </LinearGradient>

      {!isAdmin ? (
        <NotFound text="You don't have access to this section." />
      ) : (
        <>
          {/* Fixed — never scrolls with the list */}
          {renderToolbar()}

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={Colors.gradient1} />
            </View>
          ) : (
            <FlatList
              data={filteredServices}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              initialNumToRender={6}
              maxToRenderPerBatch={8}
              windowSize={7}
              removeClippedSubviews={Platform.OS === 'android'}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <NotFound
                  text={
                    query.trim() || filter !== 'all'
                      ? 'No cleaner services match these filters'
                      : 'No cleaner services have been created yet'
                  }
                />
              }
              renderItem={({item}) => (
                <AdminServiceCard
                  service={item}
                  onPress={() =>
                    navigation.navigate('CleanerProfile', {cleanerId: item.id})
                  }
                />
              )}
            />
          )}
        </>
      )}
    </View>
  );
};

export default AdminCleanerServices;

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
  // Pinned toolbar: sits between the gradient header and the list, so the
  // search field and chips hold their position while rows scroll underneath.
  toolbar: {
    paddingHorizontal: RFPercentage(2),
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorderOverlay60,
  },
  listContent: {
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(1.5),
    paddingBottom: RFPercentage(6),
    flexGrow: 1,
  },
  searchWrap: {
    alignItems: 'center',
  },
  search: {
    width: '100%',
  },
  chipRow: {
    paddingBottom: RFPercentage(1.2),
    gap: RFPercentage(0.8),
  },
  chip: {
    paddingHorizontal: RFPercentage(1.6),
    paddingVertical: RFPercentage(0.7),
    borderRadius: RFPercentage(100),
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
  },
  chipActive: {
    backgroundColor: Colors.gradient1,
    borderColor: Colors.gradient1,
  },
  chipText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.45),
  },
  chipTextActive: {
    color: Colors.white,
    fontFamily: Fonts.semiBold,
  },
  summaryText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    marginBottom: RFPercentage(1),
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
