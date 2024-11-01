import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { ActivityIndicator } from "react-native-paper";

const { width, height } = Dimensions.get("window");

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
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
