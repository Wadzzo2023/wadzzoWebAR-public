import React from "react";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View } from "react-native";
const queryClient = new QueryClient();
import {
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  adaptNavigationTheme,
} from "react-native-paper";
import { Color } from "@app/utils/all-colors";
const customLightTheme = { ...MD3LightTheme, colors: Color.light };

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>{children}</PaperProvider>
    </QueryClientProvider>
  );
}
