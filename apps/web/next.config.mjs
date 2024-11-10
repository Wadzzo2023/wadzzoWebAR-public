/** @type {import('next').NextConfig} */
import { withExpo } from "@expo/next-adapter";

import withFonts from "next-fonts";

const nextConfig = withExpo(
  // withImages(
  withFonts({
    reactStrictMode: true,

    transpilePackages: [
      // NOTE: you need to list `react-native` because `react-native-web` is aliased to `react-native`.
      "react-native",
      "react-native-web",
      "ui",
      "app",
      "react-native-render-html",
      "react-native-paper",
      "react-native-vector-icons",
      "react-native-safe-area-context",
      "react-native-svg",

      // Add other packages that need transpiling
    ],
    images: {
      domains: ["utfs.io", "app.wadzzo.com"], // Add the domain here
    },
    webpack: (config) => {
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        // Transform all direct `react-native` imports to `react-native-web`
        "react-native$": "react-native-web",
        "react-native/Libraries/Image/AssetRegistry":
          "react-native-web/dist/cjs/modules/AssetRegistry", // Fix for loading images in web builds with Expo-Image
      };
      config.resolve.extensions = [
        ".web.js",
        ".web.jsx",
        ".web.ts",
        ".web.tsx",
        ...config.resolve.extensions,
      ];
      return config;
    },
  })

  // )
);

export default nextConfig;
