import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {Colors, Fonts} from '../../../constants/Themes';
import {invoiceToFormData} from '../../../services/invoiceService';
import {WorkClockPanel} from '../../../components/work/WorkClockPanel';
import {useWorkSessions} from '../../../components/work/WorkSessionProvider';
import {
  canStartWork,
  canUseWorkRecords,
  formatWorkDuration,
  formatWorkTime,
} from '../../../utils/workSessionFlow';
import type {WorkSession} from '../../../types/workSession';
import auth from '@react-native-firebase/auth';

const PAGE = 25;
const WorkTracking = ({navigation, route}: any) => {
  const work = useWorkSessions();
  const {uid, refresh} = work;
  const [records, setRecords] = useState<WorkSession[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [cursor, setCursor] =
    useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
  const [invoiceCursor, setInvoiceCursor] =
    useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
  const [more, setMore] = useState(false);
  const [moreInvoices, setMoreInvoices] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInvoices, setShowInvoices] = useState(false);
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
    setInvoices([]);
    setShowInvoices(false);
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
  const loadInvoices = async (older = false) => {
    if (!work.uid || loading) {
      return;
    }
    setLoading(true);
    setError('');
    setShowInvoices(true);
    const revision = generation.current;
    try {
      let query = firestore()
        .collection('Invoices')
        .where('cleanerId', '==', work.uid)
        .orderBy('createdAt', 'desc')
        .limit(PAGE);
      if (older && invoiceCursor) {
        query = query.startAfter(invoiceCursor);
      }
      const snapshot = await query.get({source: 'server'});
      if (
        revision !== generation.current ||
        auth().currentUser?.uid !== work.uid
      ) {
        return;
      }
      const items = snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
      setInvoices(prev => (older ? [...prev, ...items] : items));
      setInvoiceCursor(snapshot.docs[snapshot.docs.length - 1] || null);
      setMoreInvoices(snapshot.size === PAGE);
    } catch {
      setError('Could not load existing invoices. Please retry.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() =>
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.navigate('Premium')
          }>
          <Text style={styles.link}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Work tracking</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Premium')}>
          <Text style={styles.link}>Subscription</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }>
        {!usable ? (
          <Text style={styles.help}>
            Sign in with a usable cleaner account and complete the required
            instructions and business information to access work records.
          </Text>
        ) : (
          <>
            {!canStartWork(work.user, work.now) && (
              <View style={styles.notice}>
                <Text style={styles.title}>Your records remain available</Text>
                <Text style={styles.help}>
                  You can finish and review existing work. Renew to clock in
                  again.
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Premium')}>
                  <Text style={styles.link}>Renew subscription</Text>
                </TouchableOpacity>
              </View>
            )}
            <WorkClockPanel />
            <TouchableOpacity onPress={() => navigation.navigate('WorkHours')}>
              <Text style={styles.link}>View monthly hours and earnings</Text>
            </TouchableOpacity>
            {work.manualAvailable && (
              <TouchableOpacity
                onPress={() => navigation.navigate('ManualWorkEntry')}>
                <Text style={styles.link}>Add past work manually</Text>
              </TouchableOpacity>
            )}
            {work.reviews.length > 0 && (
              <>
                <Text style={styles.title}>Awaiting your review</Text>
                {work.reviews.map(session => (
                  <TouchableOpacity
                    key={session.id}
                    style={styles.record}
                    disabled={work.busy || work.pending}
                    onPress={() =>
                      navigation.navigate('WorkSessionDetails', {
                        sessionId: session.id,
                      })
                    }>
                    <Text style={styles.title}>
                      {session.jobSnapshot?.title || 'General work'}
                    </Text>
                    <Text style={styles.help}>
                      {formatWorkDuration(session.estimatedDurationMs)}{' '}
                      estimated · not counted
                    </Text>
                    <Text style={styles.link}>
                      Review times and record details
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            <Text style={styles.title}>Recent work</Text>
            <Text style={styles.help}>
              Times use each record’s saved reporting timezone. Pull down to
              refresh completed records.
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
                  style={styles.record}
                  onPress={() =>
                    navigation.navigate('WorkSessionDetails', {
                      sessionId: session.id,
                    })
                  }>
                  <Text style={styles.title}>
                    {session.jobSnapshot?.title || 'General work'}
                  </Text>
                  <Text style={styles.help}>
                    {formatWorkTime(
                      session.startedAt,
                      session.reportingTimeZone,
                    )}
                    {session.endedAt !== null
                      ? ` → ${formatWorkTime(
                          session.endedAt,
                          session.reportingTimeZone,
                        )}`
                      : ''}
                  </Text>
                  <Text style={styles.help}>
                    {session.reportingTimeZone} ·{' '}
                    {session.status === 'confirmed'
                      ? `${formatWorkDuration(session.durationMs)} confirmed`
                      : session.status === 'needsReview'
                      ? 'Pending · not counted'
                      : session.status === 'discarded'
                      ? 'Discarded · not counted'
                      : 'Running · not counted'}
                  </Text>
                  <Text style={styles.link}>View details and history</Text>
                </TouchableOpacity>
              );
            })}
            {more && (
              <TouchableOpacity disabled={loading} onPress={loadMore}>
                <Text style={styles.link}>Load older work</Text>
              </TouchableOpacity>
            )}
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => navigation.navigate('Earnings')}>
                <Text style={styles.link}>View collected earnings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={loading}
                onPress={() => {
                  void loadInvoices();
                }}>
                <Text style={styles.link}>View existing invoices</Text>
              </TouchableOpacity>
            </View>
            {showInvoices && (
              <>
                <Text style={styles.title}>Existing invoices</Text>
                {invoices.length === 0 && !loading && (
                  <Text style={styles.help}>No invoices yet.</Text>
                )}
                {invoices.map(invoice => (
                  <TouchableOpacity
                    key={invoice.id}
                    style={styles.record}
                    onPress={() =>
                      navigation.navigate('InvoicePreview', {
                        invoice,
                        formData: invoiceToFormData(invoice),
                        jobItem: {id: invoice.jobId, jobId: invoice.customerId},
                        viewOnly: true,
                        paymentActionsDisabled: true,
                      })
                    }>
                    <Text style={styles.title}>
                      {invoice.invoiceId || 'Invoice'} · {invoice.toName}
                    </Text>
                    <Text style={styles.help}>
                      ${invoice.price} · {invoice.paymentStatus || 'unpaid'}
                    </Text>
                  </TouchableOpacity>
                ))}
                {moreInvoices && (
                  <TouchableOpacity
                    disabled={loading}
                    onPress={() => {
                      void loadInvoices(true);
                    }}>
                    <Text style={styles.link}>Load older invoices</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}
        {!!error && (
          <TouchableOpacity onPress={load}>
            <Text style={styles.error}>{error}</Text>
            <Text style={styles.link}>Retry</Text>
          </TouchableOpacity>
        )}
        {loading && <ActivityIndicator color={Colors.gradient1} />}
      </ScrollView>
    </SafeAreaView>
  );
};
export default WorkTracking;
const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: Colors.gray50},
  content: {padding: 20, paddingBottom: 40, gap: 14},
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {fontFamily: Fonts.semiBold, color: Colors.slateText, fontSize: 16},
  help: {fontSize: 14, lineHeight: 21, color: Colors.secondaryText},
  link: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.gradient1,
    paddingVertical: 8,
  },
  record: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.white,
    gap: 6,
  },
  notice: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.amberBg50,
    gap: 8,
  },
  actions: {gap: 6},
  error: {color: Colors.amberDarkText, lineHeight: 21},
});
