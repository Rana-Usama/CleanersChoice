import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '../constants/Themes';

const {width} = Dimensions.get('window');

interface RemovePackageModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  packageNumber?: number;
}

const RemovePackageModal: React.FC<RemovePackageModalProps> = ({
  visible,
  onClose,
  onConfirm,
  packageNumber,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleConfirm = () => {
    setIsClosing(true);
    setTimeout(() => {
      onConfirm();
      setIsClosing(false);
    }, 200);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View
              style={[styles.modalContainer, isClosing && styles.modalClosing]}>
              {/* Modal Header */}
              <LinearGradient
                colors={[Colors.redBg50, Colors.redBg100]}
                style={styles.modalHeader}>
                <View style={styles.iconContainer}>
                  <View style={styles.iconBackground}>
                    <MaterialIcons
                      name="delete-outline"
                      size={RFPercentage(3)}
                      color={Colors.dangerRed}
                    />
                  </View>
                </View>
                <Text style={styles.modalTitle}>Remove Package</Text>
                <Text style={styles.modalSubtitle}>
                  {packageNumber
                    ? `Package ${packageNumber} will be permanently removed`
                    : 'This package will be permanently removed'}
                </Text>
              </LinearGradient>

              {/* Modal Body */}
              <View style={styles.modalBody}>
                <View style={styles.warningContainer}>
                  <View style={styles.warningIcon}>
                    <AntDesign
                      name="exclamationcircle"
                      size={20}
                      color={Colors.dangerRed}
                    />
                  </View>
                  <Text style={styles.warningText}>
                    This action cannot be undone. All data in this package will
                    be lost.
                  </Text>
                </View>

                <View style={styles.infoContainer}>
                  <View style={styles.infoItem}>
                    <MaterialIcons
                      name="info-outline"
                      size={16}
                      color={Colors.placeholderColor}
                    />
                    <Text style={styles.infoText}>
                      Package numbering will be rearranged automatically
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <MaterialIcons
                      name="info-outline"
                      size={16}
                      color={Colors.placeholderColor}
                    />
                    <Text style={styles.infoText}>
                      You can always add a new package later
                    </Text>
                  </View>
                </View>
              </View>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                  activeOpacity={0.7}>
                  <LinearGradient
                    colors={[Colors.gray50, Colors.lightGrayBg]}
                    style={styles.cancelButtonGradient}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={handleConfirm}
                  activeOpacity={0.7}>
                  <LinearGradient
                    colors={[Colors.dangerGradient1, Colors.dangerGradient2]}
                    style={styles.removeButtonGradient}>
                    <Text style={styles.removeButtonText}>Remove Package</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.blackOverlay50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width * 0.9,
    backgroundColor: Colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    transform: [{scale: 1}],
  },
  modalClosing: {
    transform: [{scale: 0.95}],
    opacity: 0,
  },
  modalHeader: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.redBorder200,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dangerRedOverlay10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.redBorder200,
  },
  modalTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(2),
    color: Colors.dangerRed,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.5),
    color: Colors.darkRed900,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalBody: {
    padding: 24,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.redBg50,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.redBorder200,
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.4),
    color: Colors.darkRed900,
    lineHeight: 20,
  },
  infoContainer: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.4),
    color: Colors.placeholderColor,
    marginLeft: 10,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  cancelButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.8),
    color: Colors.gray700,
  },
  removeButton: {
    flex: 1,
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: Colors.dangerRed,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  removeButtonGradient: {
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    marginRight: 8,
  },
  removeButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.7),
    color: Colors.white,
  },
});

export default RemovePackageModal;
