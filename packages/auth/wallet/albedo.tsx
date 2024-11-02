import React, { useState, useRef } from "react";
import { View, Button, Alert, Text } from "react-native";
import { WebView } from "react-native-webview";
import { SignIn } from "../sign-in";
import { WalletType } from "../types";
import { useAuth } from "../Provider";
import { useRouter } from "expo-router";

// Albedo authentication function to generate HTML for popup
const createAlbedoAuthHTML = (token) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://unpkg.com/@albedo-link/intent/lib/albedo.intent.js"></script>
</head>
<body>
  <h1>Hello</h1>
  <button id="loginButton">Login</button>
  <script>
    //Override default window.open behavior
    window.open = function(url, target, features) {
      // Create modal div instead of new window
      const modal = document.createElement('div');
      modal.style = 'position:fixed; top:0; left:0; width:100%; height:100%; background:white; z-index:999;';
      
      const iframe = document.createElement('iframe'); 
      iframe.src = url;
      iframe.style = 'width:100%; height:100%; border:none;';
      
      modal.appendChild(iframe);
      document.body.appendChild(modal);
      
      return iframe.contentWindow; // Return iframe window object
    };

    console.log('Script started');

    window.onerror = function(msg, url, lineNo, columnNo, error) {
      console.log('Error: ' + msg);
      console.log('URL: ' + url);
      console.log('Line: ' + lineNo);
      console.log('Column: ' + columnNo);
      console.log('Error object: ' + JSON.stringify(error));
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'error',
        error: msg
      }));
    };

    document.getElementById("loginButton").addEventListener("click", function() {
      albedo.publicKey({
        token: '${token}',
      })
      .then((result) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'success',
          pubkey: result.pubkey,
          signature: result.signature
        }));
      })
      .catch((error) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error', 
          error: error.toString()
        }));
      });
    });
  </script>
</body>
</html>
`;

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

      if (data.type === "success") {
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
        setShowWebView(false);
      } else if (data.type === "error") {
        // Handle authentication error
        Alert.alert("Authentication Failed", data.error);
        setShowWebView(false);
      }
    } catch (error) {
      console.error("Error processing WebView message:", error);
      setShowWebView(false);
    }
  };

  const processAlbedoAuthentication = async (
    pubkey: string,
    signature: string
  ) => {
    try {
      // Implement your authentication logic here
      console.log("Authenticated Public Key:", pubkey);
      console.log("Signature:", signature);

      // Example: Send to your backend for verification
      // const response = await fetch('your-backend-endpoint', {
      //   method: 'POST',
      //   body: JSON.stringify({ pubkey, signature })
      // });

      Alert.alert("Login Successful", `Logged in with ${pubkey}`);
    } catch (error) {
      console.error("Authentication processing error:", error);
      Alert.alert("Authentication Error", "Could not complete login");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{ uri: "https://app.wadzzo.com" }}
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
