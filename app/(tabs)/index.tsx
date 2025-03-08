"use client"

import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons"
import Mapbox, { Camera, LineLayer, LocationPuck, MapView, MarkerView, RasterLayer, RasterSource, UserTrackingMode, VectorSource, } from "@rnmapbox/maps"
import * as Location from "expo-location"
import { useCallback, useEffect, useRef, useState } from "react"
import {
    Alert,
    Animated,
    Easing,
    findNodeHandle,
    Image,
    ImageStyle,
    type LayoutChangeEvent,
    Platform,
    StyleSheet,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native"

import { useQuery } from "@tanstack/react-query"

import { useFocusEffect, useRouter } from "expo-router"

import { ActivityIndicator, Text } from "react-native-paper"
import { useExtraInfo } from "@/components/hooks/useExtraInfo"
import { useNearByPin } from "@/components/hooks/useNearbyPin"
import { BrandMode, useAccountAction } from "@/components/hooks/useAccountAction"
import { useModal } from "@/components/hooks/useModal"
import type { ConsumedLocation } from "@/components/types/CollectionTypes"
import { BASE_URL } from "@/components/utils/Common"

import LoadingScreen from "@/components/Loading"
import { Color } from "@/components/utils/all-colors"
import { Walkthrough } from "@/components/walkthrough/WalkthroughProvider"
import { useWalkThrough } from "@/components/hooks/useWalkThrough"
import { useAuth } from "@/components/lib/auth/Provider"
import { CollectionAnimation } from "@/components/CollectionAnimation"
import { point } from "@turf/turf"
import { toast } from "@backpackapp-io/react-native-toast"
import { type DirectionDataType, useDirectionStore } from "@/components/store/direction-store"
import { getMapAllPins } from "../api/routes/get-Map-all-pins"
import { getUserPlatformAsset } from "../api/routes/get-user-platformAsset"
import {
    calculateBearing,
    getAutoCollectPins,
    getDistanceFromLatLonInMeters,
    getNearbyPins,
} from "@/components/utils/map"
import { type ButtonLayout, createStepsForMap } from "@/components/steps/map"
import NearestPinIndicator from "@/components/nearest-pin-indicator"

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API!)

type userLocationType = {
    latitude: number
    longitude: number
}

