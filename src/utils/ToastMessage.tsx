import {RFPercentage} from 'react-native-responsive-fontsize';
import Toast from 'react-native-toast-message';

export const showToast = ({
  type = 'success', // 'success' | 'error' | 'info'
  title = '',
  message = '',
}) => {
  Toast.hide();
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 5000,
    topOffset: RFPercentage(8),
    autoHide: true,
  });
};
