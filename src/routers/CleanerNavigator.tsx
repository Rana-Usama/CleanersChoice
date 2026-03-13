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
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Icons, Colors, Fonts} from '../constants/Themes';
import {useIsFocused} from '@react-navigation/native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import Dashboard from '../screens/cleanerflow/homescreens/home/Dashboard';
import CleanerJobs from '../screens/cleanerflow/homescreens/jobs/CleanerJobs';
import {RFPercentage} from 'react-native-responsive-fontsize';
import MyJobs from '../screens/cleanerflow/homescreens/jobs/MyJobs';
import Settings from '../screens/commonflow/home/settings/Settings';
import Messages from '../screens/commonflow/home/Messages';
import {useUnreadMessages} from '../utils/UnreadMessagesContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {SafeAreaView} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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

  // useEffect(() => {
  //   const backAction = () => {
  //     if (screenFocused) {
  //       navigation.goBack();
  //       return true;
  //     }
  //     return false;
  //   };

  //   const backHandler = BackHandler.addEventListener(
  //     'hardwareBackPress',
  //     backAction,
  //   );

  //   return () => backHandler.remove();
  // }, [screenFocused, navigation]);

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

  const insets = useSafeAreaInsets();

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
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                key={index}
                onPress={() => navigation.navigate(route.name)}
                style={[styles.tabButton]}>
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
                            fontSize: RFPercentage(1.4),
                            fontFamily: Fonts.fontRegular,
                          }}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : route.name === 'Job List' ? (
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
                ) : route.name === 'My Jobs' ? (
                  <MaterialCommunityIcons
                    name={isFocused ? 'briefcase-check' : 'briefcase-check-outline'}
                    size={RFPercentage(2.8)}
                    color={isFocused ? Colors.gradient2 : Colors.secondaryText}
                  />
                ) : (
                  <Image
                    source={isFocused ? Icons.profileActive : Icons.profile}
                    style={styles.imgStyle}
                    resizeMode="contain"
                  />
                )}
                <Text
                  numberOfLines={1}
                  style={{
                    color: isFocused ? Colors.gradient2 : Colors.secondaryText,
                    fontSize: RFPercentage(1.5),
                    top:
                      route.name === 'Home'
                        ? RFPercentage(-2.1)
                        : RFPercentage(0.5),
                    fontFamily: Fonts.fontMedium,
                  }}>
                  {typeof label === 'function'
                    ? label({
                        focused: isFocused,
                        color: isFocused
                          ? Colors.gradient2
                          : Colors.secondaryText,
                        position: 'below-icon',
                        children: route.name,
                      })
                    : label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
      <Tab.Screen name="Job List" component={CleanerJobs} />
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="Settings" component={Settings} />
      <Tab.Screen name="My Jobs" component={MyJobs} />
    </Tab.Navigator>
  );
};

export default CleanerNavigator;

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
    bottom: RFPercentage(0.5),
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
