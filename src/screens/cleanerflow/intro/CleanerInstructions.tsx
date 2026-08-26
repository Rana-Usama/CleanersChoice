import React, {useState} from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts} from '../../../constants/Themes';
import GradientButton from '../../../components/GradientButton';
import {useExitAppOnBack} from '../../../utils/ExitApp';
import {showToast} from '../../../utils/ToastMessage';
import {markInstructionsAccepted} from '../../../utils/cleanerInstructions';
import {resolveCleanerRouteAsync} from '../../../utils/cleanerRoute';
import {
  CLEANER_INSTRUCTIONS_ACCEPT_LABEL,
  CLEANER_INSTRUCTIONS_CONSENT_HINT,
  CLEANER_INSTRUCTIONS_CONSENT_LABEL,
  CLEANER_INSTRUCTIONS_FOOTER_NOTE,
  CLEANER_INSTRUCTIONS_INTRO,
  CLEANER_INSTRUCTIONS_SECTIONS,
  CLEANER_INSTRUCTIONS_TITLE,
  InstructionBlock,
  InstructionSection,
} from '../../../constants/cleanerInstructions';

/**
 * Mandatory cleaner onboarding step, shown BEFORE the paywall so a cleaner
 * understands what the membership is before being asked to pay for it.
 *
 * This screen holds NO copy of its own — every string comes from
 * `constants/cleanerInstructions.ts`, so revised wording can be dropped in
 * without touching this file. Section headings are rendered verbatim so the
 * client's own numbering and emoji survive exactly as written.
 *
 * Unskippable by design: no header back button, hardware back exits the app
 * (the same treatment Dashboard and CleanerJobs use), and the only way forward
 * is the accept CTA, which records the acknowledgement first.
 */

