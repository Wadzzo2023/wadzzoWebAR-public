import { Stack } from "expo-router";

const QRLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen options={{ headerShown: false }} name="index" />
    </Stack>
  );
};
export default QRLayout;
