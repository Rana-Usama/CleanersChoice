import React, {useCallback, useState} from 'react';
import {
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts} from '../../constants/Themes';
import {ADMIN_MODULES} from '../../constants/adminModules';
import AdminModuleCard from '../../components/admin/AdminModuleCard';
import AdminStatTile from '../../components/admin/AdminStatTile';
import {
  fetchAdminStats,
  fetchCleanerServices,
} from '../../services/adminService';
import {AdminStats} from '../../types/admin';
import useIsAdmin from '../../hooks/useIsAdmin';

/**
 * Admin hub — the single entry point for admin-only monitoring.
 *
 * Reached from the admin CTA on the cleaner Dashboard and from Settings. The
 * module list is rendered straight off ADMIN_MODULES, so adding a future admin
 * feature needs one registry entry and one screen — no changes here.
 *
 * Note this screen deliberately does NOT use `useExitAppOnBack()` (unlike the
 * tab-level screens): Android back should return to the Dashboard, not quit.
 */

const EMPTY_STATS: AdminStats = {
  activeJobs: 0,
  cleanerServices: 0,
  activeSubscriptions: 0,
  overdueSubscriptions: 0,
};

const AdminDashboard = ({navigation}: any) => {
  const isAdmin = useIsAdmin();
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      // The services list is needed for the subscription splits anyway, so it
      // doubles as the source for those two tiles — no second Users read.
      const services = await fetchCleanerServices();
      const next = await fetchAdminStats(services);
      setStats(next);
    } catch (error) {
      console.log('[AdminDashboard] stats failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  // Defence in depth: the CTA is already admin-gated, but if this screen is ever
  // reached another way (deep link, stale navigation state) it must not render.
  if (!isAdmin) {
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
            <Text style={styles.headerTitle}>Admin</Text>
            <View style={{width: 40}} />
          </View>
        </LinearGradient>
        <View style={styles.deniedWrap}>
          <MaterialCommunityIcons
            name="lock-outline"
            size={RFPercentage(6)}
            color={Colors.placeholderColor}
          />
          <Text style={styles.deniedText}>
            You don't have access to this section.
          </Text>
        </View>
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>Admin Controls</Text>
          </View>
          <View style={{width: 40}} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.container}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <AdminStatTile
              label="Active Jobs"
              value={stats.activeJobs}
              icon="briefcase-outline"
              tint={Colors.green500}
              loading={loading}
              onPress={() => navigation.navigate('AdminActiveJobs')}
            />
            <View style={styles.tileGap} />
            <AdminStatTile
              label="Cleaning Services"
              value={stats.cleanerServices}
              icon="shield-check"
              loading={loading}
              tint={Colors.green500}
              onPress={() => navigation.navigate('AdminCleanerServices')}
            />
          </View>

          <View style={styles.statsRow}>
            <AdminStatTile
              label="Active Subscriptions"
              value={stats.activeSubscriptions}
              icon="check-decagram-outline"
              tint={Colors.green500}
              loading={loading}
              onPress={() =>
                navigation.navigate('AdminCleanerServices', {
                  initialFilter: 'active',
                })
              }
            />
            <View style={styles.tileGap} />
            <AdminStatTile
              label="Overdue Subscriptions"
              value={stats.overdueSubscriptions}
              icon="alert-circle-outline"
              tint={Colors.amber500}
              loading={loading}
              onPress={() =>
                navigation.navigate('AdminCleanerServices', {
                  initialFilter: 'overdue',
                })
              }
            />
          </View>

          {/* Modules */}
          <Text style={styles.sectionTitle}>Sections</Text>
          {ADMIN_MODULES.filter(module => module.enabled).map(module => (
            <AdminModuleCard
              key={module.key}
              title={module.title}
              subtitle={module.subtitle}
              icon={module.icon}
              count={module.countKey ? stats[module.countKey] : undefined}
              onPress={() => navigation.navigate(module.route)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default AdminDashboard;

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
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: RFPercentage(6),
  },
  container: {
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(2),
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: RFPercentage(1.5),
  },
  tileGap: {
    width: RFPercentage(1.5),
  },
  sectionTitle: {
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    marginTop: RFPercentage(1),
    marginBottom: RFPercentage(1.2),
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RFPercentage(1),
    backgroundColor: Colors.gray50,
    borderRadius: RFPercentage(1.2),
    padding: RFPercentage(1.5),
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginTop: RFPercentage(0.5),
  },
  noticeText: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    flex: 1,
  },
  deniedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: RFPercentage(4),
  },
  deniedText: {
    color: Colors.placeholderColor,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.8),
    textAlign: 'center',
    marginTop: RFPercentage(1.5),
  },
});
