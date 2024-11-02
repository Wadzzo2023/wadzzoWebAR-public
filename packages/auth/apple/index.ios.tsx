import * as AppleAuthentication from "expo-apple-authentication";
import { View, StyleSheet, Button } from "react-native";
import { getAuth, signInWithCredential, OAuthProvider } from "firebase/auth";
import { auth } from "../config";
import { SignIn } from "../sign-in";
import { WalletType } from "../types";
import { useAuth } from "../Provider";

export function AppleLogin() {
  const { login } = useAuth();
  async function appleLogin() {
    try {
      const appleCredential = {
        identityToken:
          "eyJraWQiOiJUOHRJSjF6U3JPIiwiYWxnIjoiUlMyNTYifQ.eyJpc3MiOiJodHRwczovL2FwcGxlaWQuYXBwbGUuY29tIiwiYXVkIjoiaG9zdC5leHAuRXhwb25lbnQiLCJleHAiOjE3MzA1NzIxMzIsImlhdCI6MTczMDQ4NTczMiwic3ViIjoiMDAwNTk1LmM5YmVmMDBlYzU1ZDQ3ZTY4YWM2OTk0MTA0Y2FhZjY0LjE3MTgiLCJub25jZSI6InJsbHg1MjBhIiwiY19oYXNoIjoiLXd6ZFlIamY2THl6V1BWU1NpQk5DZyIsImVtYWlsIjoibXhoYzU3bWRnZkBwcml2YXRlcmVsYXkuYXBwbGVpZC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNfcHJpdmF0ZV9lbWFpbCI6dHJ1ZSwiYXV0aF90aW1lIjoxNzMwNDg1NzMyLCJub25jZV9zdXBwb3J0ZWQiOnRydWV9.paR3DSA967OZTLm_Bhb9BnBvs9Ftq3O61iwYdkGueHN1flVTU8kJX2ghuOSKu-x3gIOZWjs2urQXbX--zvvLgifwF5CcIFalOKh9l1F22K7eM4sjePaDlKC_otj2YIFXyBji1X0hnE_e6YVhmouJ-MPh62uK-kjhBOxiUJQZFHaeHJ8P0wjpXSmcZHl3uvSFD7U3D0zYJdPTE6K03tDW_ICF6wB8HJyT31g9Xx_36vCiwjR8S2SEK5himPXCBS3sICSDlivpbpK9EvrFsLIHHElituqAyjJBUH1l_AaLnBld7IRnKEe3yThwm6Z2NkZvI8XUwzG8_1uE0QT751Ssrw",
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
    <View style={styles.container}>
      <Button title="Login" onPress={appleLogin} />
      {/* <AppleAuthentication.AppleAuthenticationButton
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
            // signed in
          } catch (e) {
            if (e.code === "ERR_REQUEST_CANCELED") {
              // handle that the user canceled the sign-in flow
            } else {
              // handle other errors
            }
          }
        }}
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: 200,
    height: 44,
  },
});
