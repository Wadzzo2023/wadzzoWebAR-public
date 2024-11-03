import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useAuth } from "../Provider";
import { SignIn } from "../sign-in";
import { WalletType } from "../types";
import { FollowBrand } from "@api/routes/follow-brand";
import { submitSignedXDRToServer4User } from "@app/utils/submitSignedXDRtoServer4User";

export function AlbedoWebViewAuth({
  xdr,
  brandId,
}: {
  xdr?: string;
  brandId?: string;
}) {
  const [showWebView, setShowWebView] = useState(false);
  const webViewRef = useRef(null);
  const { login } = useAuth();

  const router = useRouter();

  // here to sing any xdr, just pass the xdrQueryParam
  // Generate a random token (similar to your original implementation)
  const generateToken = () => {
    return Math.random().toString(36).substring(2, 12);
  };

  // for login pass teh tokenQueryParam in the url
  const token = generateToken();

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "token") {
        // Handle successful authentication
        const { pubkey, signature } = data.res as {
          pubkey: string;
          signature: string;
        };

        const res = await SignIn({
          options: {
            walletType: WalletType.albedo,
            pubkey: pubkey,
            signature: signature,
            token: token,
          },
        });

        if (!res.ok) {
        } else {
          const setCookies = res.headers.get("set-cookie");
          // res.headers.forEach(console.log);
          if (setCookies) {
            login(setCookies);

            Alert.alert("Login sucessfull");
            router.back();
          }
        }
        // Verify and process the authentication
        // processAlbedoAuthentication(pubkey, signature);

        // Close the WebView
      } else if (data.type === "xdr") {
        // singed xdr.

        const { signed_envelope_xdr } = data.res as {
          signed_envelope_xdr: string;
        };

        if (brandId) {
          const res = await submitSignedXDRToServer4User(signed_envelope_xdr);
          if (res) {
            console.log(brandId, "brand_id");
            await FollowBrand({ brand_id: brandId });
            Alert.alert("Submitted the transection");
          } else {
            Alert.alert("Trust transaction failed");
          }
        }

        router.back();
      }
    } catch (error) {
      console.error("Error processing WebView message:", error);
      setShowWebView(false);
    }
  };

  function getParam() {
    if (xdr) {
      const xdrQeuryParam = new URLSearchParams({ xdr }).toString();
      return xdrQeuryParam;
    } else {
      const tokenQeuryParam = new URLSearchParams({ token }).toString();
      return tokenQeuryParam;
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{ uri: `https://app.wadzzo.com/albedo?${getParam()}` }}
        onMessage={handleWebViewMessage}
        // Optional: add loading indicator
        renderLoading={() => (
          <View>
            <Text>Loading authentication...</Text>
          </View>
        )}
        // Optional: handle any errors
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn("WebView error: ", nativeEvent);
        }}
        // Important security settings
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onConsoleLog={(event) => {
          console.log("WebView console:", event.nativeEvent.message);
        }}
      />
    </View>
  );
}
