import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors} from '../../constants/Themes';
import {workStyles as s} from './workTheme';

/** Header and cards share a scroll surface, so the header inset never clips a card. */
export const WorkRecordLayout = ({
  title,
  onBack,
  actionIcon,
  onAction,
  actionLabel,
  children,
  footer,
  refreshControl,
  sheet = false,
}: {
  title: string;
  onBack(): void;
  actionIcon?: string;
  onAction?: () => void;
  actionLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  refreshControl?: ScrollViewProps['refreshControl'];
  sheet?: boolean;
}) => {
  const insets = useSafeAreaInsets();
  const control = (
    icon: string,
    label: string,
    press: () => void,
    light = true,
  ) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.8}
      onPress={press}
      style={[
        s.circle,
        {width: 44, height: 44, borderRadius: 22},
        !light && {backgroundColor: Colors.inputBg},
      ]}>
      <MaterialCommunityIcons
        name={icon}
        size={21}
        color={light ? Colors.white : Colors.secondaryText}
      />
    </TouchableOpacity>
  );
  const header = sheet ? (
    <>
      <View style={s.handle} />
      <View style={[s.sheetHeader, s.row]}>
        <Text style={s.sheetTitle}>{title}</Text>
        {control('close', 'Back', onBack, false)}
      </View>
    </>
  ) : (
    <LinearGradient
      colors={[Colors.gradient1, Colors.gradient2]}
      style={[s.band, {paddingTop: insets.top + 12}]}>
      {control('arrow-left', 'Back', onBack)}
      <Text style={s.bandTitle}>{title}</Text>
      {actionIcon && onAction ? (
        control(actionIcon, actionLabel || 'Action', onAction)
      ) : (
        <View style={{width: 44}} />
      )}
    </LinearGradient>
  );
  return (
    <View
      style={[
        s.safe,
        sheet && {
          backgroundColor: 'rgba(15,23,42,0.45)',
          justifyContent: 'flex-end',
        },
      ]}>
      {!sheet && (
        <StatusBar
          backgroundColor={Colors.gradient1}
          barStyle="light-content"
        />
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={sheet ? s.sheet : {flex: 1}}>
        {sheet && header}
        <ScrollView
          style={{flex: 1}}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: footer ? 0 : Math.max(insets.bottom, 12),
          }}>
          {!sheet && header}
          <View style={[s.content, {marginTop: sheet ? 0 : -22}]}>
            {children}
          </View>
        </ScrollView>
        {!!footer && (
          <View
            style={[s.footer, {paddingBottom: Math.max(insets.bottom, 12)}]}>
            {footer}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};
export {workStyles as workRecordStyles} from './workTheme';
