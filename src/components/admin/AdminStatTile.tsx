import React, {memo} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Fonts} from '../../constants/Themes';

/** Compact metric tile for the admin hub. Tappable when `onPress` is given. */

interface Props {
  label: string;
  value: number | string;
  icon: string;
  tint?: string;
  loading?: boolean;
  onPress?: () => void;
}

const AdminStatTile: React.FC<Props> = ({
  label,
  value,
  icon,
  tint = "rgba(24, 52, 233, 0.96)",
  loading = false,
  onPress,
}) => {
  const Wrapper: any = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      {...(onPress ? {onPress, activeOpacity: 0.85} : {})}
      style={styles.tile}>
      <View style={[styles.iconWrap, {backgroundColor: `${tint}1A`}]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={RFPercentage(2.2)}
          color={tint}
        />
      </View>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={tint}
          style={styles.loader}
        />
      ) : (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      )}
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Wrapper>
  );
};

export default memo(AdminStatTile);

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(1.8),
    paddingVertical: RFPercentage(1.6),
    paddingHorizontal: RFPercentage(1.2),
    borderWidth: 1,
    borderColor: Colors.grayBorderOverlay60,
    alignItems: 'flex-start',
    shadowColor: Colors.shadowBlueLight,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(100),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFPercentage(0.8),
  },
  value: {
    color: Colors.primaryText,
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(2.4),
  },
  loader: {
    height: RFPercentage(3),
    alignSelf: 'flex-start',
  },
  label: {
    color: Colors.secondaryText,
    fontFamily: Fonts.fontMedium,
    fontSize: RFPercentage(1.35),
    marginTop: RFPercentage(0.2),
  },
});
