import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors} from '../../constants/Themes';
import {workStyles as s, workToneStyle, WorkTone} from './workTheme';

/** Status chip. The tone carries both the colour and the wording. */
export const WorkPill = ({
  tone,
  label,
  suffix,
  style,
}: {
  tone: WorkTone;
  label?: string;
  /** e.g. ' - 0h', to spell out what the status contributes to the month. */
  suffix?: string;
  style?: StyleProp<ViewStyle>;
}) => {
  const t = workToneStyle(tone);
  return (
    <View
      style={[s.pill, {backgroundColor: t.bg, borderColor: t.border}, style]}>
      <Text style={[s.pillText, {color: t.fg}]}>
        {label ?? t.label}
        {suffix ?? ''}
      </Text>
    </View>
  );
};

export type WorkButtonVariant =
  | 'primary'
  | 'ghost'
  | 'danger'
  | 'dangerOutline'
  | 'muted'
  | 'warn';

/**
 * `muted` is the disabled-looking variant behind 'Clocked in elsewhere' and the
 * blocked clock-in. It still receives presses when onPress is supplied, so the
 * blocked state can open the resolver rather than silently doing nothing.
 */
export const WorkButton = ({
  variant = 'primary',
  label,
  icon,
  onPress,
  disabled,
  busy,
  accessibilityLabel,
  style,
  textStyle,
}: {
  variant?: WorkButtonVariant;
  label: string;
  icon?: string;
  onPress?: () => void;
  disabled?: boolean;
  busy?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) => {
  const surface =
    variant === 'ghost'
      ? s.buttonGhost
      : variant === 'danger'
      ? s.buttonDanger
      : variant === 'dangerOutline'
      ? s.buttonDangerOutline
      : variant === 'muted'
      ? s.buttonMuted
      : variant === 'warn'
      ? s.buttonWarn
      : undefined;
  const tint =
    variant === 'ghost'
      ? s.buttonGhostText
      : variant === 'muted'
      ? s.buttonMutedText
      : variant === 'dangerOutline'
      ? s.buttonDangerOutlineText
      : undefined;
  const color =
    variant === 'ghost'
      ? Colors.gradient1
      : variant === 'muted'
      ? Colors.gray400
      : variant === 'dangerOutline'
      ? '#B91C1C'
      : Colors.white;
  const inert = disabled || busy || !onPress;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{disabled: !!inert}}
      activeOpacity={0.85}
      disabled={inert}
      onPress={onPress}
      style={[s.button, surface, disabled && s.disabled, style]}>
      {busy ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <>
          {!!icon && (
            <MaterialCommunityIcons name={icon} size={18} color={color} />
          )}
          <Text style={[s.buttonText, tint, textStyle]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

/** Section heading with an optional right-hand action or hint. */
export const WorkSectionHeader = ({
  title,
  actionLabel,
  onAction,
  hint,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  hint?: string;
}) => (
  <View style={s.section}>
    <Text style={[s.title, {flexShrink: 1}]}>{title}</Text>
    {actionLabel && onAction ? (
      <TouchableOpacity
        accessibilityRole="button"
        hitSlop={{top: 8, bottom: 8, left: 12, right: 12}}
        onPress={onAction}>
        <Text style={s.link}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : hint ? (
      <Text style={[s.sml, {flexShrink: 1}]}>{hint}</Text>
    ) : null}
  </View>
);

/** One cell of the Work Hours stat grid. */
export const WorkStat = ({
  label,
  value,
  hint,
  valueColor,
}: {
  label: string;
  value: string;
  hint?: string;
  valueColor?: string;
}) => (
  <View style={s.gridCell}>
    <Text style={s.sml}>{label}</Text>
    <Text style={[s.mid, !!valueColor && {color: valueColor}]}>{value}</Text>
    {!!hint && <Text style={s.sml}>{hint}</Text>}
  </View>
);

/** Rounded tinted square behind a leading icon. */
export const WorkIconTile = ({
  icon,
  color,
  bg,
  size = 34,
  outerSize,
}: {
  icon: string;
  color: string;
  bg: string;
  size?: number;
  outerSize?: StyleProp<ViewStyle>;
}) => (
  <View style={[s.iconTile, {backgroundColor: bg}, outerSize]}>
    <MaterialCommunityIcons name={icon} size={size} color={color} />
  </View>
);

/**
 * A tappable navigation row: tinted icon, title, supporting line, chevron.
 *
 * This replaces the bare blue text links the work screens used. A sentence in
 * the accent colour does not read as a control - it has no edge, no press
 * affordance and a touch target the height of one line of text. The row gives
 * all three, and the chevron says where it goes.
 */
export const WorkNavRow = ({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
  tone = 'neutral',
  badge,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'neutral' | 'warn';
  badge?: string;
}) => {
  const accent = tone === 'warn' ? Colors.amberDarkText : Colors.gradient1;
  const wash = tone === 'warn' ? Colors.amberOverlay10 : Colors.blueOverlay10;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{disabled: !!disabled}}
      activeOpacity={0.75}
      disabled={disabled}
      onPress={onPress}
      style={[
        s.card,
        s.detailRow,
        tone === 'warn' && s.warnCard,
        disabled && s.disabled,
      ]}>
      <WorkIconTile icon={icon} color={accent} bg={wash} size={19} />
      <View style={s.detailPrimary}>
        <Text style={s.navTitle}>{title}</Text>
        {!!subtitle && <Text style={s.sml}>{subtitle}</Text>}
      </View>
      {!!badge && (
        <View style={[s.pill, {backgroundColor: wash, borderColor: wash}]}>
          <Text style={[s.pillText, {color: accent}]}>{badge}</Text>
        </View>
      )}
      <MaterialCommunityIcons name="chevron-right" size={20} color={accent} />
    </TouchableOpacity>
  );
};

/**
 * A compact KPI tile. The value slot takes a SHORT string only - a sentence in
 * there is what broke the old grid's alignment ("Unavailable until hours are
 * confirmed" sat where a number should be). Long context goes in `hint`.
 */
export const WorkTile = ({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'warn';
}) => {
  const {fontScale} = useWindowDimensions();
  return (
    <View style={[s.tile, fontScale > 1.2 && {flexBasis: '100%'}]}>
      <Text style={s.sml}>{label}</Text>
      <Text
        style={[s.tileValue, tone === 'warn' && {color: Colors.amberDarkText}]}>
        {value}
      </Text>
      {!!hint && <Text style={s.sml}>{hint}</Text>}
    </View>
  );
};

/**
 * Disclosure for the explanatory copy.
 *
 * These screens carry real caveats - timezone splitting, which month cash lands
 * in, why pending hours are excluded - and they were set as body paragraphs
 * between the numbers, which is what made the screen unreadable. Collapsed by
 * default: available to anyone who asks "why is this number that?", invisible
 * to everyone else.
 */
export const WorkCollapsible = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <View style={[s.card, open && {gap: 12}]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{expanded: open}}
        activeOpacity={0.75}
        hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
        onPress={() => setOpen(value => !value)}
        style={s.row}>
        <MaterialCommunityIcons
          name="information-outline"
          size={18}
          color={Colors.secondaryText}
        />
        <Text style={[s.body, s.grow]}>{title}</Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.secondaryText}
        />
      </TouchableOpacity>
      {open && <View style={{gap: 10}}>{children}</View>}
    </View>
  );
};
