import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Keyboard,
  BackHandler,
  SafeAreaView,
} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Icons, Colors, Fonts} from '../constants/Themes';
import {useIsFocused} from '@react-navigation/native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import Dashboard from '../screens/cleanerflow/homescreens/home/Dashboard';
import CleanerJobs from '../screens/cleanerflow/homescreens/jobs/CleanerJobs';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Profile from '../screens/commonflow/home/profile/Profile';
import Settings from '../screens/commonflow/home/settings/Settings';
import Messages from '../screens/commonflow/home/Messages';
import {useUnreadMessages} from '../utils/UnreadMessagesContext';

const Tab = createBottomTabNavigator();

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const screenFocused = useIsFocused();
  const {unreadCount} = useUnreadMessages();

  const [_, forceUpdate] = useState(0);

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
    <SafeAreaView style={styles.tabBarContainer}>
      <View style={styles.labelContainer}>
        {state.routes.map((route, index) => {
          const {options} = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : route.name;
          const isFocused = state.index === index;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate(route.name)}
              style={[styles.tabButton, isFocused && styles.activeTab]}>
              {route.name === 'Home' ? (
                <View style={{bottom: RFPercentage(2.3)}}>
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
                  {unreadCount > 0 && <View style={styles.count} />}
                </View>
              ) : route.name === 'Job Listings' ? (
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
                  fontSize: RFPercentage(1.2),
                  top: RFPercentage(0.5),
                  fontFamily: isFocused ? Fonts.fontMedium : Fonts.fontRegular,
                }}>
                {route.name === 'Home' ? '' : label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const CleanerNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}>
      <Tab.Screen name="Messages" component={Messages} />
      <Tab.Screen name="Job Listings" component={CleanerJobs} />
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="Settings" component={Settings} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

export default CleanerNavigator;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarContainer: {
    height: RFPercentage(8.6),
    backgroundColor: 'rgba(241, 245, 249, 1)',
    borderRadius: RFPercentage(3),
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    alignItems: 'center',
    width: RFPercentage(8),
  },
  activeTab: {
    fontWeight: 'bold',
  },
  imgStyle: {
    width: RFPercentage(2.8),
    height: RFPercentage(2.8),
  },
  middle: {
    width: RFPercentage(7),
    height: RFPercentage(7),
  },
  labelContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  count: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: Colors.gradient1,
    borderRadius: 6,
    width: 8,
    height: 8,
  },
});
