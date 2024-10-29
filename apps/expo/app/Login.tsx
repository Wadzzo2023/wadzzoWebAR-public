import React, { useEffect } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Color } from "@/constants/Colors";
import { BASE_URL, CALLBACK_URL } from "@/constants/Common";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ActivityIndicator, Button } from "react-native-paper";

import { makeRedirectUri } from "expo-auth-session";

const webPlatform = Platform.OS === "web";

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const router = useRouter();
  const [error, setError] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId:
      "443284916220-d9idlov4ms8ft9otro9kk9ae7i3kq3t6.apps.googleusercontent.com",

    // clientId:
    //   "443284916220-l3qg7qu1klpfvph43q35p9u76kf3fkqt.apps.googleusercontent.com",

    redirectUri: makeRedirectUri({
      path: "(tabs)",
      isTripleSlashed: true,
    }),
  });

  async function handleSignInWithGoogle() {
    console.log(response);
    if (response?.type === "success") {
      const { authentication } = response;
      console.log(authentication);
    }
    // const user = await AsyncStorage.getItem("@user");
    // if (!user) {
    //   if (response?.type === "success") {
    //     await getUserinfo(response.authentication?.accessToken);
    //   }
    // } else {
    //   setUserInfo(JSON.stringify(response));
    // }
  }

  const getUserinfo = async (token?: string) => {
    if (!token) return;
    try {
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const user = await response.json();
      await AsyncStorage.setItem("@user", JSON.stringify(user));
      setUserInfo(JSON.stringify(user));
    } catch (error) {}
  };

  const requestName = "api/auth/callback/credentials";

  const mutation = useMutation({
    mutationFn: async () => {
      setLoading(true);

      const csrTokenRequest = await fetch(
        new URL("api/auth/csrf", BASE_URL).toString()
      );
      const csrTokenResponse = await csrTokenRequest.json();
      const csrfToken = csrTokenResponse.csrfToken;

      const response = await fetch(new URL(requestName, BASE_URL).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email,
          password,
          csrfToken: csrfToken,
          callbackUrl: CALLBACK_URL,
          walletType: "emailPass",
          json: "true",
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        setError(true);
        setLoading(false);
        throw new Error(error.message);
      } else {
        router.push("/(tabs)/");
      }
    },
    onError: (error) => {
      setError(true);
      setLoading(false);
    },
  });

  const handleLogin = () => {
    mutation.mutate();
  };

  useEffect(() => {
    handleSignInWithGoogle();
  }, [response]);
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
                  Login to your account to collect and earn rewards
                </Text>
              </View>
              <View style={styles.inputContainer}>
                {error && (
                  <Text
                    style={{
                      textAlign: "left",
                      color: "red",
                    }}
                  >
                    Invalid credentials!!
                  </Text>
                )}
                <TextInput
                  value={email}
                  onChangeText={(text) => setEmail(text)}
                  placeholder="Email"
                  style={styles.input}
                />
                <TextInput
                  value={password}
                  onChangeText={(text) => setPassword(text)}
                  placeholder="Password"
                  secureTextEntry
                  style={styles.input}
                />
                <View style={styles.forgotPasswordContainer}>
                  <Text style={styles.forgotPasswordText}>
                    Forgot your password?
                  </Text>
                </View>
                <Button
                  onPress={handleLogin}
                  style={{ backgroundColor: Color.wadzzo }}
                  disabled={loading}
                >
                  Login {loading && <ActivityIndicator size={12} />}
                </Button>
                <View>
                  <Button
                    onPress={() => promptAsync()}
                    style={{ backgroundColor: Color.wadzzo }}
                  >
                    Continue with Google
                  </Button>
                </View>

                <View style={styles.newAccountContainer}>
                  <Text style={styles.newAccountText}>New here?</Text>
                  <Button onPress={() => router.push("/Signup")}>
                    Create an account
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
    paddingLeft: 8,
  },
  forgotPasswordContainer: {
    padding: 8,
    alignItems: "flex-end",
  },
  forgotPasswordText: {
    textDecorationLine: "underline",
    fontSize: 12,
    color: "#4A5568", // Gray-600
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
  newAccountContainer: {
    flex: 1,
    padding: 8,
    width: "100%",
    marginTop: 20,
    flexDirection: "column",
    justifyContent: "center",
  },
  newAccountText: {
    width: "100%",
    textAlign: "center",
  },
  createAccountText: {
    color: "#3b82f6", // Blue-500
    textDecorationLine: "underline",
  },
});

export default LoginScreen;
