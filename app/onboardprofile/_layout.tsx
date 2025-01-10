import { Stack } from "expo-router";

const onboardProfile = () => {
    return (
        <Stack>
            <Stack.Screen options={{ headerShown: false }} name="index" />

        </Stack>
    );
};
export default onboardProfile;
