import { Stack } from "expo-router";

const AuthLayout = () => {
    return (
        <Stack>
            <Stack.Screen options={{ headerShown: false }} name="login" />
            <Stack.Screen options={{ headerShown: false }} name="register" />
            {/* <Stack.Screen options={{ headerShown: false }} name="(tabs)" /> */}

        </Stack>
    );
};
export default AuthLayout;
