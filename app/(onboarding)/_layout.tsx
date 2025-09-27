import { Stack } from "expo-router";

const Onboarding = () => {
    return (
        <Stack>
            <Stack.Screen options={{ headerShown: false }} name="SplashView" />
            <Stack.Screen options={{ headerShown: false }} name="CareView" />
            <Stack.Screen options={{ headerShown: false }} name="MoodDiaryView" />
            <Stack.Screen options={{ headerShown: false }} name="RelaxView" />
            <Stack.Screen options={{ headerShown: false }} name="WelcomeView" />
        </Stack>
    );
};
export default Onboarding;
