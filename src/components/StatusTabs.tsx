import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '../constants/Themes';
import {PaymentStatus} from '../types/invoice';

interface Props {
  active: PaymentStatus;
  onChange: (next: PaymentStatus) => void;
  unpaidCount: number;
  paidCount: number;
}

const TABS: {key: PaymentStatus; label: string}[] = [
  {key: 'unpaid', label: 'Unpaid'},
  {key: 'paid', label: 'Paid'},
];

const StatusTabs: React.FC<Props> = ({
  active,
  onChange,
  unpaidCount,
  paidCount,
}) => {
  const activeIndex = active === 'paid' ? 1 : 0;
  const translate = useRef(new Animated.Value(activeIndex)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const inset = RFPercentage(0.4);
  const indicatorWidth = Math.max(0, (trackWidth - inset * 2) / 2);

  useEffect(() => {
    Animated.spring(translate, {
      toValue: activeIndex,
      useNativeDriver: true,
      bounciness: 4,
      speed: 14,
    }).start();
  }, [activeIndex, translate]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container}>
      <View style={styles.track} onLayout={handleLayout}>
        <Animated.View
          style={[
            styles.indicator,
            {
              width: indicatorWidth,
              transform: [
                {
                  translateX: translate.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, indicatorWidth],
                  }),
                },
              ],
            },
          ]}
        />
        {TABS.map(tab => {
          const isActive = active === tab.key;
          const count = tab.key === 'unpaid' ? unpaidCount : paidCount;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.85}
              style={styles.tab}
              onPress={() => onChange(tab.key)}>
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                ]}>
                {tab.label}
              </Text>
              <View
                style={[
                  styles.badge,
                  isActive && styles.badgeActive,
                ]}>
                <Text
                  style={[
                    styles.badgeText,
                    isActive && styles.badgeTextActive,
                  ]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default StatusTabs;

const styles = StyleSheet.create({
  container: {
    marginTop: RFPercentage(2),
  },
  track: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(1.2),
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    padding: RFPercentage(0.4),
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: RFPercentage(0.4),
    bottom: RFPercentage(0.4),
    left: RFPercentage(0.4),
    borderRadius: RFPercentage(1),
    backgroundColor: Colors.gradient1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RFPercentage(1.1),
    gap: RFPercentage(0.6),
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: RFPercentage(1.6),
    color: Colors.secondaryText,
  },
  labelActive: {
    color: Colors.white,
  },
  badge: {
    minWidth: RFPercentage(2.6),
    height: RFPercentage(2.4),
    paddingHorizontal: RFPercentage(0.7),
    borderRadius: RFPercentage(100),
    backgroundColor: Colors.lightGrayBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: Colors.whiteOverlay30,
  },
  badgeText: {
    fontFamily: Fonts.fontBold,
    fontSize: RFPercentage(1.3),
    color: Colors.secondaryText,
  },
  badgeTextActive: {
    color: Colors.white,
  },
});
