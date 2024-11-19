import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";

import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
} from "react-native";

import { useMutation } from "@tanstack/react-query";

import { useRouter } from "expo-router";

import { Button, TextInput } from "react-native-paper";
import { Color } from "../components/utils/all-colors";
import { BASE_URL } from "../components/utils/Common";

const screenWidth = Dimensions.get("window").width;

const webPlatform = Platform.OS === "web";

const SignUpScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: async () => {
      const requestName = "api/v1/auth/sign_up";
      const response = await fetch(new URL(requestName, BASE_URL).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: email,
          password: password,
          password_confirmation: confirmPassword,
          username: userName,
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      } else {
        const token = response.headers.get("set-cookie");
        if (token) {
          Alert.alert("Success", "Signup successful");
          router.push("/(tabs)/");
        }
      }
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleSignUp = () => {
    mutation.mutate();
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.mainContainer}>
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.rotatedCardBlue} />
            <View
              style={[
                styles.rotatedCardColor,
                { backgroundColor: Color.wadzzo },
              ]}
            />
            <View style={styles.innerContainer}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../assets/images/wadzzo.png")}
                  style={styles.logo}
                />
                <Text style={styles.loginText}>
                  Sign up to begin collecting and earning rewards
                </Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  mode="outlined"
                  placeholder="Email"
                  style={styles.input}
                  value={email}
                  onChangeText={(text) => setEmail(text)}
                />
                <TextInput
                  mode="outlined"
                  placeholder="Username"
                  secureTextEntry
                  value={userName}
                  onChangeText={(text) => setUserName(text)}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Password"
                  secureTextEntry
                  mode="outlined"
                  value={password}
                  onChangeText={(text) => setPassword(text)}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  mode="outlined"
                  onChangeText={(text) => setConfirmPassword(text)}
                  secureTextEntry
                  style={styles.input}
                />

                <Button
                  onPress={handleSignUp}
                  style={{
                    marginTop: 20,
                    backgroundColor: Color.wadzzo,
                  }}
                >
                  <Text style={{ color: "white" }}> Sign Up </Text>
                </Button>

                <View style={styles.alreadyHaveAccountContainer}>
                  <Text style={styles.alreadyHaveAccountText}>
                    Already have an account?
                  </Text>
                  <Button onPress={() => router.push("/Login")}>Login</Button>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  mainContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",

    backgroundColor: "#f7fafc",
  },
  container: {
    flex: 1,
    width: webPlatform ? 500 : "100%",
    padding: 10,
    justifyContent: "center",
    fontFamily: "sans-serif",
  },
  card: {
    position: "relative",
    backgroundColor: "#f7fafc", // Gray-100
  },
  rotatedCardBlue: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#3b82f6", // Blue-400
    borderRadius: 24,
    transform: [{ rotate: "-6deg" }],
  },
  rotatedCardColor: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 24,
    transform: [{ rotate: "6deg" }],
  },
  innerContainer: {
    width: "100%",
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#e2e8f0", // Gray-200
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    shadowOffset: { width: 0, height: 2 },
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    height: 100,
    width: 100,
  },
  loginText: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    color: "#4A5568", // Gray-700
    fontWeight: "600",
  },
  inputContainer: {
    marginTop: 20,
  },
  input: {
    marginTop: 8,
    width: "100%",
    height: 44,
    borderRadius: 10,
    backgroundColor: "#f7fafc", // Gray-100
  },

  button: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    shadowOffset: { width: 0, height: 2 },
    marginTop: 20,
  },
  buttonText: {
    textAlign: "center",
    color: "white",
  },
  alreadyHaveAccountContainer: {
    flex: 1,
    padding: 8,
    width: "100%",
    marginTop: 20,
    flexDirection: "column",
    justifyContent: "center",
  },
  alreadyHaveAccountText: {
    width: "100%",
    textAlign: "center",
  },
  createAccountText: {
    color: "#3b82f6", // Blue-500
  },
});

export default SignUpScreen;
