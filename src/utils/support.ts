import {Linking} from 'react-native';
import {SUPPORT_EMAIL} from '../constants/support';
import {showToast} from './ToastMessage';

interface SupportEmailOptions {
  subject?: string;
  body?: string;
}

/**
 * Opens the device mail composer addressed to support.
 *
 * `canOpenURL('mailto:')` is deliberately not used: on iOS it returns false
 * unless `mailto` is whitelisted in LSApplicationQueriesSchemes, which would
 * hide the composer from users who do have Mail set up. We try to open and
 * fall back to showing the address when no mail app can handle it.
 */
export const openSupportEmail = async ({
  subject = 'Support',
  body = '',
}: SupportEmailOptions = {}): Promise<void> => {
  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.log('[support] unable to open mail composer:', error);
    showToast({
      type: 'info',
      title: 'Contact Support',
      message: `Email us at ${SUPPORT_EMAIL}`,
    });
  }
};
