import {Platform, StyleSheet} from 'react-native';
import {Colors, Fonts} from '../../constants/Themes';

/**
 * Single source of truth for the work-session flow's visual language.
 *
 * These styles previously lived inside WorkRecordLayout, which made the layout
 * component the de-facto design system and left Dashboard surfaces reaching
 * into a record-screen stylesheet. They live here now; WorkRecordLayout
 * re-exports them as `workRecordStyles` so no existing call site breaks.
 */

/** A session's display tone. `edited` is derived, not a stored status. */
export type WorkTone =
  | 'confirmed'
  | 'edited'
  | 'active'
  | 'needsReview'
  | 'discarded';

export interface WorkToneStyle {
  bg: string;
  fg: string;
  border: string;
  label: string;
  /** Whether this session contributes to the month headline. */
  counted: boolean;
  icon: string;
}

const TONES: Record<WorkTone, WorkToneStyle> = {
  confirmed: {
    bg: Colors.greenBg100,
    fg: Colors.successText,
    border: Colors.successBorder,
    label: 'Confirmed',
    counted: true,
    icon: 'check',
  },
  edited: {
    bg: Colors.greenBg100,
    fg: Colors.successText,
    border: Colors.successBorder,
    label: 'Edited',
    counted: true,
    icon: 'pencil-outline',
  },
  active: {
    bg: Colors.blueBg200,
    fg: Colors.gradient1,
    border: Colors.lightBlueBorder,
    label: 'Running',
    counted: false,
    icon: 'play-circle-outline',
  },
  needsReview: {
    bg: Colors.amberBg50,
    fg: Colors.amberDarkText,
    border: Colors.amberBorder,
    label: 'Needs review',
    counted: false,
    icon: 'alert-outline',
  },
  discarded: {
    bg: Colors.slate100,
    fg: Colors.secondaryText,
    border: Colors.gray200,
    label: 'Discarded',
    counted: false,
    icon: 'close',
  },
};

/**
 * `edited` is not a stored status - it is a confirmed session whose times were
 * changed after the fact. The wireframes give it its own chip because the
 * cleaner needs to know the recorded time is not the raw clock time.
 */
export const workSessionTone = (session: {
  status: string;
  editHistory?: {action: string}[];
}): WorkTone => {
  if (session.status !== 'confirmed') {
    return session.status as WorkTone;
  }
  const edited = (session.editHistory ?? []).some(
    entry =>
      entry.action === 'edit' ||
      entry.action === 'setPlannedFinish' ||
      entry.action === 'editEarnings',
  );
  return edited ? 'edited' : 'confirmed';
};

export const workToneStyle = (tone: WorkTone): WorkToneStyle => TONES[tone];

