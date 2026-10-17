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
  subtitle,
  onBack,
  actionIcon,
  onAction,
  actionLabel,
  children,
  footer,
  refreshControl,
  sheet = false,
  flat = false,
  hero,
  scrollRef,
}: {
  title: string;
  /** Sheet only: one muted line under the title. */
  subtitle?: string;
  onBack(): void;
  actionIcon?: string;
  onAction?: () => void;
  actionLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  refreshControl?: ScrollViewProps['refreshControl'];
  sheet?: boolean;
  /**
   * A straight-edged band with the title beside the back control and no
   * card pulled up into it - the Work Hours calendar layout.
   */
  flat?: boolean;
  /**
   * Content drawn inside the gradient band under the title row - the Work
   * record headline. The band curves at the bottom and nothing pulls into it.
   */
  hero?: React.ReactNode;
  /** Lets a screen scroll a focused field into view, e.g. above the keyboard. */
  scrollRef?: React.Ref<ScrollView>;
}) => {
  const compact = flat || sheet || !!hero;
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
      // Flat bands and sheets draw 34px circles; hitSlop keeps the 44px target.
      hitSlop={compact ? {top: 5, bottom: 5, left: 5, right: 5} : undefined}
      style={[
        s.circle,
        compact
          ? {width: 34, height: 34, borderRadius: 17}
          : {width: 44, height: 44, borderRadius: 22},
        !light && {backgroundColor: Colors.slate100},
      ]}>
      <MaterialCommunityIcons
        name={icon}
        size={sheet ? 18 : compact ? 19 : 21}
        color={light ? Colors.white : Colors.secondaryText}
      />
    </TouchableOpacity>
  );
  const header = sheet ? (
    <>
      <View style={s.handle} />
      <View style={s.sheetHeader}>
        <View style={s.grow}>
          <Text style={s.sheetTitle}>{title}</Text>
          {!!subtitle && <Text style={s.sheetSubtitle}>{subtitle}</Text>}
        </View>
        {control('close', 'Close', onBack, false)}
      </View>
    </>
  ) : hero ? (
    <LinearGradient
      colors={[Colors.gradient1, Colors.gradient2]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={[s.bandHero, {paddingTop: insets.top + 14}]}>
      <View style={s.row}>
        {control('arrow-left', 'Back', onBack)}
        <Text style={s.bandTitleHero}>{title}</Text>
        {actionIcon && onAction ? (
          control(actionIcon, actionLabel || 'Action', onAction)
        ) : (
          <View style={{width: 34}} />
        )}
      </View>
      {hero}
    </LinearGradient>
  ) : (
    <LinearGradient
      colors={[Colors.gradient1, Colors.gradient2]}
      start={flat ? {x: 0, y: 0} : undefined}
      end={flat ? {x: 1, y: 1} : undefined}
      style={[
        flat ? s.bandFlat : s.band,
        {paddingTop: insets.top + (flat ? 14 : 12)},
      ]}>
      {control('arrow-left', 'Back', onBack)}
      <Text style={flat ? s.bandTitleLeft : s.bandTitle}>{title}</Text>
      {actionIcon && onAction ? (
        control(actionIcon, actionLabel || 'Action', onAction)
      ) : (
        <View style={{width: flat ? 34 : 44}} />
      )}
    </LinearGradient>
  );
  const body = (
    <>
      {sheet && header}
      <ScrollView
        ref={scrollRef}
        // A sheet is as tall as its form; it scrolls only past the max height.
        style={sheet ? {flexGrow: 0, flexShrink: 1} : {flex: 1}}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        keyboardDismissMode={sheet ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: sheet ? 0 : 1,
          paddingBottom: footer ? 0 : Math.max(insets.bottom, 12),
        }}>
        {!sheet && header}
        <View
          style={[
            s.content,
            flat || hero
              ? s.contentFlat
              : sheet
              ? s.contentSheet
              : {marginTop: -22},
          ]}>
          {children}
        </View>
      </ScrollView>
      {!!footer && (
        <View
          style={[
            sheet ? s.footerSheet : s.footer,
            {paddingBottom: Math.max(insets.bottom, sheet ? 20 : 12)},
          ]}>
          {footer}
        </View>
      )}
    </>
  );
  if (sheet) {
    // The whole screen avoids the keyboard, so the sheet rises above it and
    // shrinks to the space left; padding inside a height-capped sheet only
    // squeezed the form and left the last field under the keyboard.
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[s.safe, s.sheetBackdrop, {paddingTop: insets.top + 12}]}>
        <View style={s.sheet}>{body}</View>
      </KeyboardAvoidingView>
    );
  }
  return (
    <View style={s.safe}>
      <StatusBar backgroundColor={Colors.gradient1} barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{flex: 1}}>
        {body}
      </KeyboardAvoidingView>
    </View>
  );
};
export {workStyles as workRecordStyles} from './workTheme';
