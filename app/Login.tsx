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
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ActivityIndicator, Button, TextInput } from "react-native-paper";
import { makeRedirectUri } from "expo-auth-session";
import { useAuth } from "../components/lib/auth/Provider";
import { GoogleOuthToFirebaseToken } from "../components/lib/auth/google";
import { WalletType } from "../components/lib/auth/types";
import { SignIn } from "../components/lib/auth/sign-in";
import { BASE_URL, CALLBACK_URL, USER_ACCOUNT_URL, USER_ACCOUNT_XDR_URL } from "../components/utils/Common";
import { Color } from "../components/utils/all-colors";
import { AppleLogin } from "../components/lib/auth/apple/index.ios";
import { toast, ToastPosition } from "@backpackapp-io/react-native-toast";
import { set, z } from "zod";
import axios from "axios";
import { submitActiveAcountXdr } from "@/components/utils/submitActiveAccountXDR";
import { getUser } from "./api/routes/get-user";
import base64 from "react-native-base64";
import { submitSignedXDRToServer4User } from "@/components/utils/submitSignedXDRtoServer4User";
import { AuthErrorCodes } from "firebase/auth";
const webPlatform = Platform.OS === "web";
export const extraSchema = z.object({
  isAccActive: z.boolean(),
  xdr: z.string().optional(),
});

