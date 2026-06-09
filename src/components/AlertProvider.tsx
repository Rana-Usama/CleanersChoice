import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ModalWrapper from './ModalWrapper';
import CustomModal from './CustomModal';
import {Colors} from '../constants/Themes';

/**
 * Themed, app-wide replacement for React Native's `Alert.alert`.
 *
 * Usage (inside components / hooks):
 *   const {showAlert} = useAppAlert();
 *   showAlert({title: 'Delete?', message: '...', buttons: [...]});
 *
 * Usage (outside React, e.g. services/utils):
 *   import {showAppAlert} from '../components/AlertProvider';
 *   showAppAlert({title: 'Error', message: '...'});
 */

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  /** May be async — the modal shows a loader on the primary button until it resolves. */
  onPress?: () => void | Promise<void>;
  style?: AlertButtonStyle;
}

export type AlertVariant =
  | 'info'
  | 'success'
  | 'error'
  | 'confirm'
  | 'destructive';

export interface AlertOptions {
  title: string;
  message?: string;
  /** Up to two buttons. Defaults to a single "OK" button when omitted. */
  buttons?: AlertButton[];
  variant?: AlertVariant;
  /** Override the auto-selected icon for the variant. */
  iconName?: string;
  iconColor?: string;
  /** Allow tap-outside-to-dismiss. Defaults to true for info/success, false otherwise. */
  dismissable?: boolean;
}

interface AlertContextValue {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

// Module-level bridge so non-React code (services, utils) can trigger alerts.
let externalShow: ((options: AlertOptions) => void) | null = null;
let externalHide: (() => void) | null = null;

export const showAppAlert = (options: AlertOptions): void => {
  externalShow?.(options);
};

export const hideAppAlert = (): void => {
  externalHide?.();
};

interface VariantVisual {
  iconName?: string;
  iconColor?: string;
  svgIconType?: 'confirm' | 'cancel';
}

const getVariantVisual = (variant: AlertVariant): VariantVisual => {
  switch (variant) {
    case 'success':
      return {svgIconType: 'confirm'};
    case 'error':
      return {iconName: 'alert-circle-outline', iconColor: Colors.red500};
    case 'destructive':
      return {iconName: 'alert-circle-outline', iconColor: Colors.red500};
    case 'confirm':
      return {iconName: 'help-circle-outline', iconColor: Colors.gradient1};
    case 'info':
    default:
      return {iconName: 'information-outline', iconColor: Colors.gradient1};
  }
};

const DEFAULT_BUTTON: AlertButton = {text: 'OK'};

interface AlertProviderProps {
  children: React.ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({children}) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const isHandling = useRef(false);

  const showAlert = useCallback((next: AlertOptions) => {
    setOptions(next);
    setLoading(false);
    isHandling.current = false;
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
    setLoading(false);
    isHandling.current = false;
  }, []);

  // Register the module-level bridge for non-React callers.
  useEffect(() => {
    externalShow = showAlert;
    externalHide = hideAlert;
    return () => {
      externalShow = null;
      externalHide = null;
    };
  }, [showAlert, hideAlert]);

  const runButton = useCallback(
    async (button?: AlertButton) => {
      if (isHandling.current) return;

      if (!button?.onPress) {
        hideAlert();
        return;
      }

      isHandling.current = true;
      try {
        const result = button.onPress();
        if (result instanceof Promise) {
          setLoading(true);
          await result;
        }
      } catch (err) {
        console.warn('[AlertProvider] button handler failed:', err);
      } finally {
        hideAlert();
      }
    },
    [hideAlert],
  );

  const contextValue = useMemo<AlertContextValue>(
    () => ({showAlert, hideAlert}),
    [showAlert, hideAlert],
  );

  // Resolve button layout from the current options.
  const buttons = options?.buttons?.length ? options.buttons : [DEFAULT_BUTTON];
  const isSingle = buttons.length === 1;
  const cancelButton = buttons.find(b => b.style === 'cancel');
  // Secondary (left/cancel) resolves first; primary is any other button.
  const secondaryButton = isSingle ? undefined : cancelButton ?? buttons[0];
  const primaryButton =
    buttons.find(b => b !== secondaryButton) ?? buttons[buttons.length - 1];

  const variant: AlertVariant = options?.variant ?? (isSingle ? 'info' : 'confirm');
  const visual = getVariantVisual(variant);
  const iconName = options?.iconName ?? visual.iconName;
  const iconColor = options?.iconColor ?? visual.iconColor;

  const dismissable =
    options?.dismissable ??
    (variant === 'info' || variant === 'success' || variant === 'error');

  const handleBackdrop = useCallback(() => {
    if (loading || isHandling.current) return;
    runButton(secondaryButton);
  }, [loading, runButton, secondaryButton]);

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      <ModalWrapper
        visible={visible && !!options}
        onBackdropPress={dismissable ? handleBackdrop : undefined}>
        {options && (
          <CustomModal
            title={options.title}
            subTitle={options.message ?? ''}
            iconName={iconName}
            iconColor={iconColor}
            svgIconType={visual.svgIconType}
            singleButton={isSingle}
            buttonTitle={primaryButton?.text ?? 'OK'}
            cancelButtonTitle={secondaryButton?.text}
            loader={loading}
            onPress={() => runButton(secondaryButton)}
            onPress2={() => runButton(primaryButton)}
            onPress3={() => runButton(primaryButton)}
          />
        )}
      </ModalWrapper>
    </AlertContext.Provider>
  );
};

export const useAppAlert = (): AlertContextValue => {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAppAlert must be used within an <AlertProvider>');
  }
  return ctx;
};

export default AlertProvider;
