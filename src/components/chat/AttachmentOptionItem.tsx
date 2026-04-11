import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../../constants/Themes';

interface AttachmentOptionItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

const AttachmentOptionItem: React.FC<AttachmentOptionItemProps> = ({
  icon,
  label,
  onPress,
}) => (
  <TouchableOpacity
    activeOpacity={0.7}
    style={styles.container}
    onPress={onPress}>
    {icon}
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: RFPercentage(0.8),
  },
  label: {
    fontFamily: Fonts.fontRegular,
    fontSize: RFPercentage(1.8),
    color: Colors.primaryText,
  },
});

export default AttachmentOptionItem;
