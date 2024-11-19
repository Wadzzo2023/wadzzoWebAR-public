import * as AppleAuthentication from "expo-apple-authentication";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import base64 from "react-native-base64";
import { useAuth } from "../Provider";
import { SignIn } from "../sign-in";
import { WalletType } from "../types";

export function AppleLogin() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  async function appleLogin(identityToken: string, email: string) {
    try {
      const appleCredential = {
        identityToken: identityToken,
        email: email,
      };

      const res = await SignIn({
        options: {
          walletType: WalletType.apple,
          email: appleCredential.email,
          appleToken: appleCredential.identityToken,
        },
      });

      if (!res.ok) {
        console.log("no ok");
      } else {
        const setCookies = res.headers.get("set-cookie");
        if (setCookies) {
          login(setCookies);
        }
      }
    } catch (e) {
      console.log("e", e);
    }
  }
  return (
    <TouchableOpacity
      onPress={async () => {
        try {
          setLoading(true);
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });
          console.log("credential", credential);
          if (credential.email?.match("privaterelay.appleid.com")) {
            Alert.alert(
              "Email Required",
              "Please allow email sharing to continue."
            );
            setLoading(false);
            return;
          }

          if (credential.identityToken && credential.email) {
            await appleLogin(credential.identityToken, credential.email);
            setLoading(false);
          } else if (credential.identityToken) {
            const decodedToken = base64.decode(
              credential.identityToken.split(".")[1] ?? ""
            );
            const email = extractEmailFromToken(decodedToken);
            if (!email) {
              Alert.alert("Email is must");
              setLoading(false);
              return;
            }
            await appleLogin(credential.identityToken, email);
          } else {
            setLoading(false);
            Alert.alert("Error", "Apple login failed");
          }
          setLoading(false);
        } catch (e) {
          if (e.code === "ERR_REQUEST_CANCELED") {
            Alert.alert("User cancelled login");
            setLoading(false);
          } else {
            Alert.alert("Error", e.message);
            setLoading(false);
          }
        }
      }}
    >
      <View style={styles.login_social_button}>
        {loading ? (
          <ActivityIndicator size="small" color={"green"} />
        ) : (
          <Image
            style={styles.login_social_icon}
            source={require("../../../../assets/icons/apple.png")}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "80%",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    color: "white",
    shadowRadius: 3.5,
    shadowOffset: { width: 0, height: 2 },
    marginTop: 20,
  },
  buttonText: {
    textAlign: "center",
    color: "white",
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
});
function extractEmailFromToken(decodedToken: string): string | null {
  try {
    // Remove any whitespace
    const cleanToken = decodedToken.trim();

    // Find the start and end of the email field
    const emailStartIndex = cleanToken.indexOf('"email":"');
    if (emailStartIndex === -1) return null;

    // Calculate the actual start of the email value
    const emailValueStart = emailStartIndex + '"email":"'.length;

    // Find the end of the email value (look for next ")
    const emailEndIndex = cleanToken.indexOf('"', emailValueStart);
    if (emailEndIndex === -1) return null;

    // Extract the email
    const email = cleanToken.substring(emailValueStart, emailEndIndex);

    return email;
  } catch (error) {
    console.error("Error extracting email:", error);
    return null;
  }
}
