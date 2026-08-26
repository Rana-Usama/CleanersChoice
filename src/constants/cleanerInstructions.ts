/**
 * Cleaner "How It Works" content.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THIS FILE IS THE ONLY PLACE THE INSTRUCTIONS COPY LIVES.
 *
 * To revise the wording, edit the strings below — no screen, component or
 * navigation change is needed. The screen renders whatever this file exports,
 * in the order it is declared.
 *
 * Each section is a list of blocks, so text, checklists and callouts can be
 * interleaved in any order. Headings are rendered verbatim, including their
 * leading emoji.
 *
 * If a revision is material enough that every cleaner should read it again,
 * bump CLEANER_INSTRUCTIONS_VERSION. Cleaners whose stored acknowledgement is
 * for an older version are shown the screen again on their next launch.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Bump to re-show the screen to cleaners who already accepted. */
export const CLEANER_INSTRUCTIONS_VERSION = 2;

export type InstructionBlock =
  /** A plain paragraph. */
  | {kind: 'text'; text: string}
  /** Tick-marked list — used for the "what's included" style lists. */
  | {kind: 'checklist'; items: string[]}
  /** Plain bulleted list. */
  | {kind: 'bullets'; items: string[]}
  /** A single emphasised line, drawn in a tinted box. */
  | {kind: 'callout'; text: string}
  /** A short "do this → then this" instruction strip. */
  | {kind: 'steps'; text: string};

export interface InstructionSection {
  /** Stable key for React lists — keep unique, and stable across copy edits. */
  id: string;
  /** Rendered verbatim, emoji included. */
  heading: string;
  blocks: InstructionBlock[];
}

export const CLEANER_INSTRUCTIONS_TITLE = '🎉 Welcome to Cleaners Choice!';

export const CLEANER_INSTRUCTIONS_INTRO =
  'We’re excited to have you as a Cleaners Choice member! Before you get started, please read through these steps so you understand how everything works and how to get the most out of your membership.';

export const CLEANER_INSTRUCTIONS_ACCEPT_LABEL = 'Continue';

/** Label beside the agreement checkbox that unlocks the CTA. */
export const CLEANER_INSTRUCTIONS_CONSENT_LABEL =
  'I have read and understood how my Cleaners Choice membership works, and I agree to these terms.';

/** Shown under the CTA while the checkbox is still unticked. */
export const CLEANER_INSTRUCTIONS_CONSENT_HINT =
  'Please tick the box above to continue.';

/** Shown under the CTA once the checkbox is ticked. */
export const CLEANER_INSTRUCTIONS_FOOTER_NOTE = 'You only need to do this once.';

export const CLEANER_INSTRUCTIONS_SECTIONS: InstructionSection[] = [
  {
    id: 'membership',
    heading: '1️⃣ How Your Membership Works',
    blocks: [
      {
        kind: 'text',
        text: 'With your $20.99/month Cleaners Choice Membership, you’ll receive cleaning opportunities within a 50-mile radius of your hometown.',
      },
      {
        kind: 'checklist',
        items: [
          'You set your own prices',
          'You bid your own jobs',
          'You choose your own schedule and availability',
          'You speak directly with the customer',
          'The customer pays you directly',
          'You represent yourself or your own company',
          'No percentage taken from your jobs',
          'No pay-per-lead fees',
          'No contracts or cancellation fees',
        ],
      },
      {
        kind: 'callout',
        text: 'Your $20.99 monthly membership is all you pay.',
      },
    ],
  },
  {
    id: 'complete-profile',
    heading: '2️⃣ Complete Your Profile to 100%',
    blocks: [
      {kind: 'text', text: 'Once you reach your dashboard:'},
      {
        kind: 'steps',
        text: 'Scroll down → Select “Complete Profile” → Complete your profile to 100%.',
      },
      {
        kind: 'callout',
        text: 'Your profile needs to be 100% complete before you’re fully set up and ready to receive cleaning opportunities.',
      },
    ],
  },
  {
    id: 'job-list',
    heading: '3️⃣ Check Your Job List 📋',
    blocks: [
      {
        kind: 'text',
        text: 'Once your profile is complete, go to the Job List by clicking the icon at the bottom left of the app.',
      },
      {
        kind: 'text',
        text: 'Select a job and read the full job description. From there, you can contact the customer directly, discuss what they need, and provide your own price.',
      },
      {
        kind: 'callout',
        text: 'Remember: Cleaners Choice does not set your prices. You do!',
      },
    ],
  },
  {
    id: 'targeting-time',
    heading: '4️⃣ Give Your Targeting Time to Work 📍',
    blocks: [
      {
        kind: 'text',
        text: 'Please understand that your first 1–2 months may be slower, especially when you’re brand new to the platform.',
      },
      {
        kind: 'text',
        text: 'We add new members into our direct customer targeting once per week. Once you’re added, it can take approximately 2–3 weeks for the targeting to start gaining traction.',
      },
      {
        kind: 'text',
        text: 'We’re seeing some of our strongest results after members have been active for 2 months or longer, so don’t get discouraged if your first few weeks are slow.',
      },
      {
        kind: 'text',
        text: 'Think of Cleaners Choice as another tool to help grow your business. Keep your membership active, check your Job List regularly, respond to opportunities quickly, and give your area time to build.',
      },
    ],
  },
  {
    id: 'invoicing',
    heading: '5️⃣ FREE Invoicing System 🧾',
    blocks: [
      {
        kind: 'text',
        text: 'Your membership also gives you access to the Cleaners Choice invoicing system at no additional cost!',
      },
      {kind: 'text', text: 'You can:'},
      {
        kind: 'checklist',
        items: [
          'Create professional invoices',
          'Send invoices to your customers',
          'Keep your jobs and billing organized',
          'Use the invoicing system completely FREE with your membership',
        ],
      },
      {
        kind: 'callout',
        text: 'There is no additional charge for the invoicing system — it’s included with your membership.',
      },
    ],
  },
  {
    id: 'ready',
    heading: '🚀 You’re Ready to Get Started!',
    blocks: [
      {
        kind: 'text',
        text: 'Complete your profile, keep an eye on your Job List, and take advantage of everything included with your membership.',
      },
      {
        kind: 'text',
        text: 'Welcome to Cleaners Choice — we’re glad to have you! 🧹🏠',
      },
    ],
  },
];
