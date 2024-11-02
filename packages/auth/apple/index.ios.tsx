import * as AppleAuthentication from "expo-apple-authentication";
import { View, StyleSheet, Button, Alert } from "react-native";
import { getAuth, signInWithCredential, OAuthProvider } from "firebase/auth";
import { auth } from "../config";
import { SignIn } from "../sign-in";
import { WalletType } from "../types";
import { useAuth } from "../Provider";

export function AppleLogin() {
  const { login } = useAuth();
  async function appleLogin(identityToken: string) {
    try {
      const appleCredential = {
        identityToken: identityToken,
      };

      const res = await SignIn({
        options: {
          walletType: WalletType.apple,
          appleToken: appleCredential.identityToken,
        },
      });

      if (!res.ok) {
        console.log("no ok");
      } else {
        const setCookies = res.headers.get("set-cookie");
        if (setCookies) {
          login(
            { email: "firebaseToken.email", id: "firebaseToken.firebaseToken" },
            setCookies
          );
        }
      }
    } catch (e) {
      console.log("e", e);
    }
  }
  return (
    <View>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={5}
        style={styles.button}
        onPress={async () => {
          try {
            const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            });
            const login = await appleLogin(credential.identityToken!);
          } catch (e) {
            if (e.code === "ERR_REQUEST_CANCELED") {
              Alert.alert("User cancelled login");
            } else {
              Alert.alert("Error", e.message);
            }
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
