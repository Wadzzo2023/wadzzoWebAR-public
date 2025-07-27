"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { Animated, Dimensions, StyleSheet, View, Text, Image } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const NUM_COINS = 25
const NUM_SPARKLES = 15

interface ParticleAnimationProps {
    visible: boolean
    onAnimationComplete?: () => void
}

export const CollectionAnimation: React.FC<ParticleAnimationProps> = ({ visible, onAnimationComplete }) => {
    // Coin particles
    const coins = useRef(
        Array.from({ length: NUM_COINS }, () => ({
            translateY: new Animated.Value(-100),
            translateX: new Animated.Value(0),
            scale: new Animated.Value(0),
            opacity: new Animated.Value(0),
            rotation: new Animated.Value(0),
        })),
    ).current

    // Sparkle particles
    const sparkles = useRef(
        Array.from({ length: NUM_SPARKLES }, () => ({
            translateY: new Animated.Value(SCREEN_HEIGHT / 2),
            translateX: new Animated.Value(SCREEN_WIDTH / 2),
            scale: new Animated.Value(0),
            opacity: new Animated.Value(0),
            rotation: new Animated.Value(0),
        })),
    ).current

    // Success text animation
    const successText = useRef({
        scale: new Animated.Value(0),
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(50),
    }).current

    useEffect(() => {
        if (visible) {
            // Reset all animations
            coins.forEach((coin) => {
                coin.translateY.setValue(-100)
                coin.translateX.setValue(SCREEN_WIDTH / 2)
                coin.scale.setValue(0)
                coin.opacity.setValue(0)
                coin.rotation.setValue(0)
            })

            sparkles.forEach((sparkle) => {
                sparkle.translateY.setValue(SCREEN_HEIGHT / 2)
                sparkle.translateX.setValue(SCREEN_WIDTH / 2)
                sparkle.scale.setValue(0)
                sparkle.opacity.setValue(0)
                sparkle.rotation.setValue(0)
            })

            successText.scale.setValue(0)
            successText.opacity.setValue(0)
            successText.translateY.setValue(50)

            // Success text animation
            Animated.sequence([
                Animated.delay(200),
                Animated.parallel([
                    Animated.spring(successText.scale, {
                        toValue: 1.2,
                        tension: 100,
                        friction: 8,
                        useNativeDriver: true,
                    }),
                    Animated.timing(successText.opacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.spring(successText.translateY, {
                        toValue: 0,
                        tension: 100,
                        friction: 8,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.delay(1000),
                Animated.parallel([
                    Animated.timing(successText.scale, {
                        toValue: 0.8,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(successText.opacity, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start()

            // Coin explosion animation
            coins.forEach((coin, index) => {
                const delay = index * 50
                const angle = (index / NUM_COINS) * 2 * Math.PI
                const radius = 150 + Math.random() * 100
                const endX = SCREEN_WIDTH / 2 + Math.cos(angle) * radius
                const endY = SCREEN_HEIGHT / 2 + Math.sin(angle) * radius

                Animated.parallel([
                    // Explosion outward
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(coin.translateX, {
                            toValue: endX,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(coin.translateY, {
                            toValue: endY,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                    ]),
                    // Scale animation
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.spring(coin.scale, {
                            toValue: 1 + Math.random() * 0.5,
                            tension: 100,
                            friction: 6,
                            useNativeDriver: true,
                        }),
                        Animated.delay(400),
                        Animated.timing(coin.scale, {
                            toValue: 0,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                    ]),
                    // Opacity animation
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(coin.opacity, {
                            toValue: 0.9,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                        Animated.delay(500),
                        Animated.timing(coin.opacity, {
                            toValue: 0,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                    ]),
                    // Rotation
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(coin.rotation, {
                            toValue: 720 * (Math.random() > 0.5 ? 1 : -1),
                            duration: 1200,
                            useNativeDriver: true,
                        }),
                    ]),
                ]).start()
            })

            // Sparkle burst animation
            sparkles.forEach((sparkle, index) => {
                const delay = 300 + index * 30
                const angle = (index / NUM_SPARKLES) * 2 * Math.PI
                const radius = 80 + Math.random() * 60
                const endX = SCREEN_WIDTH / 2 + Math.cos(angle) * radius
                const endY = SCREEN_HEIGHT / 2 + Math.sin(angle) * radius

                Animated.parallel([
                    // Sparkle burst
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(sparkle.translateX, {
                            toValue: endX,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(sparkle.translateY, {
                            toValue: endY,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ]),
                    // Scale animation
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.spring(sparkle.scale, {
                            toValue: 1,
                            tension: 150,
                            friction: 4,
                            useNativeDriver: true,
                        }),
                        Animated.delay(200),
                        Animated.timing(sparkle.scale, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                    ]),
                    // Opacity animation
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(sparkle.opacity, {
                            toValue: 1,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.delay(200),
                        Animated.timing(sparkle.opacity, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                    ]),
                    // Rotation
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(sparkle.rotation, {
                            toValue: 360,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                    ]),
                ]).start()
            })

            // Complete animation after all effects
            setTimeout(() => {
                onAnimationComplete?.()
            }, 2500)
        }
    }, [visible, onAnimationComplete])

    if (!visible) return null

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Success Text */}
            <Animated.View
                style={[
                    styles.successTextContainer,
                    {
                        transform: [{ scale: successText.scale }, { translateY: successText.translateY }],
                        opacity: successText.opacity,
                    },
                ]}
            >
                <Text style={styles.successText}>COLLECTED!</Text>
                <MaterialCommunityIcons name="check-circle" size={40} color="#00ff00" />
            </Animated.View>

            {/* Coin Particles */}
            {coins.map((coin, index) => (
                <Animated.View
                    key={`coin-${index}`}
                    style={[
                        styles.coinParticle,
                        {
                            transform: [
                                { translateX: coin.translateX },
                                { translateY: coin.translateY },
                                { scale: coin.scale },
                                {
                                    rotate: coin.rotation.interpolate({
                                        inputRange: [0, 360],
                                        outputRange: ["0deg", "360deg"],
                                    }),
                                },
                            ],
                            opacity: coin.opacity,
                        },
                    ]}
                >
                    <Image
                        source={require("../assets/images/wadzzo.png")} // Replace with your coin image
                        style={[{ width: 40, height: 40 }]}
                    />
                </Animated.View>
            ))}

            {/* Sparkle Particles */}
            {sparkles.map((sparkle, index) => (
                <Animated.View
                    key={`sparkle-${index}`}
                    style={[
                        styles.sparkleParticle,
                        {
                            transform: [
                                { translateX: sparkle.translateX },
                                { translateY: sparkle.translateY },
                                { scale: sparkle.scale },
                                {
                                    rotate: sparkle.rotation.interpolate({
                                        inputRange: [0, 360],
                                        outputRange: ["0deg", "360deg"],
                                    }),
                                },
                            ],
                            opacity: sparkle.opacity,
                        },
                    ]}
                >
                    <MaterialCommunityIcons name="star-four-points" size={20} color="#00ffff" style={styles.sparkleIcon} />
                </Animated.View>
            ))}

            {/* Background Glow Effect */}
            <Animated.View
                style={[
                    styles.glowBackground,
                    {
                        opacity: successText.opacity.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 0.3],
                        }),
                    },
                ]}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    successTextContainer: {
        position: "absolute",
        top: SCREEN_HEIGHT * 0.4,
        left: 0,
        right: 0,
        alignItems: "center",
        justifyContent: "center",

    },
    successText: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#00ff00",
        textAlign: "center",
        marginBottom: 10,
        textShadowColor: "rgba(0, 255, 0, 0.8)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    coinParticle: {
        position: "absolute",
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    coinIcon: {
        textShadowColor: "rgba(255, 215, 0, 0.8)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    sparkleParticle: {
        position: "absolute",
        width: 30,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    sparkleIcon: {
        textShadowColor: "rgba(0, 255, 255, 0.8)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    glowBackground: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#00ff00",
    },
})
