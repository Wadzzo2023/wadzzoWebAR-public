import React, { useMemo } from "react"
import { View, StyleSheet, Animated, Text, TouchableOpacity } from "react-native"
import { Color } from "@/components/utils/all-colors"
import { useDirectionStore } from "./store/direction-store"
import { useRouter } from "expo-router"
import { useModal } from "./hooks/useModal"
import { ConsumedLocation } from "./types/CollectionTypes"
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg"

interface NearestPinIndicatorProps {
    bearing: number
    distance: number
    userLocation: { latitude: number; longitude: number }
    pinLocation: { latitude: number; longitude: number }
    pin: ConsumedLocation
}

const NearestPinIndicator: React.FC<NearestPinIndicatorProps> = ({
    bearing,
    distance,
    pinLocation,
    userLocation,
    pin
}) => {
    const { setData } = useDirectionStore()
    const { setData: setModalData } = useModal()
    const router = useRouter()
    const rotateAnim = useMemo(() => new Animated.Value(bearing), [bearing])

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ["0deg", "360deg"],
    })

    // Update the rotation when the bearing changes
    React.useEffect(() => {
        Animated.timing(rotateAnim, {
            toValue: bearing,
            duration: 300,
            useNativeDriver: true,
        }).start()
    }, [bearing, rotateAnim])

    const formatDistance = (meters: number) => {
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(1)} KM`;
        }
        return `${Math.round(meters)}M`;
    };

    return (
        <View
            style={[
                styles.container,
                {
                    top: 40,
                    left: 10,
                },
            ]}
        >
            <TouchableOpacity
                style={styles.compassContainer}
                onPress={() => {
                    setData({
                        currentLocation: {
                            latitude: userLocation.latitude,
                            longitude: userLocation.longitude,
                        },
                        destinationLocation: {
                            latitude: pinLocation.latitude,
                            longitude: pinLocation.longitude,
                        }
                    })
                    setModalData(
                        {
                            Collection: pin,
                        }
                    )
                    router.push("/direction")
                }}
            >
                {/* Static compass background */}
                <View style={styles.compassBackground}>
                    <Svg height="70" width="70" viewBox="0 0 70 70">
                        {/* Outer circle */}
                        <Circle cx="35" cy="35" r="33" fill="rgba(255,255,255,0.9)" stroke="#ccc" strokeWidth="1" />

                        {/* Cardinal direction markers */}


                        {/* Cardinal direction labels */}
                        <SvgText x="33" y="10" fontSize="10" textAnchor="middle" fill="#333" fontWeight="bold">N</SvgText>
                        <SvgText x="33" y="63" fontSize="10" textAnchor="middle" fill="#333" fontWeight="bold">S</SvgText>
                        <SvgText x="8" y="38" fontSize="10" textAnchor="middle" fill="#333" fontWeight="bold">W</SvgText>
                        <SvgText x="62" y="38" fontSize="10" textAnchor="middle" fill="#333" fontWeight="bold">E</SvgText>
                    </Svg>
                </View>

                {/* Rotating pointer - separate from the background */}
                <Animated.View
                    style={[
                        styles.pointerContainer,
                        {
                            transform: [{ rotate: rotateInterpolate }],
                        }
                    ]}
                >
                    <Svg height="70" width="70" viewBox="0 0 70 70">
                        {/* Pin direction pointer */}
                        <Path
                            d="M35,10 L40,35 L35,40 L30,35 Z"
                            fill={Color.wadzzo}
                            stroke="white"
                            strokeWidth="0.5"
                        />
                        {/* Small circle in the middle */}
                        <Circle cx="35" cy="35" r="3" fill={Color.wadzzo} stroke="white" strokeWidth="0.5" />
                    </Svg>
                </Animated.View>

                <View style={styles.distanceContainer}>
                    <Text style={styles.distanceText}>{formatDistance(distance)}</Text>
                </View>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        alignItems: "center",
        zIndex: 100,
    },
    compassContainer: {
        alignItems: "center",
    },
    compassBackground: {
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    pointerContainer: {
        position: 'absolute',
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    distanceContainer: {
        backgroundColor: Color.wadzzo,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginTop: 4,
    },
    distanceText: {
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
    },
});

export default NearestPinIndicator