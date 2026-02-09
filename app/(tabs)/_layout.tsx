"use client"

import { useRouter, Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Image, Text, StyleSheet, Platform, Pressable } from "react-native";
import { AntDesign, Entypo, EvilIcons, FontAwesome5, Octicons } from "@expo/vector-icons";
import { getUser } from "../api/routes/get-user";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { Grayscale } from "react-native-color-matrix-image-filters";

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const activeTabPosition = useSharedValue(0);
  const glassScale = useSharedValue(1);
  const glassOpacity = useSharedValue(0.7);
  const liquidMorph = useSharedValue(0);

  const profileGlassScale = useSharedValue(1);
  const profileGlassOpacity = useSharedValue(0.3);

  // Collapse animation state
  const isCollapsed = useSharedValue(0);
  const previousIndex = useSharedValue(0);

  // Track if tabs are currently hidden
  const [tabsHidden, setTabsHidden] = useState(false);

  const liquidGlassStyle = useAnimatedStyle(() => {
    const tabWidth = 300 / 4;
    const translateX = activeTabPosition.value * tabWidth;

    const morphScale = interpolate(
      liquidMorph.value,
      [0, 0.5, 1],
      [1, 1.15, 1]
    );

    return {
      transform: [
        { translateX: translateX },
        { scaleX: morphScale },
        { scaleY: interpolate(morphScale, [1, 1.15], [1, 0.85]) },
      ],
      opacity:
        state.index >= 4
          ? 0
          : interpolate(liquidMorph.value, [0, 0.5, 1], [0.4, 0.8, 0.4]),
    };
  });

  const profileGlassStyle = useAnimatedStyle(() => {
    const isActive = state.index === 4;
    return {
      position: "absolute",
      top: 4,
      left: 4,
      right: 4,
      bottom: 4,
      backgroundColor: "rgba(76, 175, 80, 0.25)",
      borderRadius: 28,
      opacity: isActive ? profileGlassOpacity.value : 0,
      transform: [{ scale: profileGlassScale.value }],
      zIndex: 1,
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glassScale.value }],
    opacity: glassOpacity.value,
  }));

  // Main tab bar collapse animation
  const mainTabBarAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      isCollapsed.value,
      [0, 1],
      [0, 150] // Slide out to the right
    );

    const opacity = interpolate(
      isCollapsed.value,
      [0, 0.3, 1],
      [1, 0.5, 0]
    );

    const scale = interpolate(
      isCollapsed.value,
      [0, 1],
      [1, 0.8]
    );

    return {
      transform: [
        { translateX },
        { scale }
      ],
      opacity,
    };
  });

  // Individual tab animations
  const tab0AnimatedStyle = useAnimatedStyle(() => {
    const isActive = state.index === 0;
    return {
      transform: [
        {
          scale: withSpring(isActive ? 1.1 : 1, {
            damping: 15,
            stiffness: 200,
          }),
        },
      ],
      opacity: withTiming(isActive ? 1 : 0.7, { duration: 200 }),
    };
  });

  const tab1AnimatedStyle = useAnimatedStyle(() => {
    const isActive = state.index === 1;
    return {
      transform: [
        {
          scale: withSpring(isActive ? 1.1 : 1, {
            damping: 15,
            stiffness: 200,
          }),
        },
      ],
      opacity: withTiming(isActive ? 1 : 0.7, { duration: 200 }),
    };
  });

  const tab2AnimatedStyle = useAnimatedStyle(() => {
    const isActive = state.index === 2;
    return {
      transform: [
        {
          scale: withSpring(isActive ? 1.1 : 1, {
            damping: 15,
            stiffness: 200,
          }),
        },
      ],
      opacity: withTiming(isActive ? 1 : 0.7, { duration: 200 }),
    };
  });

  const tab3AnimatedStyle = useAnimatedStyle(() => {
    const isActive = state.index === 3;
    return {
      transform: [
        {
          scale: withSpring(isActive ? 1.1 : 1, {
            damping: 15,
            stiffness: 200,
          }),
        },
      ],
      opacity: withTiming(isActive ? 1 : 0.7, { duration: 200 }),
    };
  });

  const tab4AnimatedStyle = useAnimatedStyle(() => {
    const isActive = state.index === 4;
    return {
      transform: [
        {
          scale: withSpring(isActive ? 1.1 : 1, {
            damping: 15,
            stiffness: 200,
          }),
        },
      ],
      opacity: withTiming(isActive ? 1 : 0.7, { duration: 200 }),
    };
  });

  const tabAnimatedStyles = [
    tab0AnimatedStyle,
    tab1AnimatedStyle,
    tab2AnimatedStyle,
    tab3AnimatedStyle,
    tab4AnimatedStyle,
  ];

  useEffect(() => {
    const wasOnProfile = previousIndex.value === 4;
    const isOnProfile = state.index === 4;

    // Only auto-collapse when navigating TO profile from another tab
    if (isOnProfile && !wasOnProfile) {
      // Moving to profile - collapse tabs
      isCollapsed.value = withSpring(1, {
        damping: 20,
        stiffness: 100,
      });
      setTabsHidden(true);
    } else if (!isOnProfile && wasOnProfile) {
      // Moving away from profile - expand tabs
      isCollapsed.value = withSpring(0, {
        damping: 20,
        stiffness: 100,
      });
      setTabsHidden(false);
    }

    activeTabPosition.value = withSpring(state.index, {
      damping: 20,
      stiffness: 200,
      mass: 0.8,
    });

    liquidMorph.value = withTiming(1, { duration: 400 }, () => {
      liquidMorph.value = withTiming(0, { duration: 300 });
    });

    glassScale.value = withSpring(1.08, { damping: 12 }, () => {
      glassScale.value = withSpring(1, { damping: 18 });
    });

    glassOpacity.value = withTiming(0.95, { duration: 200 }, () => {
      glassOpacity.value = withTiming(0.7, { duration: 400 });
    });

    profileGlassScale.value = withSpring(1);
    profileGlassOpacity.value = withTiming(0.3);

    // Update previous index
    previousIndex.value = state.index;
  }, [state.index]);

  const renderTab = (route: any, index: number) => {
    const { options } = descriptors[route.key];
    const label =
      options.tabBarLabel !== undefined
        ? options.tabBarLabel
        : options.title !== undefined
          ? options.title
          : route.name;

    const isFocused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: "tabLongPress",
        target: route.key,
      });
    };

    return (
      <Animated.View
        key={route.key}
        style={[styles.tabItem, tabAnimatedStyles[index], containerAnimatedStyle]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={isFocused ? { selected: true } : {}}
          accessibilityLabel={options.tabBarAccessibilityLabel}
          onPress={onPress}
          onLongPress={onLongPress}
          style={[
            styles.tabItemPressable,
            isFocused && styles.tabItemActive,
          ]}
        >
          {options.tabBarIcon &&
            options.tabBarIcon({
              focused: isFocused,
              color: isFocused ? "#4CAF50" : "#666",
              size: 24,
            })}
          <Text
            style={[
              styles.tabLabel,
              { color: isFocused ? "#4CAF50" : "#666" },
            ]}
          >
            {label as string}
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.mainTabBarContainer, mainTabBarAnimatedStyle]}>
        <BlurView intensity={80} tint="light" style={styles.blurContainer}>
          <View style={[styles.mainTabBar]}>
            <Animated.View
              style={[styles.liquidGlassIndicator, liquidGlassStyle]}
            />
            {state.routes.slice(0, 4).map((route, idx) => renderTab(route, idx))}
          </View>
        </BlurView>
      </Animated.View>

      <Animated.View style={[styles.profileContainer]}>
        <BlurView
          intensity={80}
          tint="light"
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            style={[styles.profileButton]}
            onPress={() => {
              const route = state.routes[4];

              // If already on profile, just toggle the tabs visibility
              if (state.index === 4) {
                if (tabsHidden) {
                  // Show tabs
                  isCollapsed.value = withSpring(0, {
                    damping: 20,
                    stiffness: 100,
                  });
                  setTabsHidden(false);
                } else {
                  // Hide tabs
                  isCollapsed.value = withSpring(1, {
                    damping: 20,
                    stiffness: 100,
                  });
                  setTabsHidden(true);
                }
              } else {
                // Navigate to profile (tabs will auto-hide via useEffect)
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }
            }}
            android_ripple={{
              color: "rgba(76, 175, 80, 0.3)",
              borderless: true,
              radius: 32,
              foreground: true,
            }}
          >
            <Animated.View style={profileGlassStyle} />
            {renderTab(state.routes[4], 4)}
          </Pressable>
        </BlurView>
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const [userImage, setUserImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserImage = async () => {
      try {
        const userData = await getUser();
        if (userData?.image) {
          setUserImage(userData.image);
        }
      } catch (error) {
        console.error("Failed to fetch user image:", error);
      }
    };

    fetchUserImage();
  }, []);



  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Map",
          tabBarIcon: ({ focused, color }) => (
            <FontAwesome5
              name="map-marked-alt"
              size={focused ? 26 : 22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: "Collection",
          tabBarIcon: ({ focused, color }) => (
            <AntDesign name="book" size={focused ? 26 : 22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="bounty"
        options={{
          title: "Bounty",
          tabBarIcon: ({ focused, color }) => (
            <Entypo name="trophy" size={focused ? 26 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <>
              {!focused && userImage ? (
                <Grayscale>
                  <Image
                    source={{ uri: userImage }}
                    style={
                      {
                        height: 22,
                        width: 22,
                        borderRadius: 11,

                      }
                    }
                  />
                </Grayscale>
              ) : <Image
                source={userImage ? { uri: userImage } : require("../../assets/images/avatar-icon.png")}
                style={
                  {
                    height: focused ? 26 : 22,
                    width: focused ? 26 : 22,
                    borderRadius: userImage ? 13 : 0,
                    borderWidth: focused ? 2 : 0,
                    borderColor: focused ? "#4CAF50" : "transparent",
                    opacity: focused ? 1 : 0.4

                  }
                }
              />}

              {/* <Image
                source={userImage ? { uri: userImage } : require("../../assets/images/avatar-icon.png")}
                style={
                  {
                    height: focused ? 26 : 22,
                    width: focused ? 26 : 22,
                    borderRadius: userImage ? 13 : 0,
                    borderWidth: focused ? 2 : 0,
                    borderColor: focused ? "#4CAF50" : "transparent",
                    opacity: focused ? 1 : 0.4

                  }
                }
              /> */}
            </>


          ),
        }}
      />
      <Tabs.Screen
        name="creator"
        options={{
          title: "",
          tabBarIcon: ({ focused, color }) => (
            <Image
              source={require("../../assets/images/icon.png")}
              height={40}
              width={40}
              resizeMode="contain"
              style={{
                width: 45,
                height: 45,
                marginTop: 20,
              }}
            />
          )
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  mainTabBarContainer: {
    flex: 1,
    borderRadius: 25,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  blurContainer: {
    flex: 1,
    borderRadius: 25,
  },
  mainTabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 25,
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 1)",
  },
  liquidGlassIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    width: "25%",
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.4)",
    zIndex: 1,
  },
  profileContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  profileButton: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 1)",
  },
  tabItem: {
    flex: 1,
  },
  tabItemPressable: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 18,
    flex: 1,
  },
  tabItemActive: {
    backgroundColor: "transparent",
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },
  creatorIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  creatorIconFocused: {
    backgroundColor: "#e8f5e9",
    borderWidth: 3,
  },
  creatorIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },

  profileTabImageFocused: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
});