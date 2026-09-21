/**
 * Console noise control.
 *
 * Two separate jobs:
 *
 * 1. Dev — silence native advisories. iOS routes `RCTLogAdvice` messages
 *    through the JS console, which is where the "(ADVICE) View #227 of type
 *    BVLinearGradient has a shadow set but cannot calculate shadow
 *    efficiently" spam comes from. It is emitted per-view, per-layout, so a
 *    single list of shadowed cards floods the log. It is advisory only and
 *    never surfaces in a release build.
 *
 * 2. Release — drop our own logs. `__DEV__` compiles to `false` in release
 *    bundles, so the production branch below is what ships: `log`/`info`/
 *    `debug`/`warn` become no-ops and only `console.error` survives, keeping
 *    Crashlytics/Xcode output meaningful and avoiding leaking payloads into
 *    device logs.
 *
 * `console.error` is never touched in either mode.
 *
 * Must run before the first render — call it at the top of index.js.
 */

/** Matched against the stringified arguments of a console call. */
const MUTED_PATTERNS: RegExp[] = [
  // iOS native advisories, e.g. "(ADVICE) View #227 of type BVLinearGradient…"
  /\(ADVICE\)/,
  /has a shadow set but cannot calculate shadow efficiently/i,
];

/** Console methods that are filtered in dev and silenced in release. */
const NOISY_METHODS = ['log', 'info', 'debug', 'warn', 'trace'] as const;

type NoisyMethod = (typeof NOISY_METHODS)[number];

const isMuted = (args: unknown[]): boolean => {
  if (!args.length) return false;

  let text = '';
  for (const arg of args) {
    if (typeof arg === 'string') {
      text += arg;
    } else if (arg instanceof Error) {
      text += arg.message;
    } else {
      // Objects are rare in these advisories; String() is enough and avoids
      // the cost of JSON.stringify on every single log line.
      text += String(arg);
    }
    text += ' ';
    // The advisory prefix always appears early — no need to scan huge payloads.
    if (text.length > 400) break;
  }

  return MUTED_PATTERNS.some(pattern => pattern.test(text));
};

let configured = false;

export const configureConsole = (): void => {
  // Fast Refresh re-evaluates modules; without this guard each reload would
  // wrap the already-wrapped console another layer deep.
  if (configured) return;
  configured = true;

  const target = console as unknown as Record<NoisyMethod, (...a: any[]) => void>;

  NOISY_METHODS.forEach(method => {
    const original = target[method];
    if (typeof original !== 'function') return;

    if (__DEV__) {
      // Keep everything except the native advisory spam.
      target[method] = (...args: any[]) => {
        if (isMuted(args)) return;
        original.apply(console, args);
      };
    } else {
      // Release: nothing but errors.
      target[method] = () => {};
    }
  });
};

export default configureConsole;
