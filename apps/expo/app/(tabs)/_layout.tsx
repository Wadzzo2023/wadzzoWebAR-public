import { useRouter, Tabs } from "expo-router";
import React, { useEffect } from "react";
import { View, Image, StyleSheet, Platform } from "react-native";
import { AntDesign, Entypo, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@auth/Provider";

export default function _layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarLabelPosition: "below-icon",
        tabBarActiveTintColor: "green",
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Map",
          tabBarIcon: ({ focused, color }) => (
            <FontAwesome5
              name="map-marked-alt"
              size={focused ? 30 : 20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: "Collection",
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <AntDesign name="book" size={focused ? 30 : 20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="creator"
        options={{
          title: "",

          tabBarIcon: ({ focused }) => (
            <View style={styles.homeButtonContainer}>
              <LinearGradient
                colors={["#4CAF50", "#45a049"]}
                style={styles.homeButtonGradient}
              >
                <View
                  style={[
                    styles.homeButton,
                    focused ? styles.homeButtonFocused : null,
                  ]}
                >
                  <Image
                    source={require("../../assets/images/wadzzo.png")}
                    style={styles.homeButtonImage}
                  />
                </View>
              </LinearGradient>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="bounty"
        options={{
          title: "Bounty",
          tabBarIcon: ({ focused, color }) => (
            <Entypo name="trophy" size={focused ? 30 : 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused, color }) => (
            <Entypo name="menu" size={focused ? 30 : 20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === "ios" ? 80 : 60,
    position: "absolute",

    // bottom: 4,
    // left: 4,
    // right: 4,
    // borderRadius: 15,
    // paddingBottom: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  homeButtonContainer: {
    width: 70,
    height: 70,
    marginTop: -40,
  },
  homeButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 35,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  homeButton: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  homeButtonFocused: {
    backgroundColor: "#e8f5e9",
  },
  homeButtonImage: {
    width: 40,
    height: 60,
  },
});
