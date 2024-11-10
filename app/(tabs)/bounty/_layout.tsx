import { Stack } from "expo-router";

const BountyLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
};
export default BountyLayout;