const HomeScreen = () => {
    const [locationPermission, setLocationPermission] = useState(false)
    const [userLocation, setUserLocation] = useState<userLocationType | null>(null)
    const [pinAnim] = useState(new Animated.Value(0))
    const [nearestPin, setNearestPin] = useState<ConsumedLocation | null>(null)
    const [nearestPinDistance, setNearestPinDistance] = useState<number | null>(null)
    const router = useRouter()
    const { setData: setExtraInfo } = useExtraInfo()
    const { setData: setDirectionData } = useDirectionStore()
    const [loading, setLoading] = useState(true)
    const { setData } = useNearByPin()
    const { data } = useAccountAction()
    const autoCollectModeRef = useRef(data.mode)
    const { onOpen } = useModal()
    const cameraRef = useRef<Camera>(null)
    const { isAuthenticated, loading: authLoading, user } = useAuth()
    const [showAnimation, setShowAnimation] = useState(false)
    const [userHeading, setUserHeading] = useState(0)
    const scrollViewRef = useRef(null)
    const [buttonLayouts, setButtonLayouts] = useState<ButtonLayout[]>([])
    const [showWalkthrough, setShowWalkthrough] = useState(false)
    const [bearing, setBearing] = useState(0)
    const { data: accountActionData, setData: setAccountActionData } = useAccountAction()
    const { data: walkthroughData } = useWalkThrough()
    const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null)
    const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null)
    const rotateAnim = useRef(new Animated.Value(0)).current

    const [handleRecenterPress, setHandleRecenterPress] = useState(false)
    const [countCurrentStep, setCountCurrentStep] = useState(0)
    const [touchOnMap, setTouchOnMap] = useState(false)

    const lastHeadingUpdate = useRef<number>(Date.now())
    const MIN_HEADING_UPDATE_INTERVAL = 3000 // Minimum time between heading updates (1 second)
    const MIN_HEADING_CHANGE = 5 // Minimum heading change in degrees to trigger update
    const steps = createStepsForMap(buttonLayouts)

    const onButtonLayout = useCallback((event: LayoutChangeEvent, index: number) => {
        if (scrollViewRef.current) {
            const scrollViewHandle = findNodeHandle(scrollViewRef.current)
            if (scrollViewHandle) {
                event.target.measureLayout(
                    scrollViewHandle,
                    (x, y, width, height) => {
                        setButtonLayouts((prevLayouts) => {
                            const newLayouts = [...prevLayouts]
                            newLayouts[index] = { x, y, width, height }
                            // console.log(newLayouts);
                            return newLayouts
                        })
                    },
                    () => console.error("Failed to measure layout"),
                )
            }
        }
    }, [])

    const checkFirstTimeSignIn = async () => {
        // console.log(showWalkthrough);
        if (walkthroughData.showWalkThrough) {
            setShowWalkthrough(true)
        } else {
            setShowWalkthrough(false)
        }
    }

    const handleARPress = (userLocation: userLocationType, locations: ConsumedLocation[]) => {
        const nearbyPins = getNearbyPins(userLocation, locations, 50)
        if (nearbyPins.length > 0) {
            setData({
                nearbyPins: nearbyPins,
                singleAR: false,
            })
            router.push("/ARScreen")
        } else {
            onOpen("NearbyPin")
        }
    }

    const collectPinsSequentially = async (pins: ConsumedLocation[]) => {
        for (const pin of pins) {
            if (!autoCollectModeRef.current) {
                // console.log("Auto collect mode paused");
                break // Exit if auto-collect is turned off
            }
            if (pin.collection_limit_remaining <= 0 || pin.collected) {
                // console.log("Pin limit reached:", pin.id);
                continue
            }
            const response = await fetch(new URL("api/game/locations/consume", BASE_URL).toString(), {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ location_id: pin.id.toString() }),
            })

            if (response.ok) {
                showPinCollectionAnimation()
            }

            await new Promise((resolve) => setTimeout(resolve, 20000)) // Wait 20 seconds
        }
    }

    const showPinCollectionAnimation = () => {
        setShowAnimation(true)
    }

    const handleRecenter = () => {
        if (!userLocation || !cameraRef.current) {
            toast.error("Unable to center the map. User location unavailable.")
            return
        }
        setHandleRecenterPress(true)
        cameraRef.current.setCamera({
            centerCoordinate: [userLocation.longitude, userLocation.latitude],
            zoomLevel: 16,
            heading: 0,
        })

        setTimeout(() => {
            setHandleRecenterPress(false)
        }, 8000)

        setAccountActionData({
            ...accountActionData,
            trackingMode: true,
        })

        setTouchOnMap(false)
    }

    const response = useQuery({
        queryKey: ["MapsAllPins", accountActionData.brandMode],
        queryFn: async () =>
            getMapAllPins({
                filterID: accountActionData.brandMode === BrandMode.FOLLOW ? "1" : "0",
            }),
    })
    const balanceRes = useQuery({
        queryKey: ["balance"],
        queryFn: getUserPlatformAsset,
    })

    const locations = response.data?.locations ?? []

    const calculateNearestPin = useCallback(() => {
        if (!userLocation || locations.length === 0) return

        let nearest = null
        let minDistance = Number.POSITIVE_INFINITY

        locations.forEach((location) => {
            if (location.collected || location.collection_limit_remaining <= 0) return
            const distance = getDistanceFromLatLonInMeters(
                userLocation.latitude,
                userLocation.longitude,
                location.lat,
                location.lng,
            )
            if (distance < minDistance) {
                minDistance = distance
                nearest = location
            }
        })
        setNearestPin(nearest)
        setNearestPinDistance(minDistance)
    }, [userLocation, locations])

    useEffect(() => {
        calculateNearestPin()
    }, [userLocation, locations])

    useFocusEffect(
        useCallback(() => {
            if (!data.trackingMode) return // Exit early if trackingMode is false

            // Request location permission and start watching the user's location
            const startWatchingLocation = async () => {
                const { status } = await Location.requestForegroundPermissionsAsync()
                if (status !== "granted") {
                    Alert.alert("Permission to access location was denied")
                    return
                }

                setLocationPermission(true)

                // Start watching the user's location
                locationSubscriptionRef.current = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        distanceInterval: 1, // update position every meter
                        timeInterval: 5000, // update position every 5 seconds
                    },
                    (location) => {
                        const { latitude, longitude, speed } = location.coords

                        setLoading(false)
                        setUserLocation({ latitude, longitude })
                        setDirectionData((prevData?: DirectionDataType) => ({
                            destinationLocation: prevData?.destinationLocation, // Preserve current location
                            currentLocation: {
                                latitude: latitude,
                                longitude: longitude,
                            },
                        }))

                        // Track user activity based on speed
                        if (speed! >= 3) {
                            console.log("User is running")
                        } else if (speed! >= 0.5) {
                            console.log("User is walking")
                        } else {
                            console.log("User is stationary")
                        }

                        setExtraInfo({
                            useCurrentLocation: { latitude, longitude },
                        })
                    },
                )
                headingSubscriptionRef.current = await Location.watchHeadingAsync(({ trueHeading }) => {
                    const now = Date.now()
                    const timeSinceLastUpdate = now - lastHeadingUpdate.current

                    // Check if enough time has passed and heading change is significant
                    if (
                        timeSinceLastUpdate >= MIN_HEADING_UPDATE_INTERVAL &&
                        Math.abs(trueHeading - userHeading) >= MIN_HEADING_CHANGE
                    ) {
                        setUserHeading(trueHeading)
                        lastHeadingUpdate.current = now
                    }
                })
            }

            startWatchingLocation()

            // Cleanup function in case the component unmounts while tracking
            return () => {
                locationSubscriptionRef.current?.remove()
                headingSubscriptionRef.current?.remove()
            }
        }, [data.trackingMode]),
    ) // Depend on trackingMode

    useEffect(() => {
        if (userHeading && nearestPin && userLocation) {
            const bearing = calculateBearing(userLocation.latitude, userLocation.longitude, nearestPin.lat, nearestPin.lng)

            const relativeBearing = (bearing - userHeading) % 360

            setBearing(relativeBearing)
            Animated.timing(rotateAnim, {
                toValue: relativeBearing,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.linear,
            }).start()
        }
    }, [userHeading, nearestPin, userLocation])

    useEffect(() => {
        if (authLoading) return // Exit if still loading

        if (!isAuthenticated) {
            router.replace("/Login")
        } else {
            checkFirstTimeSignIn() // Check if it's the first sign-in
        }
    }, [authLoading, isAuthenticated, walkthroughData])

    useEffect(() => {
        console.log("Tracking mode:", data.trackingMode)
    }, [data.trackingMode])

    useEffect(() => {
        if (countCurrentStep === 5) {
            showPinCollectionAnimation()
        }
    }, [countCurrentStep])

    useFocusEffect(
        useCallback(() => {
            console.log("Refetching data"), response.refetch()
        }, []),
    )

    useEffect(() => {
        if (data.mode && locations) {
            const autoCollectPins = getAutoCollectPins(userLocation, locations, 50)
            if (autoCollectPins.length > 0) {
                collectPinsSequentially(autoCollectPins)
            }
        }
    }, [data.mode, locations])

    useEffect(() => {
        autoCollectModeRef.current = data.mode
    }, [data.mode])

    if (response.isLoading || loading || !locationPermission || !userLocation || authLoading) {
        return <LoadingScreen />
    }

    return (
        <View style={styles.container} ref={scrollViewRef}>
            <>
                <MapView
                    styleURL="mapbox://styles/wadzzo/cm1xtphyn01ci01pi20jhfbto"
                    style={styles.map}
                    pitchEnabled={true}
                    logoEnabled={false}

                    onTouchMove={() => {
                        setTouchOnMap(true)
                        setHandleRecenterPress(false)
                    }}
                    onCameraChanged={(event) => {
                        if (touchOnMap && data.trackingMode && !handleRecenterPress) {
                            setAccountActionData({
                                ...accountActionData,
                                trackingMode: false,
                            })
                        }
                    }}
                >
                    <Camera
                        defaultSettings={{
                            centerCoordinate: [userLocation.longitude, userLocation.latitude],
                        }}
                        animationMode={'flyTo'}
                        zoomLevel={16}
                        followZoomLevel={16}
                        followPitch={16}
                        heading={0}
                        allowUpdates={true}
                        pitch={0}
                        ref={cameraRef}
                        centerCoordinate={[userLocation.longitude, userLocation.latitude]}
                    />
                    <LocationPuck pulsing={{ isEnabled: true }} puckBearingEnabled puckBearing="heading" />
                    <Marker locations={locations} />

                </MapView>
                {nearestPin && userLocation && !showWalkthrough && data.trackingMode && (
                    <NearestPinIndicator
                        bearing={bearing}
                        distance={nearestPinDistance || 0}
                        userLocation={{
                            latitude: userLocation.latitude,
                            longitude: userLocation.longitude,
                        }}
                        pinLocation={{ latitude: nearestPin.lat, longitude: nearestPin.lng }}
                        pin={nearestPin}
                    />
                )}
                <CollectionAnimation visible={showAnimation} onAnimationComplete={() => setShowAnimation(false)} />
                {showWalkthrough && <View style={styles.welcome} onLayout={(event) => onButtonLayout(event, 0)}></View>}
                {/* Recenter button */}
                <View style={styles.balance} onLayout={(event) => onButtonLayout(event, 2)}>
                    <Image
                        style={{
                            height: 20,
                            width: 20,
                        }}
                        source={require("../../assets/images/wadzzo.png")}
                        height={100}
                        width={100}
                    />
                    <Text
                        style={{
                            color: "white",
                        }}
                    >
                        {Number(balanceRes.data) >= 0 ? Number(balanceRes.data).toFixed(2) : 0}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.recenterButton, { borderColor: data.trackingMode ? Color.wadzzo : "transparent" }]}
                    onPress={handleRecenter}
                    onLayout={(event) => onButtonLayout(event, 4)}
                >
                    <MaterialCommunityIcons name="crosshairs-gps" size={20} color={data.trackingMode ? Color.wadzzo : "black"} />
                </TouchableOpacity>

                <TouchableOpacity
                    onLayout={(event) => onButtonLayout(event, 5)}
                    style={styles.AR}
                    onPress={() => handleARPress(userLocation, locations)}
                >
                    <MaterialCommunityIcons name="cube-scan" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    onLayout={(event) => onButtonLayout(event, 3)}
                    style={styles.Refresh}
                    onPress={async () => await response.refetch()}
                >
                    {response.isFetching ? <ActivityIndicator size={22} color={Color.wadzzo} />
                        : <FontAwesome name="refresh" size={22} color="black" />}
                </TouchableOpacity>

                {showWalkthrough && countCurrentStep === 5 && (
                    <View style={styles.pinCollectedAnim} onLayout={(event) => onButtonLayout(event, 1)}>
                        <Image source={require("../../assets/images/wadzzo.png")} style={styles.pinImage} />
                    </View>
                )}
            </>

            {showWalkthrough && (
                <Walkthrough
                    steps={steps}
                    setCountCurrentStep={setCountCurrentStep}
                    onFinish={() => setShowWalkthrough(false)}
                />
            )}
        </View>
    )
}

