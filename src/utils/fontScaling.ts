import {Text, TextInput} from 'react-native';
import {FontScaling} from '../constants/Themes';

/**
 * Globally caps OS font scaling (iOS Dynamic Type / Android Font Size) for
 * every <Text> and <TextInput> in the app, including ones rendered by
 * third-party libraries (react-navigation labels, toasts, sheets, etc.).
 *
 * Why a render patch: RN 0.78 ships React 19, which removed `defaultProps`
 * support for function/forwardRef components, so `Text.defaultProps = {...}`
 * is silently ignored. Text and TextInput are both forwardRef components, so
 * injecting the default into their `render` is the only remaining global
 * mechanism. An explicit `maxFontSizeMultiplier` passed at a call site still
 * wins because incoming props are spread after the default.
 *
 * Defensive: if a future RN upgrade changes these internals, the patch no-ops
 * (and warns in dev) instead of crashing — text simply scales uncapped again.
 */
export function applyGlobalFontScaleCap(): void {
  [Text, TextInput].forEach(Component => {
    const target = Component as any;
    const originalRender = target.render;

    if (typeof originalRender !== 'function') {
      if (__DEV__) {
        console.warn(
          '[fontScaling] Global font scale cap could not be applied — RN internals changed. Falling back to uncapped scaling.',
        );
      }
      return;
    }

    target.render = function render(props: any, ref: any) {
      return originalRender.call(
        this,
        {maxFontSizeMultiplier: FontScaling.maxMultiplier, ...props},
        ref,
      );
    };
  });
}
