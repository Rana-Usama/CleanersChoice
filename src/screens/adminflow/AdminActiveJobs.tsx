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
import {fetchActiveJobs, manageActiveAdminJob} from '../../services/adminService';
import auth from '@react-native-firebase/auth';
import {useAppAlert} from '../../components/AlertProvider';
import {showToast} from '../../utils/ToastMessage';
import {AdminJob} from '../../types/admin';
import {formatCityState} from '../../utils/locationFormat';
import useIsAdmin from '../../hooks/useIsAdmin';


const truncate = (text: any, max: number) => {
  const str = String(text ?? '');
  return str.length <= max ? str : `${str.slice(0, max).trim()}... `;
};

const AdminActiveJobs = ({navigation}: any) => {
  const isAdmin = useIsAdmin();
  const {showAlert} = useAppAlert();
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  const confirmDelete = (job: AdminJob) => {
    if (!isAdmin || deletingId || !auth().currentUser) return;
    showAlert({
      title: 'Delete Job',
      message: `Permanently delete "${job.title || 'this job'}"? This cannot be undone.`,
      variant: 'destructive',
      iconName: 'trash-can-outline',
      buttons: [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', style: 'destructive', onPress: async () => {
          setDeletingId(job.id);
          try {
            await manageActiveAdminJob(job.id, 'delete');
            setJobs(current => current.filter(item => item.id !== job.id));
            showToast({type: 'success', title: 'Job Deleted', message: 'Job deleted successfully'});
          } catch (error) {
            showToast({type: 'error', title: 'Unable to delete job',
              message: error instanceof Error ? error.message : 'Please try again.'});
          } finally {
            setDeletingId(null);
          }
        }},
      ],
    });
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

  /**
   * Pinned toolbar. Rendered as a sibling of the FlatList rather than as its
   * ListHeaderComponent: passing a function to ListHeaderComponent makes React
   * treat it as a *component type*, and because the arrow function gets a new
   * identity on every render, the whole header subtree (search TextInput
   * included) unmounts and remounts on each keystroke, dropping focus and the
   * keyboard. As a sibling it keeps a stable position in the tree.
   */
  const renderToolbar = () => (
    <View style={styles.toolbar}>
      <View style={styles.searchWrap}>
        <SearchField
          placeholder="Search jobs by title, type or location"
          value={query}
          onChangeText={setQuery}
          customStyle={styles.search}
        />
      </View>
      {!loading && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {filteredJobs.length} active job
            {filteredJobs.length === 1 ? '' : 's'}
            {query.trim() ? ` matching "${query.trim()}"` : ' platform-wide'}
          </Text>
        </View>
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
            <Text style={styles.headerTitle}>Active Jobs</Text>
          </View>
          <View style={{width: 40}} />
        </View>
      </LinearGradient>

      {/* Fixed — never scrolls with the list */}
      {isAdmin && renderToolbar()}

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
              footer={isAdmin && !!auth().currentUser && item.status === 'active' ? (
                <View style={styles.actions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.8}
                    style={[styles.actionButton, styles.editButton, deletingId !== null && styles.actionDisabled]}
                    disabled={deletingId !== null}
                    onPress={() => navigation.navigate('PostJob', {jobId: item.id, adminPost: true})}>
                    <LinearGradient colors={[Colors.gradient1, Colors.gradient2]} style={styles.actionInner}>
                      <Feather name="edit-2" size={16} color={Colors.white} />
                      <Text style={[styles.actionText, styles.editText]}>Edit Job</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.8}
                    style={[styles.actionButton, styles.deleteButton, deletingId !== null && styles.actionDisabled]}
                    disabled={deletingId !== null}
                    onPress={() => confirmDelete(item)}>
                    <View style={styles.actionInner}>
                      {deletingId === item.id ? <ActivityIndicator size="small" color={Colors.dangerRed} /> :
                        <Feather name="trash-2" size={16} color={Colors.dangerRed} />}
                      <Text style={[styles.actionText, styles.deleteText]}>{deletingId === item.id ? 'Deleting...' : 'Delete Job'}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : undefined}
            />
          )}
        />
      )}
    </View>
  );
};

export default AdminActiveJobs;

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: RFPercentage(1.2),
    marginHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1.5),
    borderTopWidth: 1,
    borderTopColor: Colors.grayBorderOverlay50,
  },
  actionButton: {
    flex: 1,
    borderRadius: RFPercentage(1.2),
    overflow: 'hidden',
  },
  actionInner: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RFPercentage(0.8),
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(1.2),
  },
  editButton: {backgroundColor: Colors.gradient1},
  deleteButton: {backgroundColor: Colors.redBg50, borderWidth: 1, borderColor: Colors.redBorder200},
  actionDisabled: {opacity: 0.6},
  editText: {color: Colors.white},
  deleteText: {color: Colors.dangerRed},
  actionText: {
    color: Colors.gradient1,
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
  },
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
    paddingTop: RFPercentage(1.5),
    paddingBottom: RFPercentage(6),
    flexGrow: 1,
  },
  toolbar: {
    paddingHorizontal: RFPercentage(2),
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorderOverlay60,
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
