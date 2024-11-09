import React, { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Color } from "app/utils/Colors";
// import { BASE_URL, CALLBACK_URL } from "@app/utils/constants/Common";
import { useMutation } from "@tanstack/react-query";

import { ActivityIndicator, Button } from "react-native-paper";

import { useRouter } from "next/router";
import { BASE_URL, CALLBACK_URL } from "@app/utils/Common";
import Image from "next/image";
import Wrapper from "@/components/Wrapper";
import { useAuth } from "@/components/provider/AuthProvider";
import { googleLogin } from "@/components/wallet_clients/google_login";
import { appleLogin } from "@/components/wallet_clients/apple_login";
import { albedoLogin } from "@/components/wallet_clients/albedo_login";

const LoginScreen = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const router = useRouter();
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const requestName = "api/auth/callback/credentials";
  const { isAuthenticated } = useAuth();
  const mutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      console.log("Login mutation called");
      const csrTokenRequest = await fetch(
        new URL("api/auth/csrf", BASE_URL).toString(),
        {
          credentials: "include",
        }
      );
      const csrTokenResponse = await csrTokenRequest.json();
      const csrfToken = csrTokenResponse.csrfToken;
      console.log("CSRF token:", csrfToken);
      console.log("Email:", email);
      console.log("Password", password);
      console.log("json", "true");
      console.log("walletType", "emailPass");

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
        console.log("response", await response.json());
        router.push("/(tabs)/map");
      }
    },
    onError: (error) => {
      console.log("Error", error);
      setError(true);
      setLoading(false);
    },
  });

  const handleLogin = () => {
    console.log("Login button clicked");
    mutation.mutate();
  };
  console.log("isAuthenticated", isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/(tabs)/map");
    }
  }, [isAuthenticated]);

  return (
    <Wrapper>
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
                    alt="Wadzzo"
                    height={100}
                    width={100}
                    src={"/assets/images/wadzzo.png"}
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
                  {/* <View style={styles.forgotPasswordContainer}>
                  <Text style={styles.forgotPasswordText}>
                    Forgot your password?
                  </Text>
                </View> */}
                  <Button
                    onPress={handleLogin}
                    style={{ backgroundColor: Color.wadzzo, marginTop: 20 }}
                    disabled={loading}
                  >
                    Login {loading && <ActivityIndicator size={12} />}
                  </Button>

                  {/* <View style={styles.newAccountContainer}>
                    <Text style={styles.newAccountText}>New here?</Text>
                    <Button>Create an account</Button>
                  </View> */}
                  <View style={styles.socialContainer}>
                    <TouchableOpacity onPress={async () => await googleLogin()}>
                      <View style={styles.login_social_button}>
                        <Image
                          height={30}
                          width={30}
                          alt="google"
                          style={styles.login_social_icon}
                          src="/assets/icons/google.png"
                        />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={async () => await appleLogin()}>
                      <View style={styles.login_social_button}>
                        <Image
                          height={30}
                          width={30}
                          alt="google"
                          style={styles.login_social_icon}
                          src="/assets/icons/apple.png"
                        />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={async () => await albedoLogin()}>
                      <View style={styles.login_social_button}>
                        <Image
                          height={30}
                          width={30}
                          alt="albedo"
                          style={styles.login_social_icon}
                          src="/assets/icons/albedo.png"
                        />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
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
  mainContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#f7fafc",
  },
  container: {
    flex: 1,
    width: "100%",
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
