import React, { useEffect } from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function LoadingScreen() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1, // Repeat indefinitely
      false // Don't reverse the animation
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateY: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <Image
          source={require("../assets/images/wadzzo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      <ActivityIndicator size="small" color="#4CAF50" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    width: width,
    height: height,
  },
  logoContainer: {
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  spinner: {
    marginTop: 20,
  },
});
