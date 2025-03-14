import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Keyboard, BackHandler } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icons , Colors, Fonts} from "../constants/Themes";
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
            <View style={{width:'90%', flexDirection:'row', alignItems:'center', justifyContent:'space-around',}}>
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
                            <View style={{ bottom: RFPercentage(2.5) }}>
                                <Image source={isFocused ? Icons.home : Icons.homeInactive} style={{ width: RFPercentage(6.5), height: RFPercentage(6.5) }} resizeMode="contain" />
                            </View>
                        ) :
                            route.name === "Messages" ?
                                (
                                    <Image source={isFocused ? Icons.msgActive : Icons.msg} style={{ width: RFPercentage(2.5), height: RFPercentage(2.5) }} resizeMode="contain" />
                                )
                                :
                                route.name === "Job Board" ?
                                    (
                                        <Image source={isFocused ? Icons.jobActive : Icons.job} style={{width: RFPercentage(2.5), height: RFPercentage(2.5)  }} resizeMode="contain" />
                                    )
                                    :
                                    route.name === "Settings" ?
                                        (
                                            <Image source={isFocused ? Icons.settingActive : Icons.settings} style={{ width: RFPercentage(2.5), height: RFPercentage(2.5),}} resizeMode="contain" />
                                        )
                                        :

                                        (
                                            <Image source={isFocused ? Icons.profileActive : Icons.profile} style={{ width: RFPercentage(2.5), height: RFPercentage(2.5)  }} resizeMode="contain" />
                                        )


                        }
                        <Text style={{ color: isFocused ? Colors.gradient2 : Colors.secondaryText, fontSize: RFPercentage(1.2), top: 5, fontFamily: Fonts.fontRegular }}>{route.name === "Home" ? '' : label}</Text>
                    </TouchableOpacity>
                );
            })}
            </View>
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
        height: RFPercentage(8),
        backgroundColor: "rgba(241, 245, 249, 1)",
        borderRadius: RFPercentage(3),
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        alignItems:'center',
        justifyContent:'center'

    },
    tabButton: {
        alignItems: "center",
        width:RFPercentage(8)
    },
    activeTab: {
        fontWeight: "bold",
    },
});