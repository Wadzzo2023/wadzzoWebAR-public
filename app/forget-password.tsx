import { auth } from "@/components/lib/auth/config";
import { Color } from "@/components/utils/all-colors";
import { toast, ToastPosition } from "@backpackapp-io/react-native-toast";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useEffect } from "react";
import {
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ActivityIndicator, Button, TextInput } from "react-native-paper";
const webPlatform = Platform.OS === "web";


const ForgetPassword = () => {

    const [loading, setLoading] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const router = useRouter();
    const handleLogin = async () => {
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            toast("Check you email to reset your password.", {
                duration: 3000,
                position: ToastPosition.BOTTOM,
                styles: {
                    view: { backgroundColor: Color.wadzzo, borderRadius: 8 },
                },
            });
        } catch (error) {
            toast("Failed to reset password", {
                duration: 3000,
                position: ToastPosition.BOTTOM,
                styles: {
                    view: { backgroundColor: Color.light.error, borderRadius: 8 },
                },
            });

        }
        setLoading(false);
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.mainContainer}>
                <View style={styles.container}>
                    <View style={styles.card}>
                        <View style={styles.rotatedCardBlue} />
                        <View
                            style={[
                                styles.rotatedCardColor,
                                { backgroundColor: Color.wadzzo },
                            ]}
                        />
                        <View style={styles.innerContainer}>
                            <View style={styles.logoContainer}>
                                <Image
                                    source={require("../assets/images/wadzzo.png")}
                                    style={styles.logo}
                                />
                                <Text style={styles.loginText}>
                                    Login to your account to collect and earn rewards
                                </Text>
                            </View>
                            <View style={styles.inputContainer}>

                                <TextInput
                                    mode="outlined"
                                    value={email}
                                    onChangeText={(text) => setEmail(text)}
                                    placeholder="Email"
                                    style={styles.input}
                                />



                                <Button
                                    onPress={handleLogin}
                                    style={{ backgroundColor: Color.wadzzo, marginTop: 10 }}
                                    disabled={loading}
                                >
                                    <Text style={{ color: "white" }}> Send </Text>
                                    {loading && <ActivityIndicator color="white" size={12} />}
                                </Button>



                                <View style={styles.newAccountContainer}>
                                    <Text style={styles.newAccountText}>Already have an account?</Text>
                                    <Button style={{ backgroundColor: Color.light.inverseOnSurface, marginTop: 10 }} onPress={() => router.push("/Login")}>
                                        <Text style={{
                                            color: "black",
                                        }}>Login</Text>
                                    </Button>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView >
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
    },
    mainContainer: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#f7fafc",
    },
    container: {
        flex: 1,
        width: webPlatform ? 500 : "100%",
        padding: 10,
        justifyContent: "center",
        fontFamily: "sans-serif",
    },
    socialContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    login_social_button: {
        margin: 10,
        width: 60,
        height: 60,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 30,
    },
    login_social_icon: {
        width: 30,
        height: 30,
    },
    card: {
        position: "relative",
        backgroundColor: "#f7fafc", // Gray-100
    },
    rotatedCardBlue: {
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "#3b82f6", // Blue-400
        borderRadius: 24,
        transform: [{ rotate: "-6deg" }],
    },
    rotatedCardColor: {
        position: "absolute",
        width: "100%",
        height: "100%",
        borderRadius: 24,
        transform: [{ rotate: "6deg" }],
    },
    innerContainer: {
        width: "100%",
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        borderRadius: 24,
        padding: 16,
        backgroundColor: "#e2e8f0", // Gray-200
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 3.5,
        shadowOffset: { width: 0, height: 2 },
    },
    logoContainer: {
        alignItems: "center",
    },
    logo: {
        height: 100,
        width: 100,
    },
    loginText: {
        marginTop: 8,
        textAlign: "center",
        fontSize: 14,
        color: "#4A5568", // Gray-700
        fontWeight: "600",
    },
    inputContainer: {
        marginTop: 20,
    },
    input: {
        marginTop: 8,
        width: "100%",
        height: 44,
        borderRadius: 10,
        backgroundColor: "#f7fafc", // Gray-100
    },
    forgotPasswordContainer: {
        padding: 8,
        alignItems: "flex-end",
    },
    forgotPasswordText: {
        textDecorationLine: "underline",
        fontSize: 12,
        color: "#4A5568", // Gray-600
    },
    button: {
        width: "100%",
        padding: 12,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 3.5,
        shadowOffset: { width: 0, height: 2 },
        marginTop: 20,
    },
    buttonText: {
        textAlign: "center",
        color: "white",
    },
    newAccountContainer: {
        flex: 1,
        padding: 8,
        width: "100%",
        marginTop: 20,
        flexDirection: "column",
        justifyContent: "center",
    },
    newAccountText: {
        width: "100%",
        textAlign: "center",
    },
    createAccountText: {
        color: "#3b82f6", // Blue-500
        textDecorationLine: "underline",
    },
});

export default ForgetPassword;
