import { Stack } from "expo-router";

const CollectionLayout = () => {
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
export default CollectionLayout;
