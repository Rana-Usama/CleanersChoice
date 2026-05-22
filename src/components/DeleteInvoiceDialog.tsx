import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts} from '../constants/Themes';

interface Props {
  visible: boolean;
  invoiceId?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteInvoiceDialog: React.FC<Props> = ({
  visible,
  invoiceId,
  loading,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={loading ? undefined : onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialog}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={RFPercentage(3)}
                  color={Colors.red500}
                />
              </View>
              <Text style={styles.title}>Delete invoice?</Text>
              <Text style={styles.message}>
                Delete invoice {invoiceId || ''}? This cannot be undone.
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={loading}
                  onPress={onCancel}
                  style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={loading}
                  onPress={onConfirm}
                  style={styles.deleteBtn}>
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.deleteText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default DeleteInvoiceDialog;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.blackOverlay50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: RFPercentage(2.5),
  },
  dialog: {
    width: '100%',
    maxWidth: RFPercentage(42),
    borderRadius: RFPercentage(2),
    backgroundColor: Colors.white,
    padding: RFPercentage(2.3),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grayBorderOverlay80,
  },
  iconWrap: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.redBg50,
    marginBottom: RFPercentage(1.2),
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2.1),
    color: Colors.primaryText,
    textAlign: 'center',
  },
  message: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.6),
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: RFPercentage(2.4),
    marginTop: RFPercentage(0.9),
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: RFPercentage(2.2),
    gap: RFPercentage(1),
  },
  cancelBtn: {
    flex: 1,
    height: RFPercentage(5),
    borderRadius: RFPercentage(1.1),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
  },
  deleteBtn: {
    flex: 1,
    height: RFPercentage(5),
    borderRadius: RFPercentage(1.1),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.red500,
  },
  cancelText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
    color: Colors.secondaryText,
  },
  deleteText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
    color: Colors.white,
  },
});
