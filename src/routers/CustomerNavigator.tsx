import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Keyboard,
  BackHandler,
  Platform,
} from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {useIsFocused} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Icons, Colors, Fonts} from '../constants/Themes';
import Settings from '../screens/commonflow/home/settings/Settings';
import Home from '../screens/customerflow/home/Home';
import Jobs from '../screens/customerflow/jobBoard/Jobs';
import Profile from '../screens/commonflow/home/profile/Profile';
import Messages from '../screens/commonflow/home/Messages';
import {useUnreadMessages} from '../utils/UnreadMessagesContext';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {SafeAreaView} from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const screenFocused = useIsFocused();
  const {unreadCount} = useUnreadMessages();
  const [_, forceUpdate] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    forceUpdate(n => n + 1);
  }, [unreadCount]);

  useEffect(() => {
    const backAction = () => {
      if (screenFocused) {
        navigation.goBack();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [screenFocused, navigation]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  if (isKeyboardVisible) return null;

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{backgroundColor: 'rgba(241, 245, 249, 1)'}}>
      <View style={[styles.tabBarContainer]}>
        <View style={styles.labelContainer}>
          {state.routes.map((route, index) => {
            const {options} = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                key={index}
                onPress={onPress}
                style={[styles.tabButton, isFocused && styles.activeTab]}>
                {route.name === 'Home' ? (
                  <View
                    style={{
                      bottom:
                        Platform.OS === 'android'
                          ? RFPercentage(3)
                          : RFPercentage(2.5),
                    }}>
                    <Image
                      source={isFocused ? Icons.home : Icons.homeInactive}
                      style={styles.middle}
                      resizeMode="contain"
                    />
                  </View>
                ) : route.name === 'Messages' ? (
                  <View>
                    <Image
                      source={isFocused ? Icons.msgActive : Icons.msg}
                      style={styles.imgStyle}
                      resizeMode="contain"
                    />
                    {unreadCount > 0 && (
                      <View
                        style={[
                          styles.count,
                          unreadCount > 9 && {
                            paddingHorizontal: RFPercentage(0.5),
                            minWidth: RFPercentage(2.8),
                          },
                        ]}>
                        <Text
                          style={{
                            color: 'white',
                            fontSize: RFPercentage(1.3),
                            fontFamily: Fonts.fontRegular,
                          }}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : route.name === 'Job Board' ? (
                  <Image
                    source={isFocused ? Icons.jobActive : Icons.job}
                    style={styles.imgStyle}
                    resizeMode="contain"
                  />
                ) : route.name === 'Settings' ? (
                  <Image
                    source={isFocused ? Icons.settingActive : Icons.settings}
                    style={styles.imgStyle}
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={isFocused ? Icons.profileActive : Icons.profile}
                    style={styles.imgStyle}
                    resizeMode="contain"
                  />
                )}
                <Text
                  style={{
                    color: isFocused ? Colors.gradient2 : Colors.secondaryText,
                    fontSize: RFPercentage(1.4),
                    top:
                      route.name === 'Home'
                        ? RFPercentage(-2.1)
                        : RFPercentage(0.5),
                    fontFamily: Fonts.fontMedium,
                  }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

const CustomerNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}>
      <Tab.Screen name="Messages" component={Messages} />
      <Tab.Screen name="Job Board" component={Jobs} />
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Settings" component={Settings} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

export default CustomerNavigator;

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: 'rgba(241, 245, 249, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    height: RFPercentage(9),
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  tabButton: {
    alignItems: 'center',
    width: RFPercentage(8),
  },
  activeTab: {
    fontWeight: 'bold',
  },
  labelContainer: {
    width: '95%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
    bottom:RFPercentage(0.5)
    // top: RFPercentage(1),
  },
  middle: {
    width: RFPercentage(7.5),
    height: RFPercentage(7.5),
  },
  imgStyle: {
    width: RFPercentage(2.5),
    height: RFPercentage(2.5),
  },
  count: {
    position: 'absolute',
    top: RFPercentage(-0.5),
    right: RFPercentage(-1),
    backgroundColor: Colors.gradient1,
    borderRadius: RFPercentage(100),
    width: RFPercentage(2),
    height: RFPercentage(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