const Block: React.FC<{block: InstructionBlock}> = ({block}) => {
  switch (block.kind) {
    case 'text':
      return <Text style={styles.paragraph}>{block.text}</Text>;

    case 'checklist':
      return (
        <View style={styles.list}>
          {block.items.map((item, i) => (
            <View key={i} style={styles.listRow}>
              <MaterialCommunityIcons
                name="check"
                size={RFPercentage(1.9)}
                color={Colors.green500}
                style={styles.checkIcon}
              />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      );

    case 'bullets':
      return (
        <View style={styles.list}>
          {block.items.map((item, i) => (
            <View key={i} style={styles.listRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      );

    case 'steps':
      return (
        <View style={styles.stepsBox}>
          <Text style={styles.stepsText}>{block.text}</Text>
        </View>
      );

    case 'callout':
      return (
        <View style={styles.callout}>
          <Text style={styles.calloutText}>{block.text}</Text>
        </View>
      );

    default:
      return null;
  }
};

const SectionCard: React.FC<{section: InstructionSection}> = ({section}) => (
  <View style={styles.card}>
    <Text style={styles.cardHeading}>{section.heading}</Text>
    {section.blocks.map((block, index) => (
      <Block key={index} block={block} />
    ))}
  </View>
);

const CleanerInstructions = ({navigation}: any) => {
  const [saving, setSaving] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const canContinue = agreed && !saving;

  // Mandatory step — back must not slip past this or return to sign-up.
  useExitAppOnBack();

  const handleAccept = async () => {
    if (!canContinue) return;
    setSaving(true);

    try {
      await markInstructionsAccepted();

      // Normally Premium next, but an existing subscriber seeing these for the
      // first time has already paid and goes straight to their dashboard.
      const next = await resolveCleanerRouteAsync();

      // reset(), not navigate(): this screen must not remain on the stack.
      navigation.reset({
        index: 0,
        routes: [{name: next}],
      });
    } catch (error) {
      // Keep the cleaner here rather than letting them through unrecorded.
      showToast({
        type: 'error',
        title: 'Could not save',
        message: 'Please check your connection and try again.',
      });
      setSaving(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor={Colors.gradient1}
        barStyle="light-content"
        translucent
      />

      <LinearGradient
        colors={[Colors.gradient1, Colors.gradient2]}
        style={styles.gradientHeader}>
        <View style={styles.headerBadge}>
          <MaterialCommunityIcons
            name="clipboard-text-outline"
            size={RFPercentage(2)}
            color={Colors.white}
          />
          <Text style={styles.headerBadgeText}>Before you start</Text>
        </View>
        <Text style={styles.headerTitle}>{CLEANER_INSTRUCTIONS_TITLE}</Text>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>{CLEANER_INSTRUCTIONS_INTRO}</Text>

        {CLEANER_INSTRUCTIONS_SECTIONS.map(section => (
          <SectionCard key={section.id} section={section} />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setAgreed(prev => !prev)}
          disabled={saving}
          hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
          style={styles.consentRow}>
          <View
            style={[styles.checkbox, agreed && styles.checkboxActive]}>
            {agreed ? <View style={styles.checkboxInner} /> : null}
          </View>
          <Text style={styles.consentLabel}>
            {CLEANER_INSTRUCTIONS_CONSENT_LABEL}
          </Text>
        </TouchableOpacity>

        <GradientButton
          title={CLEANER_INSTRUCTIONS_ACCEPT_LABEL}
          onPress={handleAccept}
          loading={saving}
          disabled={!canContinue}
          // GradientButton has no disabled styling of its own — its gradient is
          // always the brand colours — so the dimming has to come from here,
          // otherwise a blocked button would look tappable.
          style={[
            styles.acceptButton,
            !canContinue && styles.acceptButtonDisabled,
          ]}
          textStyle={styles.acceptButtonText}
        />

        
      </View>
    </View>
  );
};

export default CleanerInstructions;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? RFPercentage(8) : RFPercentage(6),
    paddingHorizontal: RFPercentage(2.4),
    paddingBottom: RFPercentage(2.4),
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.whiteOverlay20,
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(2),
    gap: RFPercentage(0.6),
    marginBottom: RFPercentage(1.2),
  },
  headerBadgeText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.5),
    color: Colors.white,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.2),
    lineHeight: RFPercentage(3.4),
    color: Colors.white,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(2),
    paddingBottom: RFPercentage(3),
  },
  intro: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.65),
    lineHeight: RFPercentage(2.5),
    color: Colors.secondaryText,
    marginBottom: RFPercentage(1.8),
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(1.6),
    borderWidth: 1,
    borderColor: Colors.lightGrayBg,
    padding: RFPercentage(1.8),
    marginBottom: RFPercentage(1.4),
  },
  cardHeading: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.95),
    lineHeight: RFPercentage(2.7),
    color: Colors.primaryText,
    marginBottom: RFPercentage(1),
  },
  paragraph: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    lineHeight: RFPercentage(2.4),
    color: Colors.secondaryText,
    marginBottom: RFPercentage(0.9),
  },
  list: {
    marginBottom: RFPercentage(0.9),
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: RFPercentage(0.45),
  },
  checkIcon: {
    marginTop: RFPercentage(0.25),
    marginRight: RFPercentage(0.7),
  },
  bulletDot: {
    width: RFPercentage(0.6),
    height: RFPercentage(0.6),
    borderRadius: RFPercentage(0.3),
    backgroundColor: Colors.gradient1,
    marginTop: RFPercentage(0.85),
    marginRight: RFPercentage(0.9),
  },
  listText: {
    flex: 1,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    lineHeight: RFPercentage(2.4),
    color: Colors.secondaryText,
  },
  stepsBox: {
    backgroundColor: Colors.gray50,
    borderLeftWidth: RFPercentage(0.35),
    borderLeftColor: Colors.gradient1,
    borderRadius: RFPercentage(0.8),
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(1),
    marginBottom: RFPercentage(0.9),
  },
  stepsText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    lineHeight: RFPercentage(2.4),
    color: Colors.primaryText,
  },
  callout: {
    backgroundColor: Colors.skyBlueBg,
    borderRadius: RFPercentage(1.2),
    paddingHorizontal: RFPercentage(1.3),
    paddingVertical: RFPercentage(1.1),
    marginTop: RFPercentage(0.4),
  },
  calloutText: {
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.6),
    lineHeight: RFPercentage(2.4),
    color: Colors.gradient1,
  },
  footer: {
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(1.2),
    paddingBottom: Platform.OS === 'ios' ? RFPercentage(3.4) : RFPercentage(1.8),
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrayBg,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: RFPercentage(1.4),
    paddingRight: RFPercentage(0.5),
  },
  // Matches the agreement control on SignUp.tsx so the app has one
  // "I agree" affordance rather than two competing ones.
  checkbox: {
    width: RFPercentage(2.2),
    height: RFPercentage(2.2),
    borderRadius: RFPercentage(1.1),
    borderWidth: RFPercentage(0.12),
    borderColor: Colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: RFPercentage(0.15),
    marginRight: RFPercentage(0.9),
  },
  checkboxActive: {
    borderColor: Colors.gradient1,
  },
  checkboxInner: {
    width: RFPercentage(1.5),
    height: RFPercentage(1.5),
    borderRadius: RFPercentage(0.75),
    backgroundColor: Colors.gradient1,
  },
  consentLabel: {
    flex: 1,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    lineHeight: RFPercentage(1.8),
    color: Colors.secondaryText,
  },
  acceptButton: {
    width: '100%',
  },
  acceptButtonDisabled: {
    opacity: 0.45,
  },
  acceptButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.9),
  },
  footerNote: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.secondaryText,
    textAlign: 'center',
    marginTop: RFPercentage(0.9),
  },
});
