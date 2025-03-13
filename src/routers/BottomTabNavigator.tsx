import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Keyboard, BackHandler } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icons , Colors} from "../constants/Themes";
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Messages from "../screens/homescreens/messages/Messages";
import Settings from "../screens/homescreens/settings/Settings";
import Home from "../screens/homescreens/home/Home";
import Jobs from "../screens/homescreens/jobBoard/Jobs";
import Profile from "../screens/homescreens/profile/Profile";
import { RFPercentage } from "react-native-responsive-fontsize";

const { width, height } = Dimensions.get('window');

const Tab = createBottomTabNavigator();

const CustomTabBar:React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const screenFocused = useIsFocused();

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
        const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
            setKeyboardVisible(true);
        });
        const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardVisible(false);
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    if (isKeyboardVisible) return null;

    return (
        <View style={styles.tabBarContainer}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
                const isFocused = state.index === index;

                return (
                    <TouchableOpacity
                        key={index}
                        onPress={() => navigation.navigate(route.name)}
                        style={[styles.tabButton, isFocused && styles.activeTab]}
                        >
                        {route.name === "Home" ? (
                            <View style={{ bottom: RFPercentage(1.6), marginRight:RFPercentage(3) }}>
                                <Image source={isFocused ? Icons.home : Icons.homeInactive} style={{ width: RFPercentage(3), height: 55 }} resizeMode="contain" />
                            </View>
                        ) :
                            route.name === "Messages" ?
                                (
                                    <Image source={isFocused ? Icons.msgActive : Icons.msg} style={{ width: 20, height: 20 }} resizeMode="contain" />
                                )
                                :
                                route.name === "Jobs" ?
                                    (
                                        <Image source={isFocused ? Icons.jobActive : Icons.job} style={{ width: 20, height: 20 }} resizeMode="contain" />
                                    )
                                    :
                                    route.name === "Settings" ?
                                        (
                                            <Image source={isFocused ? Icons.settingActive : Icons.settings} style={{ width: 20, height: 20 }} resizeMode="contain" />
                                        )
                                        :

                                        (
                                            <Image source={isFocused ? Icons.profileActive : Icons.profile} style={{ width: 20, height: 20 }} resizeMode="contain" />
                                        )


                        }
                        <Text style={{ color: isFocused ? Colors.gradient2 : "#777", fontSize: 11, top: 5, fontFamily: 'Poppins-Regular' }}>{route.name === "Home" ? '' : label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const BottomNavigation: React.FC = () => {
    return (
        <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />}

            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true
            }}
        >
            <Tab.Screen name="Messages" component={Messages} />
            <Tab.Screen name="Job Board" component={Jobs} />
            <Tab.Screen name="Home" component={Home} />
            <Tab.Screen name="Settings" component={Settings} />
            <Tab.Screen name="Profile" component={Profile} />
        </Tab.Navigator>
    );
}

export default BottomNavigation;

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    tabBarContainer: {
        flexDirection: "row",
        height: RFPercentage(8),
        backgroundColor: "rgba(241, 245, 249, 1)",
        borderRadius: RFPercentage(5),
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: "space-around",
        alignItems: "center",
        width: '99%',
        paddingHorizontal: RFPercentage(1.5)

    },
    tabButton: {
        alignItems: "center",
    },
    activeTab: {
        fontWeight: "bold",
    },
});