const Marker = ({ locations }: { locations: ConsumedLocation[] }) => {
    const { onOpen } = useModal()
    const pins = locations.map((location) => point([location.lng, location.lat]))
    return (
        <>
            {locations.map((location: ConsumedLocation, index: number) => (
                <MarkerView
                    allowOverlap={true}
                    allowOverlapWithPuck={true}
                    key={`${index}-${location.id}`}
                    coordinate={[location.lng, location.lat]}
                >
                    <TouchableOpacity
                        onPress={() =>
                            onOpen("LocationInformation", {
                                Collection: location,
                            })
                        }
                    >
                        <Image
                            source={{ uri: location.brand_image_url }}
                            height={30}
                            width={30}
                            style={[
                                {
                                    height: 30,
                                    width: 30,
                                    borderWidth: 2,

                                    borderColor: Color.wadzzo,
                                },
                                !location.auto_collect && {
                                    borderRadius: 20, // Add borderRadius only when auto_collect is false
                                },
                                location.collected && { opacity: 0.4 },
                            ]}
                        />
                    </TouchableOpacity>
                </MarkerView>
            ))}
        </>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
    },
    map: {
        flex: 1,
    },

    marker: {
        width: 40,
        height: 60,
    },
    markerImage: {
        width: "100%",
        height: "100%",
    },
    autoCollectButton: {
        position: "absolute",
        bottom: 100,
        left: 20,
        padding: 10,
        backgroundColor: Color.wadzzo,
        borderRadius: 8,
    },
    pinCollectedAnim: {
        position: "absolute",
        bottom: 300,
        left: "50%",
        marginLeft: -50,
        width: 100,
        height: 100,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 50,
        backgroundColor: Color.wadzzo, // Your branding color here
    },
    pinImage: {
        width: 80,
        height: 80,
    },

    recenterButton: {
        position: "absolute",
        bottom: Platform.OS === "ios" ? 90 : 80,
        right: 10,
        backgroundColor: Color.white,
        padding: 12,
        borderRadius: 8,
        zIndex: 10,
        borderWidth: 2,
    },
    balance: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        position: "absolute",
        gap: 4,
        top: 40,
        right: 10,
        backgroundColor: Color.wadzzo,
        padding: 12,
        borderRadius: 8,
        zIndex: 10,
    },
    welcome: {
        position: "absolute",
        top: 100,
        left: 10,
    },

    AR: {
        position: "absolute",
        bottom: Platform.OS === "ios" ? 150 : 140,
        right: 10,
        backgroundColor: Color.wadzzo,
        padding: 12,
        borderRadius: 8,
        zIndex: 10,
    },
    Refresh: {
        position: "absolute",
        bottom: Platform.OS === "ios" ? 90 : 80,
        right: 60,
        backgroundColor: Color.white,
        padding: 12,
        borderRadius: 8,
        zIndex: 10,
    },
    containerOnBoard: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    avatar: {
        width: 150,
        height: 150,
        borderRadius: 75,
        marginBottom: 20,
    },
    randomButton: {
        backgroundColor: "#4CAF50",
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
    },
    randomButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    input: {
        width: "100%",
        height: 40,
        borderColor: "gray",
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    saveButton: {
        backgroundColor: "#2196F3",
        padding: 15,
        borderRadius: 5,
    },
    saveButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    errorText: {
        color: "red",
        fontSize: 12,
        marginTop: 4,
    },
})

export default HomeScreen

