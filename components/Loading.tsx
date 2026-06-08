import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function LoadingScreen() {
  const flip = useSharedValue(1);

  useEffect(() => {
    flip.value = withRepeat(
      withSequence(
        withTiming(-1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scaleX: flip.value }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../assets/images/wadzzo.png")}
        style={[styles.logo, animatedStyle]}
      />
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
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 30,
  },
  spinner: {
    marginTop: 20,
  },
});
