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

import { ActivityIndicator, Button, TextInput } from "react-native-paper";
import { Color } from "../components/utils/all-colors";
import { BASE_URL } from "../components/utils/Common";
import { AuthError, AuthErrorCodes, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/components/lib/auth/config";
import { GoogleOuthToFirebaseToken } from "@/components/lib/auth/google";
import { toast, ToastPosition } from "@backpackapp-io/react-native-toast";

const screenWidth = Dimensions.get("window").width;

const webPlatform = Platform.OS === "web";

const SignUpScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const [errorPassword, setErrorPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const mutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      try {

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        toast("Check you email to verify your account.", {
          duration: 3000,
          styles: {
            view: { backgroundColor: Color.wadzzo, borderRadius: 8 },
          },
          position: ToastPosition.BOTTOM,

        });
        router.push("/Login");
        setLoading(false);

      } catch (error: unknown) {
        const err = error as AuthError;
        if (err.code == AuthErrorCodes.EMAIL_EXISTS) {
          toast("Email already exists!", {
            duration: 3000,
            styles: {
              view: { backgroundColor: Color.wadzzo, borderRadius: 8 },
            },
            position: ToastPosition.BOTTOM,

          });
          setLoading(false);

        } else {
          const errorMessage = err.code;
          if (errorMessage === AuthErrorCodes.INVALID_EMAIL) {
            toast("Invalid email!", {
              duration: 3000,
              styles: {
                view: { backgroundColor: Color.light.error, borderRadius: 8 },
                text: { color: 'white' }
              },
              position: ToastPosition.BOTTOM,
            });
          }
          else if (errorMessage === AuthErrorCodes.WEAK_PASSWORD) {
            toast("Weak password!", {
              duration: 3000,
              styles: {
                view: { backgroundColor: Color.light.error, borderRadius: 8 },
                text: { color: 'white' }
              },
              position: ToastPosition.BOTTOM,
            });
          }
          else if (errorMessage === AuthErrorCodes.INVALID_PASSWORD) {
            toast("Invalid password!", {
              duration: 3000,
              styles: {
                view: { backgroundColor: Color.light.error, borderRadius: 8 },
                text: { color: 'white' }
              },
              position: ToastPosition.BOTTOM,
            });
          }
          else {
            toast("Failed to create account", {
              duration: 3000,
              styles: {
                view: { backgroundColor: Color.light.error, borderRadius: 8 },
                text: { color: 'white' }
              },
              position: ToastPosition.BOTTOM,
            });
          }

          setLoading(false);

        }
      }

    },
    onError: (error) => {
      Alert.alert("Error", error.message);
      setLoading(false);
    },
  });

  const handleSignUp = () => {

    if (password !== confirmPassword) {
      setErrorPassword(true);
      return;
    }
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
                {
                  errorPassword && (
                    <Text style={{ color: "red" }}>
                      Password and Confirm Password do not match
                    </Text>
                  )
                }
                <Button
                  onPress={handleSignUp}
                  style={{
                    marginTop: 20,
                    backgroundColor: Color.wadzzo,
                  }}
                >
                  <Text style={{ color: "white" }}> Sign Up  </Text>       {loading && <ActivityIndicator color="white" size={12} />}
                </Button>

                <View style={styles.alreadyHaveAccountContainer}>
                  <Text style={styles.alreadyHaveAccountText}>
                    Already have an account?
                  </Text>
                  <Button style={{ backgroundColor: Color.light.inverseOnSurface, marginTop: 10 }} onPress={() => router.push("/Login")}>
                    <Text style={{
                      color: "black",
                    }} >Login</Text>
                  </Button>
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
