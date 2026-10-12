import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {Colors, Fonts} from '../../../constants/Themes';
import {WorkRecordLayout} from '../../../components/work/WorkRecordLayout';
import {WorkClockPanel} from '../../../components/work/WorkClockPanel';
import {workSessionTone, workStyles} from '../../../components/work/workTheme';
import {
  WorkButton,
  WorkNavRow,
  WorkPill,
} from '../../../components/work/WorkUI';
import {useWorkSessions} from '../../../components/work/WorkSessionProvider';
import {
  canStartWork,
  canUseWorkRecords,
  formatWorkDuration,
  formatWorkTime,
  workSessionTitle,
} from '../../../utils/workSessionFlow';
import type {WorkSession} from '../../../types/workSession';
import auth from '@react-native-firebase/auth';

const PAGE = 25;
const WorkTracking = ({navigation, route}: any) => {
  const work = useWorkSessions();
  const {uid, refresh} = work;
  const [records, setRecords] = useState<WorkSession[]>([]);
  const [cursor, setCursor] =
    useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const usable = canUseWorkRecords(work.user);
  const generation = useRef(0);
  const load = useCallback(async () => {
    if (!uid || !usable) {
      return;
    }
    setLoading(true);
    setError('');
    const revision = generation.current;
    try {
      const query = firestore()
        .collection('WorkSessions')
        .where('cleanerId', '==', uid)
        .orderBy('startedAt', 'desc')
        .limit(PAGE);
      const snapshot = await query.get({source: 'server'});
      if (revision !== generation.current || auth().currentUser?.uid !== uid) {
        return;
      }
      setRecords(
        snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as WorkSession)),
      );
      setCursor(snapshot.docs[snapshot.docs.length - 1] || null);
      setMore(snapshot.size === PAGE);
      await refresh();
    } catch {
      setError('Could not load work history. Reconnect and try again.');
    } finally {
      setLoading(false);
    }
  }, [uid, usable, refresh]);
  useEffect(() => {
    generation.current += 1;
    setRecords([]);
    return () => {
      generation.current += 1;
    };
  }, [uid]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  useEffect(() => {
    if (!usable || !route.params?.sessionId) {
      return;
    }
    navigation.navigate('WorkSessionDetails', {
      sessionId: route.params.sessionId,
    });
    navigation.setParams({sessionId: undefined});
  }, [usable, route.params?.sessionId, navigation]);

  const loadMore = async () => {
    if (!cursor || loading || !work.uid) {
      return;
    }
    setLoading(true);
    const revision = generation.current;
    try {
      const snapshot = await firestore()
        .collection('WorkSessions')
        .where('cleanerId', '==', work.uid)
        .orderBy('startedAt', 'desc')
        .startAfter(cursor)
        .limit(PAGE)
        .get({source: 'server'});
      if (
        revision !== generation.current ||
        auth().currentUser?.uid !== work.uid
      ) {
        return;
      }
      setRecords(prev => [
        ...prev,
        ...snapshot.docs.map(
          doc => ({...doc.data(), id: doc.id} as WorkSession),
        ),
      ]);
      setCursor(snapshot.docs[snapshot.docs.length - 1] || null);
      setMore(snapshot.size === PAGE);
    } catch {
      setError('Could not load older records. Please retry.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <WorkRecordLayout
      title="Work Tracking"
      onBack={() =>
        navigation.canGoBack()
          ? navigation.goBack()
          : navigation.navigate('Premium')
      }
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      {!usable ? (
        <Text style={styles.help}>
          Sign in with a usable cleaner account and complete the required
          instructions and business information to access work records.
        </Text>
      ) : (
        <>
          {!canStartWork(work.user, work.now) && (
            <View style={[workStyles.card, workStyles.warnCard]}>
              <Text style={styles.title}>Your records remain available</Text>
              <Text style={styles.help}>
                You can finish and review existing work. Renew to clock in
                again.
              </Text>
              <WorkButton
                variant="warn"
                icon="refresh"
                label="Renew subscription"
                onPress={() => navigation.navigate('Premium')}
              />
            </View>
          )}
          <WorkClockPanel />
          <WorkNavRow
            icon="chart-timeline-variant"
            title="Monthly hours & earnings"
            subtitle="Work hours, earned amounts and session history"
            onPress={() => navigation.navigate('WorkHours')}
          />
          {work.manualAvailable && (
            <WorkNavRow
              icon="plus-circle-outline"
              title="Add past work manually"
              subtitle="Forgot to clock in? Log it here"
              onPress={() => navigation.navigate('ManualWorkEntry')}
            />
          )}
          {work.reviews.length > 0 && (
            <>
              <Text style={styles.title}>Awaiting your review</Text>
              {work.reviews.map(session => (
                <WorkNavRow
                  key={session.id}
                  tone="warn"
                  icon="alert-outline"
                  title={workSessionTitle(session)}
                  subtitle={`${formatWorkDuration(
                    session.estimatedDurationMs,
                  )} estimated · not counted`}
                  badge="Review"
                  disabled={work.busy || work.pending}
                  onPress={() => void work.review(session)}
                />
              ))}
            </>
          )}
          <Text style={styles.title}>Recent work</Text>
          <Text style={styles.help}>
            Pull down to refresh completed records.
          </Text>
          {records.length === 0 && !loading && (
            <Text style={styles.help}>No work records yet.</Text>
          )}
          {records.map(saved => {
            const session =
              work.current?.id === saved.id
                ? work.current
                : work.reviews.find(s => s.id === saved.id) || saved;
            return (
              <TouchableOpacity
                key={session.id}
                activeOpacity={0.75}
                accessibilityRole="button"
                style={styles.record}
                onPress={() =>
                  navigation.navigate('WorkSessionDetails', {
                    sessionId: session.id,
                  })
                }>
                <View style={workStyles.rowBetween}>
                  <Text
                    style={[styles.title, workStyles.grow]}
                    numberOfLines={2}>
                    {workSessionTitle(session)}
                  </Text>
                  <WorkPill tone={workSessionTone(session)} />
                </View>
                <Text style={styles.help}>
                  {formatWorkTime(session.startedAt, session.reportingTimeZone)}
                  {session.endedAt !== null
                    ? ` → ${formatWorkTime(
                        session.endedAt,
                        session.reportingTimeZone,
                      )}`
                    : ''}
                </Text>
                <Text style={styles.help}>
                  {session.status === 'confirmed'
                    ? `${formatWorkDuration(session.durationMs)} confirmed`
                    : session.status === 'needsReview'
                    ? 'Pending · not counted'
                    : session.status === 'discarded'
                    ? 'Discarded · not counted'
                    : 'Running · not counted'}
                </Text>
              </TouchableOpacity>
            );
          })}
          {more && (
            <WorkButton
              variant="ghost"
              icon="chevron-down"
              label="Load older work"
              disabled={loading}
              onPress={loadMore}
            />
          )}
        </>
      )}
      {!!error && (
        <View style={[workStyles.card, workStyles.warnCard]}>
          <Text style={styles.error}>{error}</Text>
          <WorkButton
            variant="warn"
            icon="refresh"
            label="Retry"
            onPress={load}
          />
        </View>
      )}
      {loading && <ActivityIndicator color={Colors.gradient1} />}
    </WorkRecordLayout>
  );
};
export default WorkTracking;
const styles = StyleSheet.create({
  title: {fontFamily: Fonts.semiBold, color: Colors.slateText, fontSize: 16},
  help: {fontFamily: Fonts.fontRegular, fontSize: 14, lineHeight: 21, color: Colors.secondaryText},
  record: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
    gap: 6,
  },
  error: {fontFamily: Fonts.fontRegular, color: Colors.amberDarkText, lineHeight: 21},
});
