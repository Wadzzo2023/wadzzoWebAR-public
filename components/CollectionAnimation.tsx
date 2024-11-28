import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View, Image } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_PARTICLES = 40;

interface ParticleAnimationProps {
    visible: boolean;
    onAnimationComplete?: () => void;
}

export const CollectionAnimation: React.FC<ParticleAnimationProps> = ({
    visible,
    onAnimationComplete,
}) => {
    const particles = useRef(
        Array.from({ length: NUM_PARTICLES }, () => ({
            translateY: new Animated.Value(-100),
            translateX: new Animated.Value(0),
            scale: new Animated.Value(0.5),
            opacity: new Animated.Value(0),
            rotation: new Animated.Value(0),
        }))
    ).current;

    useEffect(() => {
        if (visible) {
            // Reset and start animation for each particle
            particles.forEach((particle, index) => {
                particle.translateY.setValue(-100);
                particle.translateX.setValue(0);
                particle.scale.setValue(0.5);
                particle.opacity.setValue(0);
                particle.rotation.setValue(0);

                const delay = index * 100;
                const startX = Math.random() * SCREEN_WIDTH;

                Animated.parallel([
                    // Falling animation
                    Animated.timing(particle.translateY, {
                        toValue: SCREEN_HEIGHT,
                        duration: 2000,
                        useNativeDriver: true,
                        delay,
                    }),
                    // // Horizontal swaying
                    // Animated.sequence([
                    //     Animated.timing(particle.translateX, {
                    //         toValue: startX - 50 + Math.random() * 100,
                    //         duration: 1000,
                    //         useNativeDriver: true,
                    //         delay,
                    //     }),
                    //     Animated.timing(particle.translateX, {
                    //         toValue: startX + 50 + Math.random() * 100,
                    //         duration: 1000,
                    //         useNativeDriver: true,
                    //     }),
                    // ]),
                    // // Scale and fade in/out
                    Animated.sequence([
                        Animated.timing(particle.scale, {
                            toValue: 1 + Math.random() * 0.5,
                            duration: 500,
                            useNativeDriver: true,
                            delay,
                        }),
                        Animated.timing(particle.scale, {
                            toValue: 0,
                            duration: 500,
                            useNativeDriver: true,
                            delay: 1500,
                        }),
                    ]),
                    // Opacity
                    Animated.sequence([
                        Animated.timing(particle.opacity, {
                            toValue: 0.8,
                            duration: 500,
                            useNativeDriver: true,
                            delay,
                        }),
                        Animated.timing(particle.opacity, {
                            toValue: 0,
                            duration: 500,
                            useNativeDriver: true,
                            delay: 1500,
                        }),
                    ]),
                    // Rotation
                    Animated.timing(particle.rotation, {
                        toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
                        duration: 2000,
                        useNativeDriver: true,
                        delay,
                    }),
                ]).start();
            });

            setTimeout(() => {
                onAnimationComplete?.();
            }, 4000);
        }
    }, [visible, onAnimationComplete]);

    if (!visible) return null;

    return (
        <View style={StyleSheet.absoluteFill}>
            {particles.map((particle, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.particle,
                        {
                            transform: [
                                { translateX: particle.translateX },
                                { translateY: particle.translateY },
                                { scale: particle.scale },
                                {
                                    rotate: particle.rotation.interpolate({
                                        inputRange: [0, 360],
                                        outputRange: ['0deg', '360deg'],
                                    }),
                                },
                            ],
                            opacity: particle.opacity,
                            left: Math.random() * SCREEN_WIDTH,
                        },
                    ]}
                >
                    <Image
                        source={require('../assets/images/wadzzo.png')}
                        style={styles.wadzzoImage}
                    />
                </Animated.View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    particle: {
        position: 'absolute',
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wadzzoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
});

