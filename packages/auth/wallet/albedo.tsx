import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useAuth } from "../Provider";
import { SignIn } from "../sign-in";
import { WalletType } from "../types";

export function AlbedoWebViewAuth() {
  const [showWebView, setShowWebView] = useState(false);
  const webViewRef = useRef(null);
  const { login } = useAuth();

  const router = useRouter();

  // Generate a random token (similar to your original implementation)
  const generateToken = () => {
    return Math.random().toString(36).substring(2, 12);
  };

  const handleAlbedoLogin = () => {
    const token = generateToken();
    setShowWebView(true);
  };

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
            token: "vongCong",
          },
        });

        if (!res.ok) {
        } else {
          const setCookies = res.headers.get("set-cookie");
          if (setCookies) {
            login({ email: "vong", id: "vo" }, setCookies);

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

        Alert.alert("Submit the transection", data.error);
        router.back();
      }
    } catch (error) {
      console.error("Error processing WebView message:", error);
      setShowWebView(false);
    }
  };

  // here to sing any xdr, just pass the xdrQueryParam

  const xdr =
    "AAAAALPZeTF820NFDKBqBJo0dpb99l+TZnWIgxf3Y7k7hfVxAAAFeACPVIQAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAACGtsbDMyNDIzAAAADgAAAAAAAAAAAAAAALPZeTF820NFDKBqBJo0dpb99l+TZnWIgxf3Y7k7hfVxAAAAAAL68IAAAAABAAAAALPZeTF820NFDKBqBJo0dpb99l+TZnWIgxf3Y7k7hfVxAAAAAQAAAACz2XkxfNtDRQygagSaNHaW/fZfk2Z1iIMX92O5O4X1cQAAAAAAAAAAAJiWgAAAAAAAAAACAAAAAURERAAAAAAAs9l5MXzbQ0UMoGoEmjR2lv32X5NmdYiDF/djuTuF9XEAAAAAAvrwgAAAAACz2XkxfNtDRQygagSaNHaW/fZfk2Z1iIMX92O5O4X1cQAAAAJra2trawAAAAAAAAAAAAAAs9l5MXzbQ0UMoGoEmjR2lv32X5NmdYiDF/djuTuF9XEAAAAABycOAAAAAAEAAAAAAAAAAAAAAAMAAAAAAAAAAUREAAAAAAAAs9l5MXzbQ0UMoGoEmjR2lv32X5NmdYiDF/djuTuF9XEAAAAAIFNYSAAAAAwAAAABAAAAAAAAAAAAAAABAAAAALPZeTF820NFDKBqBJo0dpb99l+TZnWIgxf3Y7k7hfVxAAAAAwAAAAAAAAACREREREQAAAAAAAAAAAAAALPZeTF820NFDKBqBJo0dpb99l+TZnWIgxf3Y7k7hfVxAAAAAAAAAAAAAAABAAAAAQAAAAAAAAB7AAAAAAAAAAQAAAAAAAAAAVVTRAAAAAAAs9l5MXzbQ0UMoGoEmjR2lv32X5NmdYiDF/djuTuF9XEAAAAAAJiWgAAAAAEAAAABAAAAAQAAAACz2XkxfNtDRQygagSaNHaW/fZfk2Z1iIMX92O5O4X1cQAAAAUAAAABAAAAALPZeTF820NFDKBqBJo0dpb99l+TZnWIgxf3Y7k7hfVxAAAAAQAAAAIAAAABAAAAAQAAAAEAAAAEAAAAAQAAAAIAAAABAAAAAgAAAAEAAAACAAAAAQAAAAtleGFtcGxlLmNvbQAAAAABAAAAALPZeTF820NFDKBqBJo0dpb99l+TZnWIgxf3Y7k7hfVxAAAABAAAAAAAAAAGAAAAAUZGAAAAAAAAs9l5MXzbQ0UMoGoEmjR2lv32X5NmdYiDF/djuTuF9XF//////////wAAAAEAAAAAs9l5MXzbQ0UMoGoEmjR2lv32X5NmdYiDF/djuTuF9XEAAAAHAAAAALPZeTF820NFDKBqBJo0dpb99l+TZnWIgxf3Y7k7hfVxAAAAAURERAAAAAAAAAAAAAAAAAcAAAAAs9l5MXzbQ0UMoGoEmjR2lv32X5NmdYiDF/djuTuF9XEAAAABVVNEAAAAAAEAAAAAAAAACAAAAACz2XkxfNtDRQygagSaNHaW/fZfk2Z1iIMX92O5O4X1cQAAAAAAAAAJAAAAAAAAAAoAAAACZGQAAAAAAAEAAAACdnYAAAAAAAAAAAAKAAAAAmtrAAAAAAAAAAAAAAAAAAA=";
  const xdrQeuryParam = new URLSearchParams({ xdr }).toString();

  // for login pass teh tokenQueryParam in the url
  const token = "vongCong";
  const tokenQeuryParam = new URLSearchParams({ token }).toString();

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{ uri: `https://app.wadzzo.com/albedo?${tokenQeuryParam}` }}
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