export const workStyles = StyleSheet.create({
  // ---- layout ----------------------------------------------------------
  safe: {flex: 1, backgroundColor: Colors.gray50},
  header: {padding: 20, flexDirection: 'row', gap: 20, alignItems: 'center'},
  content: {paddingHorizontal: 16, paddingBottom: 24, gap: 14},
  /** The gradient band. Extra bottom padding is the room the card pulls into. */
  band: {
    paddingTop: Platform.OS === 'ios' ? 54 : 22,
    paddingBottom: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  bandTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: Colors.white,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.whiteOverlay20,
  },
  circlePlaceholder: {width: 36, height: 36},
  // Header overlap belongs to the scroll layout, never to individual cards.
  pullUp: {marginTop: 0},
  headerTitle: {flex: 1},

  // ---- surfaces --------------------------------------------------------
  // borderWidth is load-bearing on Dashboard, whose background is white:
  // without it the card is invisible. Harmless on the gray50 record screens.
  card: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
    gap: 10,
  },
  cardFlush: {padding: 0, gap: 0, overflow: 'hidden'},
  cardRow: {paddingVertical: 16, paddingHorizontal: 14, gap: 4},
  warnCard: {
    backgroundColor: Colors.amberBg50,
    borderColor: Colors.amberBorder,
  },
  liveCard: {borderColor: Colors.successBorder, backgroundColor: Colors.white},
  inner: {
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    padding: 12,
  },
  divider: {height: 1, backgroundColor: Colors.lightBlueBorder},

  // ---- type ------------------------------------------------------------
  eyebrow: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.secondaryText,
  },
  title: {fontFamily: Fonts.semiBold, fontSize: 17, color: Colors.slateText},
  headline: {fontSize: 28},
  /**
   * The one hero figure on a screen. Proportional figures on purpose: tabular
   * digits give every glyph the width of a '0', which reads loose at display
   * size. tabular-nums (`mono` below) is for COLUMNS of numbers that must line
   * up vertically, and for timers whose digits change in place.
   */
  hero: {
    fontFamily: Fonts.fontBold,
    fontSize: 26,
    lineHeight: 42,
    color: Colors.slateText,
  },
  big: {fontFamily: Fonts.fontBold, fontSize: 34, color: Colors.slateText},
  mid: {fontFamily: Fonts.fontBold, fontSize: 21, color: Colors.slateText},
  body: {fontFamily: Fonts.fontRegular, fontSize: 15, color: Colors.slateText},
  help: {fontFamily: Fonts.fontRegular, fontSize: 14, lineHeight: 21, color: Colors.secondaryText},
  sml: {fontFamily: Fonts.fontRegular, fontSize: 12.5, lineHeight: 18, color: Colors.secondaryText},
  error: {fontFamily: Fonts.fontRegular, color: Colors.amberDarkText, fontSize: 14, lineHeight: 21},
  // Timers must not reflow as digits change.
  mono: {fontVariant: ['tabular-nums']},

  // ---- rows ------------------------------------------------------------
  row: {flexDirection: 'row', alignItems: 'center', gap: 10},
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  grow: {flex: 1, minWidth: 0},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 14},
  gridCell: {flexGrow: 1, flexBasis: '44%', minWidth: 110, gap: 4},
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filters: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  monthlyDashboard: {gap: 10, marginBottom: 16},

  // ---- label/value lines and the history timeline ----------------------
  line: {paddingVertical: 7},
  lineValue: {textAlign: 'right', flexShrink: 1, minWidth: 0},
  timelineRail: {alignItems: 'center', alignSelf: 'stretch'},
  timelineDot: {width: 9, height: 9, borderRadius: 5, marginTop: 6},
  timelineLine: {
    width: 1,
    flex: 1,
    marginTop: 4,
    backgroundColor: Colors.lightBlueBorder,
  },
  timelineBody: {paddingBottom: 14},
  pipeline: {
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    padding: 10,
  },
  /** The month bar is a control strip, so it needs less padding than a card. */
  monthBar: {paddingVertical: 8, paddingHorizontal: 8},
  /** Compact round control for the month stepper. */
  stepper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blueBg200,
  },
  /** Quiet inline failure: partial data, not a dead screen. */
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  /** Equal-width KPI tiles so labels and values align across the row. */
  tileRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  tile: {
    flex: 1,
    flexBasis: 130,
    minWidth: 130,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
    gap: 2,
  },
  tileValue: {
    fontFamily: Fonts.fontBold,
    fontSize: 18,
    color: Colors.slateText,
  },
  /** Right-hand numeric column: tabular so rows line up down the list. */
  numColumn: {alignItems: 'flex-end', gap: 4, minWidth: 74},
  chipSelected: {
    backgroundColor: Colors.blueBg200,
    borderColor: Colors.gradient1,
  },
  inlineAction: {minHeight: 40, paddingHorizontal: 14},
  unpaidStrip: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: -4,
  },
  /** 2x2 stat grid inside the headline card (the wireframe's layout). */
  statGrid: {flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, columnGap: 14},
  statCell: {flexGrow: 1, flexBasis: '44%', minWidth: 110, gap: 4},
  statValue: {fontFamily: Fonts.fontBold, fontSize: 21},
  statUnit: {
    fontFamily: Fonts.fontMedium,
    fontSize: 13.5,
    color: Colors.gray400,
  },
  /** Needs-review session rows are washed amber, as in the wireframe. */
  rowWarn: {backgroundColor: Colors.amberBg50},
  rowMuted: {opacity: 0.6},
  /** Centred footer link. */
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  statEnd: {alignItems: 'flex-end'},
  statEndGap: {alignItems: 'flex-end', gap: 4},

  // ---- pills -----------------------------------------------------------
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexShrink: 1,
    maxWidth: '100%',
  },
  pillText: {fontFamily: Fonts.semiBold, fontSize: 12},

  // ---- icon tiles ------------------------------------------------------
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---- buttons ---------------------------------------------------------
  // 48px min keeps every action above the 44px touch-target floor.
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.gradient1,
    borderWidth: 1,
    borderColor: 'transparent',
    flexShrink: 1,
    minWidth: 0,
    paddingVertical: 12,
  },
  buttonText: {
    color: Colors.white,
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    flexShrink: 1,
    textAlign: 'center',
  },
  buttonGhost: {
    backgroundColor: Colors.blueBg200,
    borderColor: Colors.lightBlueBorder,
  },
  buttonGhostText: {color: Colors.gradient1},
  buttonDanger: {backgroundColor: Colors.red500},
  buttonMuted: {backgroundColor: Colors.slate100, borderColor: Colors.gray200},
  buttonMutedText: {color: Colors.gray400},
  buttonWarn: {backgroundColor: Colors.amberDarkText},
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.inputBg,
  },
  chipActive: {
    backgroundColor: Colors.amberDarkText,
    borderColor: Colors.amberDarkText,
  },
  chipText: {fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.slateText},
  chipActiveText: {color: Colors.white},

  // ---- forms -----------------------------------------------------------
  input: {
    fontFamily: Fonts.fontRegular,
    borderColor: Colors.gray200,
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    color: Colors.slateText,
    backgroundColor: Colors.white,
  },
  link: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.gradient1,
    paddingVertical: 10,
  },
  disabled: {opacity: 0.45},
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'stretch',
  },
  actionCell: {flexGrow: 1, flexBasis: 140, minWidth: 120},
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailPrimary: {flexGrow: 1, flexBasis: 150, minWidth: 0, gap: 4},
  metricColumn: {
    flexShrink: 1,
    maxWidth: '100%',
    alignItems: 'flex-end',
    gap: 3,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    overflow: 'hidden',
  },
  sheetHeader: {paddingHorizontal: 20, paddingVertical: 18, gap: 12},
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray200,
    alignSelf: 'center',
    marginTop: 10,
  },
  sheetTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 19,
    color: Colors.slateText,
    flex: 1,
    minWidth: 0,
  },
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightBlueBorder,
    padding: 16,
    gap: 10,
  },
});
