import {StyleSheet, Text, View, Dimensions, TouchableOpacity} from 'react-native';
import React from 'react';
import GradientButton from './GradientButton';
import {Colors, Fonts} from '../constants/Themes';
import {RFPercentage} from 'react-native-responsive-fontsize';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, {Path} from 'react-native-svg';

const {width} = Dimensions.get('window');

interface props {
  title: string;
  passwordModal?: boolean;
  onPress3?: () => void;
  onPress?: () => void;
  onPress2?: () => void;
  loader?: boolean;
  subTitle: string;
  buttonTitle?: string;
  cancelButtonTitle?: string;
  iconName?: string;
  iconColor?: string;
  hidePrimaryButton?: boolean;
  svgIconType?: 'confirm' | 'cancel';
}

const CustomModal = (props: props) => {
  const iconSize = RFPercentage(4.2);
  return (
    <View style={styles.modalContainer}>
      {/* Icon */}
      {props.passwordModal && (
        <View style={styles.iconContainer}>
          <AntDesign
            name="checkcircle"
            color={Colors.success}
            size={RFPercentage(5)}
          />
        </View>
      )}

      {/* Confirm SVG Icon */}
      {!props.passwordModal && props.svgIconType === 'confirm' && (
        <View style={styles.svgIconWrapper}>
          <Svg width={iconSize} height={iconSize} viewBox="0 0 40 40" fill="none">
            <Path d="M20.0002 3.33301C15.6335 3.33301 12.0835 6.88301 12.0835 11.2497C12.0835 15.533 15.4335 18.9997 19.8002 19.1497C19.9335 19.133 20.0668 19.133 20.1668 19.1497C20.2002 19.1497 20.2168 19.1497 20.2502 19.1497C20.2668 19.1497 20.2668 19.1497 20.2835 19.1497C24.5502 18.9997 27.9002 15.533 27.9168 11.2497C27.9168 6.88301 24.3668 3.33301 20.0002 3.33301Z" fill="#10B981" />
            <Path d="M28.4666 23.6004C23.8166 20.5004 16.2333 20.5004 11.5499 23.6004C9.43327 25.0004 8.2666 26.9171 8.2666 28.9671C8.2666 31.0171 9.43327 32.9171 11.5333 34.3171C13.8666 35.8837 16.9333 36.6671 19.9999 36.6671C23.0666 36.6671 26.1333 35.8837 28.4666 34.3171C30.5666 32.9004 31.7333 31.0004 31.7333 28.9337C31.7166 26.9004 30.5666 24.9837 28.4666 23.6004ZM23.8833 27.6004L19.6833 31.8004C19.4833 32.0004 19.2166 32.1004 18.9499 32.1004C18.6833 32.1004 18.4166 31.9837 18.2166 31.8004L16.1166 29.7004C15.7166 29.3004 15.7166 28.6337 16.1166 28.2337C16.5166 27.8337 17.1833 27.8337 17.5833 28.2337L18.9499 29.6004L22.4166 26.1337C22.8166 25.7337 23.4833 25.7337 23.8833 26.1337C24.2999 26.5337 24.2999 27.2004 23.8833 27.6004Z" fill="#10B981" />
          </Svg>
        </View>
      )}

      {/* Cancel SVG Icon */}
      {!props.passwordModal && props.svgIconType === 'cancel' && (
        <View style={styles.svgIconWrapper}>
          <Svg width={iconSize} height={iconSize} viewBox="0 0 40 40" fill="none">
            <Path d="M20.0002 3.33301C15.6335 3.33301 12.0835 6.88301 12.0835 11.2497C12.0835 15.533 15.4335 18.9997 19.8002 19.1497C19.9335 19.133 20.0668 19.133 20.1668 19.1497C20.2002 19.1497 20.2168 19.1497 20.2502 19.1497C20.2668 19.1497 20.2668 19.1497 20.2835 19.1497C24.5502 18.9997 27.9002 15.533 27.9168 11.2497C27.9168 6.88301 24.3668 3.33301 20.0002 3.33301Z" fill="#EF4444" />
            <Path d="M28.4666 23.5838C23.8166 20.4838 16.2333 20.4838 11.5499 23.5838C9.43327 25.0005 8.2666 26.9171 8.2666 28.9671C8.2666 31.0171 9.43327 32.9171 11.5333 34.3171C13.8666 35.8838 16.9333 36.6671 19.9999 36.6671C23.0666 36.6671 26.1333 35.8838 28.4666 34.3171C30.5666 32.9005 31.7333 31.0005 31.7333 28.9338C31.7166 26.8838 30.5666 24.9838 28.4666 23.5838ZM23.2333 30.4338C23.7166 30.9171 23.7166 31.7171 23.2333 32.2005C22.9833 32.4505 22.6666 32.5671 22.3499 32.5671C22.0333 32.5671 21.7166 32.4505 21.4666 32.2005L19.9999 30.7338L18.5333 32.2005C18.2833 32.4505 17.9666 32.5671 17.6499 32.5671C17.3333 32.5671 17.0166 32.4505 16.7666 32.2005C16.2833 31.7171 16.2833 30.9171 16.7666 30.4338L18.2333 28.9671L16.7666 27.5005C16.2833 27.0171 16.2833 26.2171 16.7666 25.7338C17.2499 25.2505 18.0499 25.2505 18.5333 25.7338L19.9999 27.2005L21.4666 25.7338C21.9499 25.2505 22.7499 25.2505 23.2333 25.7338C23.7166 26.2171 23.7166 27.0171 23.2333 27.5005L21.7666 28.9671L23.2333 30.4338Z" fill="#EF4444" />
          </Svg>
        </View>
      )}

      {/* Custom Icon */}
      {!props.passwordModal && !props.svgIconType && props.iconName && (
        <MaterialCommunityIcons
          name={props.iconName}
          color={props.iconColor || Colors.red500}
          size={RFPercentage(4)}
          style={{marginBottom: RFPercentage(1)}}
        />
      )}

      {/* Title */}
      <Text style={styles.modalTitle}>{props.title}</Text>

      {/* Subtitle */}
      <Text style={styles.modalText}>{props.subTitle}</Text>

      {/* Action Buttons */}
      {props.passwordModal ? (
        <View style={styles.okButtonContainer}>
          <GradientButton
            title="Ok"
            onPress={props.onPress3 ?? (() => {})}
            style={styles.okButton}
            textStyle={styles.okButtonText}
          />
        </View>
      ) : props.hidePrimaryButton ? (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={props.onPress3 ?? (() => {})}
            style={styles.splitButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={props.onPress ?? (() => {})}
            style={styles.splitCancelButton}>
            <Text style={styles.splitCancelButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={props.onPress ?? (() => {})}
            style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>
              {props.cancelButtonTitle ?? 'Cancel'}
            </Text>
          </TouchableOpacity>
          <GradientButton
            title={props.buttonTitle ? props.buttonTitle : 'Yes'}
            onPress={props.onPress2 ?? (() => {})}
            loading={props.loader}
            disabled={props.loader}
            style={styles.yesButton}
            textStyle={styles.yesButtonText}
          />
        </View>
      )}
    </View>
  );
};

export default CustomModal;

const styles = StyleSheet.create({
  modalContainer: {
    width: width * 0.85,
    maxWidth: RFPercentage(42),
    borderRadius: RFPercentage(2.5),
    backgroundColor: Colors.white,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(3),
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // elevation: 8,
    borderWidth: 1,
    borderColor: Colors.grayBorderOverlay80,
    borderBottomWidth:3
  },
  iconContainer: {
    marginBottom: RFPercentage(2),
    width: RFPercentage(7),
    height: RFPercentage(7),
    borderRadius: RFPercentage(3.5),
    backgroundColor: Colors.successOverlay10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.successOverlay20,
  },
  modalTitle: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(2.2),
    textAlign: 'center',
    marginBottom: RFPercentage(2),
    lineHeight: RFPercentage(2.8),
  },
  modalText: {
    textAlign: 'center',
    fontSize: RFPercentage(1.6),
    fontFamily: Fonts.fontRegular,
    color: Colors.secondaryText,
    marginTop: 0,
    marginBottom: RFPercentage(3),
    lineHeight: RFPercentage(2.7),
    paddingHorizontal: 0,
  },
  okButtonContainer: {
    marginTop: RFPercentage(1),
    width: '100%',
  },
  okButton: {
    width: '100%',
    height: RFPercentage(5.5),
    borderRadius: RFPercentage(1.3),
  },
  okButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
  },
  buttonContainer: {
    marginTop: RFPercentage(1),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    gap: RFPercentage(1.5),
  },
  cancelButton: {
    flex: 1,
    height: RFPercentage(5),
    borderRadius: RFPercentage(100),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gradient1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitButton: {
    flex: 1,
    height: RFPercentage(5),
    borderRadius: RFPercentage(100),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gradient1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitCancelButton: {
    flex: 1,
    height: RFPercentage(5),
    borderRadius: RFPercentage(100),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.red500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitCancelButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.red500,
  },
  cancelButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
    color: Colors.gradient1,
  },
  yesButton: {
    flex: 1,
    height: RFPercentage(5),
    borderRadius: RFPercentage(100),
  },
  yesButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: Fonts.fontMedium,
  },
  svgIconWrapper: {
    marginBottom: RFPercentage(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