export const getPublicKeyAPISchema = z.object({
  publicKey: z.string().min(56),
  extra: extraSchema,
});

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const router = useRouter();
  const [error, setError] = React.useState(false);
  const [verifyEmail, setVerifyEmail] = React.useState(false);
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
      console.log(firebaseToken);
      const response = await SignIn({
        options: {
          email: firebaseToken.email,
          walletType: WalletType.google,
          token: firebaseToken.firebaseToken,
        },
      });
      console.log(response);
      if (!response.ok) {
        const error = await response.json();
        // // console.log("Err",error)
        setError(true);
        setGoogleLoading(false);
        throw new Error(error.message);
      } else {



        const setCookies = response.headers.get("set-cookie");
        // console.log(setCookies)
        if (setCookies) {
          login(setCookies);
        }
        const decode = base64.decode(firebaseToken.firebaseToken.split(".")[1]);
        const uid = extractUIDToken(decode);
        const user = await getUser();
        const res = await toast.promise(
          axios.get(USER_ACCOUNT_URL, {
            params: {
              uid: uid,
              email: firebaseToken.email,
            },
          }),
          {
            loading: "Getting public key...",
            success: "Received public key",
            error: "Unable to get public key",
          },

        );
        console.log(res.data);
        const { publicKey, extra } = await getPublicKeyAPISchema.parseAsync(
          res.data,
        );
        await submitActiveAcountXdr(extra);


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
        const errorString = new URL(error.url).searchParams.get("error")
        console.log(errorString);
        if (errorString?.includes(AuthErrorCodes.USER_DELETED)) {
          toast("User not found!", {
            duration: 3000,
            position: ToastPosition.BOTTOM,
            styles: {
              view: { backgroundColor: Color.light.error, borderRadius: 8 },
              text: { color: 'white' }
            },
          });
        }
        else if (errorString?.includes(AuthErrorCodes.INVALID_EMAIL)) {
          toast("Invalid Email!", {
            duration: 3000,
            position: ToastPosition.BOTTOM,
            styles: {
              view: { backgroundColor: Color.light.error, borderRadius: 8 },
              text: { color: 'white' }
            },
          });
        }

        else if (errorString?.includes(AuthErrorCodes.INVALID_PASSWORD)) {
          setError(true);
          toast("Invalid Credentials.", {
            duration: 3000,
            position: ToastPosition.BOTTOM,
            styles: {
              view: { backgroundColor: Color.light.error, borderRadius: 8 },
              text: { color: 'white' }
            },
          });

        } else if (errorString?.includes("Email is not verified")) {
          toast("Email is not verified! Check your email.", {
            duration: 3000,
            position: ToastPosition.BOTTOM,
            styles: {
              view: { backgroundColor: Color.light.error, borderRadius: 8 },
              text: { color: 'white' }
            },
          });

        } else {
          toast("Something went wrong! Please contact with admin.", {
            duration: 3000,
            position: ToastPosition.BOTTOM,
            styles: {
              view: { backgroundColor: Color.light.error, borderRadius: 8 },
              text: { color: 'white' }
            },
          });
        }
        setLoading(false);
      } else {
        const setCookies = response.headers.get("set-cookie");
        if (setCookies) {
          login(setCookies);
        }
        const res = await toast.promise(
          axios.get(USER_ACCOUNT_XDR_URL, {
            params: {
              email: email,
            },
          }),
          {
            loading: "Getting public key...",
            success: "Received public key",
            error: "Unable to get public key",
          },

        );
        console.log(res.data);
        const xdr = res.data.xdr as string;
        if (xdr) {
          // console.log(xdr, "xdr");
          const res = await toast.promise(
            submitSignedXDRToServer4User(xdr),
            {
              loading: "Activating account...",
              success: "Request completed successfully",
              error: "While activating account error happened, Try again later",
            },
          );

          if (res) {
            toast.success("Account activated");
          } else {
            toast.error("Account activation failed");
          }
        }
        setLoading(false);
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
                  inputMode="email"
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

                <Link href={"/forget-password"} style={styles.forgotPasswordContainer}>
                  <Text style={styles.forgotPasswordText}>
                    Forgot your password?
                  </Text>
                </Link>
                <Button
                  onPress={handleLogin}
                  style={{ backgroundColor: Color.wadzzo, marginTop: 10 }}
                  disabled={loading}
                >
                  <Text style={{ color: "white" }}> Login </Text>
                  {loading && <ActivityIndicator color="white" size={12} />}
                </Button>

                <View style={styles.socialLoginContainer}>
                  <View style={styles.socialButtonsContainer}>
                    <TouchableOpacity
                      style={styles.socialButton}
                      disabled={googleMutation.isPending}
                      onPress={async () => await promptAsync()}
                    >
                      <Image
                        style={styles.socialIcon}
                        source={require("../assets/icons/google.png")}
                      />
                      <Text style={styles.socialButtonText}>Continue with Google</Text>
                      {googleMutation.isPending && (
                        <ActivityIndicator size={16} color={Color.wadzzo} style={styles.loader} />
                      )}
                    </TouchableOpacity>
                    {
                      Platform.OS === 'ios' && <AppleLogin />
                    }
                    {/* <AppleLogin style={styles.socialButton}>
                      <Image
                        style={styles.socialIcon}
                        source={require("../assets/icons/apple.png")}
                      />
                      <Text style={styles.socialButtonText}>Continue with Apple</Text>
                    </AppleLogin> */}

                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => {
                        router.push("/albedo");
                      }}
                    >
                      <Image
                        style={styles.socialIcon}
                        source={require("../assets/icons/albedo.png")}
                      />
                      <Text style={styles.socialButtonText}>Continue with Albedo</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.newAccountContainer}>
                  <Text style={styles.newAccountText}>New here?</Text>
                  <Button style={{ backgroundColor: Color.light.inverseOnSurface, marginTop: 10 }} onPress={() => router.push("/Signup")}>
                    <Text style={{
                      color: "black",
                    }}>Create an account</Text>
                  </Button>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView >
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
    textAlign: "right",
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
  socialLoginContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  socialLoginText: {
    fontSize: 14,
    color: Color.light.onSurface,
    marginBottom: 16,
  },
  socialButtonsContainer: {
    width: '100%',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.light.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  socialButtonText: {
    flex: 1,
    fontSize: 16,
    color: Color.light.onSurface,
  },
  loader: {
    marginLeft: 8,
  },
});

export default LoginScreen;

function extractUIDToken(decodedToken: string): string | null {
  try {
    // Remove any whitespace
    const cleanToken = decodedToken.trim();

    // Find the start and end of the email field
    const uidStartIndex = cleanToken.indexOf('"user_id":"');
    if (uidStartIndex === -1) return null;

    // Calculate the actual start of the email value
    const uidValueStart = uidStartIndex + '"user_id":"'.length;

    // Find the end of the email value (look for next ")
    const uidEndIndex = cleanToken.indexOf('"', uidValueStart);
    if (uidEndIndex === -1) return null;

    // Extract the email
    const email = cleanToken.substring(uidValueStart, uidEndIndex);

    return email;
  } catch (error) {
    console.error("Error extracting email:", error);
    return null;
  }
}
