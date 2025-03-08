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
        <Svg width="25" height="25" viewBox="0 0 16 17" fill="none" >
            <Path d="M8.7044 1.86809L13.0391 10.5784C13.2704 11.0432 13.0347 11.605 12.5409 11.7655L2.21642 15.1218C1.50027 15.3546 0.857461 14.61 1.19228 13.9355L7.18206 1.86886C7.49433 1.23979 8.3915 1.23934 8.7044 1.86809Z" fill={Color.wadzzo} fill-opacity="0.5" stroke="white" stroke-width="0.3" />
            <Path d="M7.24632 1.86898L2.87574 10.6551C2.64455 11.1199 2.88027 11.6815 3.3739 11.842L13.7838 15.2275C14.4999 15.4604 15.1428 14.7159 14.8081 14.0414L8.76878 1.86975C8.45656 1.24051 7.55917 1.24006 7.24632 1.86898Z" fill={Color.wadzzo} fill-opacity="0.5" stroke="white" stroke-width="0.3" />
        </Svg>

    );
};

