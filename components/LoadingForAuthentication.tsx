import React, { useEffect } from "react";
import { View, Image, StyleSheet, Dimensions, Pressable } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    withSequence,
    withDelay,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function LoadingScreen() {
    const rotation = useSharedValue(0);
    const textScale = useSharedValue(1);
    const dotOpacity1 = useSharedValue(0);
    const dotOpacity2 = useSharedValue(0);
    const dotOpacity3 = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, {
                duration: 2000,
                easing: Easing.linear,
            }),
            -1,
            false
        );

        const animateDots = () => {
            dotOpacity1.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 500 }),
                    withDelay(1000, withTiming(0, { duration: 500 }))
                ),
                -1,
                true
            );
            dotOpacity2.value = withRepeat(
                withSequence(
                    withDelay(500, withTiming(1, { duration: 500 })),
                    withDelay(1000, withTiming(0, { duration: 500 }))
                ),
                -1,
                true
            );
            dotOpacity3.value = withRepeat(
                withSequence(
                    withDelay(1000, withTiming(1, { duration: 500 })),
                    withDelay(1000, withTiming(0, { duration: 500 }))
                ),
                -1,
                true
            );
        };

        animateDots();
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotateY: `${rotation.value}deg` }],
        };
    });

    const textAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: textScale.value }],
        };
    });

    const dot1Style = useAnimatedStyle(() => {
        return {
            opacity: dotOpacity1.value,
        };
    });

    const dot2Style = useAnimatedStyle(() => {
        return {
            opacity: dotOpacity2.value,
        };
    });

    const dot3Style = useAnimatedStyle(() => {
        return {
            opacity: dotOpacity3.value,
        };
    });

    const handlePress = () => {
        textScale.value = withSequence(
            withTiming(1.2, { duration: 100 }),
            withTiming(1, { duration: 100 })
        );
    };

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.logoContainer, animatedStyle]}>
                <Image
                    source={require("../assets/images/wadzzo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>
            <ActivityIndicator size="small" color="#4CAF50" style={styles.spinner} />
            <Pressable onPress={handlePress}>
                <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
                    <Animated.Text style={styles.text}>
                        Checking authentication
                    </Animated.Text>
                    <View style={styles.dotsContainer}>
                        <Animated.Text style={[styles.dot, dot1Style]}>.</Animated.Text>
                        <Animated.Text style={[styles.dot, dot2Style]}>.</Animated.Text>
                        <Animated.Text style={[styles.dot, dot3Style]}>.</Animated.Text>
                    </View>
                </Animated.View>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
        width: width,
        height: height,
    },
    logoContainer: {
        width: 150,
        height: 150,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 30,
    },
    logo: {
        width: "100%",
        height: "100%",
    },
    spinner: {
        marginTop: 20,
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    text: {
        fontSize: 16,
        color: "#4CAF50",
        fontWeight: "500",
    },
    dotsContainer: {
        flexDirection: 'row',
        marginLeft: 4,
    },
    dot: {
        fontSize: 16,
        color: "#4CAF50",
        fontWeight: "500",
    },
});

