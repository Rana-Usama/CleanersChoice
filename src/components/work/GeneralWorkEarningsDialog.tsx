import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {WorkSession} from '../../types/workSession';
import {Colors} from '../../constants/Themes';
import {workSessionTitle} from '../../utils/workSessionFlow';
import {
  parseWorkEarnings,
  workEarningsError,
} from '../../utils/workGeneralEarnings';
import {workStyles as s} from './workTheme';
import {WorkButton, WorkIconTile} from './WorkUI';
import {GeneralWorkEarningsField} from './GeneralWorkEarningsField';

export const GeneralWorkEarningsDialog = ({
  session,
  busy,
  pending,
  error,
  onClose,
  onRetry,
  onSave,
}: {
  session: WorkSession;
  busy: boolean;
  pending: boolean;
  error: string;
  onClose(): void;
  onRetry(): void;
  onSave(input: {expectedEarnings: number}): Promise<void>;
}) => {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState(
    session.expectedEarnings?.toFixed(2) ?? '',
  );
  const [validation, setValidation] = useState('');
  const save = async () => {
    const message = workEarningsError(amount, true);
    setValidation(message);
    if (!message) {
      await onSave({expectedEarnings: parseWorkEarnings(amount)!});
    }
  };
  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={() => !busy && onClose()}>
      <KeyboardAvoidingView
        style={[
          styles.backdrop,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}>
            <View style={s.row}>
              <WorkIconTile
                icon="cash"
                color={Colors.gradient1}
                bg={Colors.blueOverlay10}
              />
              <Text style={[s.title, s.grow]}>Edit earnings</Text>
            </View>
            <Text style={s.body}>{workSessionTitle(session)}</Text>
            <GeneralWorkEarningsField
              value={amount}
              onChange={setAmount}
              disabled={busy || pending}
            />
            <Text style={s.sml}>
              Counts toward Earned after the hours are confirmed. The total is
              counted once in the finish month.
            </Text>
            {!!(validation || error) && (
              <Text accessibilityRole="alert" style={s.error}>
                {validation || error}
              </Text>
            )}
          </ScrollView>
          <View style={styles.footer}>
            <WorkButton
              label={pending ? 'Retry unfinished save' : 'Save earnings'}
              busy={busy}
              onPress={pending ? onRetry : save}
            />
            <WorkButton
              label="Cancel"
              variant="ghost"
              disabled={busy}
              onPress={onClose}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderRadius: 24,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    maxHeight: '100%',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  content: {padding: 20, gap: 16},
  footer: {
    padding: 16,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
});
