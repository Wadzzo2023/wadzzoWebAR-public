import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { AuthProvider } from "@auth/Provider";

import ModalProvider from "@/components/provider/modal-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Color } from "app/utils/Colors";
import merge from "deepmerge";
import { useColorScheme } from "react-native";
import {
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  adaptNavigationTheme, //1. Import this package
} from "react-native-paper";

import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
const customDarkTheme = { ...MD3DarkTheme, colors: Color.dark };
const customLightTheme = { ...MD3LightTheme, colors: Color.light };

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});
const CombinedLightTheme = merge(LightTheme, customLightTheme);
const CombinedDarkTheme = merge(DarkTheme, customDarkTheme);

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

export default function RootLayout() {
  let colorScheme = useColorScheme();
  console.log("colorScheme", colorScheme);
  const paperTheme =
    colorScheme === "dark" ? CombinedDarkTheme : CombinedLightTheme;
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PaperProvider theme={paperTheme}>
          <ModalProvider />
          <Stack
            initialRouteName="index"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="Login" />
            <Stack.Screen name="Signup" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </PaperProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
