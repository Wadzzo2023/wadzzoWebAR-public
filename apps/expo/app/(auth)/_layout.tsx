import { Stack } from "expo-router";

const authLayout = () => {
  return (
    <Stack>
      <Stack.Screen options={{ headerShown: false }} name="Login" />
      <Stack.Screen name="Signup" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
};
export default authLayout;
