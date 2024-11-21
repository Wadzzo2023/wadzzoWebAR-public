import React, { useEffect } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useMutation } from "@tanstack/react-query";

import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ActivityIndicator, Button, TextInput } from "react-native-paper";

import { makeRedirectUri } from "expo-auth-session";
import { useAuth } from "../components/lib/auth/Provider";
import { GoogleOuthToFirebaseToken } from "../components/lib/auth/google";
import { WalletType } from "../components/lib/auth/types";
import { SignIn } from "../components/lib/auth/sign-in";
import { BASE_URL, CALLBACK_URL } from "../components/utils/Common";
import { Color } from "../components/utils/all-colors";
import { AppleLogin } from "../components/lib/auth/apple/index.ios";

const webPlatform = Platform.OS === "web";

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const router = useRouter();
  const [error, setError] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [token, setTokens] = React.useState<{
    idToken: string;
    accessToken: string;
  }>();

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId:
      "443284916220-osvpbndj71un7c4s2skn5nglku1ih30e.apps.googleusercontent.com",

    iosClientId:
      "443284916220-0o3tqbeeksf9thva9idge4psar2dmi58.apps.googleusercontent.com",
    // clientId:
    //   "443284916220-l3qg7qu1klpfvph43q35p9u76kf3fkqt.apps.googleusercontent.com",

    redirectUri: makeRedirectUri({
      path: "Login",
      scheme: "com.thebillboardapp.wadzzo",
      isTripleSlashed: true,
    }),
  });

  async function handleSignInWithGoogle() {
    if (response?.type === "success") {
      const { authentication } = response;

      if (authentication?.idToken && authentication.accessToken) {
        setTokens({
          accessToken: authentication.accessToken,
          idToken: authentication.idToken,
        });
        googleMutation.mutate({
          idToken: authentication.idToken,
          accessToken: authentication.accessToken,
        });
      } else {
        // // console.log("no authentication ");
      }
    }
    // // console.log(response);
  }

  const requestName = "api/auth/callback/credentials";

  const googleMutation = useMutation({
    mutationFn: async (token: { idToken: string; accessToken: string }) => {
      setGoogleLoading(true);

      const firebaseToken = await GoogleOuthToFirebaseToken(
        token.idToken,
        token.accessToken
      );

      const response = await SignIn({
        options: {
          email: firebaseToken.email,
          walletType: WalletType.google,
          token: firebaseToken.firebaseToken,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        // // console.log("Err",error)
        setError(true);
        setGoogleLoading(false);
        throw new Error(error.message);
      } else {
        const setCookies = response.headers.get("set-cookie");
        // // console.log(setCookies)
        if (setCookies) {
          login(setCookies);
        }

        setGoogleLoading(false);
      }
    },
    onError: (error) => {
      setError(true);
      setGoogleLoading(false);
    },
  });

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
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        setError(true);
        setLoading(false);
        throw new Error(error.message);
      } else {
        const setCookies = response.headers.get("set-cookie");
        if (setCookies) {
          login(setCookies);
        }
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

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)/");
    }
  }, [isAuthenticated]);

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
                  mode="outlined"
                  value={email}
                  onChangeText={(text) => setEmail(text)}
                  placeholder="Email"
                  style={styles.input}
                />
                <TextInput
                  value={password}
                  mode="outlined"
                  onChangeText={(text) => setPassword(text)}
                  placeholder="Password"
                  secureTextEntry
                  style={styles.input}
                />

                {/* <View style={styles.forgotPasswordContainer}>
                  <Text style={styles.forgotPasswordText}>
                    Forgot your password?
                  </Text>
                </View> */}
                <Button
                  onPress={handleLogin}
                  style={{ backgroundColor: Color.wadzzo, marginTop: 10 }}
                  disabled={loading}
                >
                  <Text style={{ color: "white" }}> Login </Text>
                  {loading && <ActivityIndicator color="white" size={12} />}
                </Button>

                <View style={styles.socialContainer}>
                  <TouchableOpacity
                    disabled={googleMutation.isPending}
                    onPress={async () => await promptAsync()}
                  >
                    <View style={styles.login_social_button}>
                      {googleMutation.isPending ? (
                        <ActivityIndicator size={12} />
                      ) : (
                        <Image
                          style={styles.login_social_icon}
                          source={require("../assets/icons/google.png")}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                  {Platform.OS === "ios" && <AppleLogin />}
                  <TouchableOpacity
                    onPress={() => {
                      router.push("/albedo");
                    }}
                  >
                    <View style={styles.login_social_button}>
                      <Image
                        style={styles.login_social_icon}
                        source={require("../assets/icons/albedo.png")}
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* <View style={styles.newAccountContainer}>
                  <Text style={styles.newAccountText}>New here?</Text>
                  <Button onPress={() => router.push("/Signup")}>
                    Create an account
                  </Button>
                </View> */}
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
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  login_social_button: {
    margin: 10,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
  },
  login_social_icon: {
    width: 30,
    height: 30,
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
