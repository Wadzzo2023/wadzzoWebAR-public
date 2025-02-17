"use client"

import React, { useMemo } from "react"
import { View, StyleSheet, Animated, Dimensions, Text, TouchableOpacity } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Color } from "@/components/utils/all-colors"
import { getEdgePosition } from "./utils/map"

interface NearestPinIndicatorProps {
    bearing: number
    distance: number
    userLocation: { latitude: number; longitude: number }
    pinLocation: { latitude: number; longitude: number }
    pin: ConsumedLocation
}

const NearestPinIndicator: React.FC<NearestPinIndicatorProps> = ({ bearing, distance, pinLocation, userLocation, pin }) => {
    const { setData } = useDirectionStore()
    const { setData: setModalData } = useModal()
    const router = useRouter()
    const rotateAnim = useMemo(() => new Animated.Value(bearing), [bearing])

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ["0deg", "360deg"],
    })


    const { top, left } = getEdgePosition(bearing)

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
            return `${(meters / 1000).toFixed(0)} KM`;
        }
        return `${Math.round(meters)}M`;
    };
    return (

        <Animated.View

            style={[
                styles.container,
                {
                    top,
                    left,
                    transform: [{ rotate: rotateInterpolate }],
                },
            ]}
        >
            <TouchableOpacity
                style={{ alignItems: "center" }}
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
                }}>
                <DirectionArrow width={50} height={40} />
                <View style={styles.distanceContainer}>
                    <Text style={styles.distanceText}>{Math.round(distance)}m</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>

    )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        alignItems: "center",
        zIndex: 100,
    },
    distanceContainer: {
        backgroundColor: Color.wadzzo,
        borderRadius: 10,
        padding: 2,
        marginTop: 2,
    },
    distanceText: {
        color: "white",
        fontSize: 12,
    },
});


export default NearestPinIndicator




import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';
import { useDirectionStore } from "./store/direction-store"
import { useRouter } from "expo-router"
import { useModal } from "./hooks/useModal"
import { ConsumedLocation } from "./types/CollectionTypes"

interface DirectionArrowProps {
    color?: string;
    width?: number;
    height?: number;
    style?: ViewStyle;
}

const DirectionArrow: React.FC<DirectionArrowProps> = ({

    width = 20, // Half of original 113pt
    height = 20, // Half of original 97pt
    style
}) => {
    return (
        <Svg
            width={width}
            height={height}
            viewBox="0 0 27 16"
            style={style}
            fill={'none'}
        >
            <Path d="M6.2561 14.3337L13.3224 7.83366C13.3224 7.83366 13.4306 7.83366 13.5 7.83366C13.5694 7.83366 13.6776 7.83366 13.6776 7.83366L20.7439 14.3337M4.28049 13.667L12.6713 2.44713C12.9319 2.09507 13.0621 1.91905 13.2443 1.86517C13.4025 1.81838 13.5885 1.81838 13.7467 1.86517C13.9289 1.91905 14.0591 2.09507 14.3198 2.44713L22.7195 13.667"

                stroke="red" stroke-linecap="round" stroke-linejoin="round"
            />
        </Svg>
    );
};

