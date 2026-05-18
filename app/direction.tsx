import type React from "react"
import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Platform,
    Alert,
    Animated,
} from "react-native"
import Mapbox, {
    Logger,
    Camera,
    LocationPuck,
    MapView,
    MarkerView,
    ShapeSource,
    LineLayer,
    UserTrackingMode,
} from "@rnmapbox/maps"
import * as Location from "expo-location"
import { Text } from "react-native"
import { useModal } from "@/components/hooks/useModal"
import { useDirectionStore } from "@/components/store/direction-store"
import { Color } from "@/components/utils/all-colors"
import { Image } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { toast } from "@backpackapp-io/react-native-toast"
import { router, useFocusEffect } from "expo-router"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet"

type LocationType = {
    latitude: number
    longitude: number
}

// Constants for route deviation detection
const ROUTE_DEVIATION_THRESHOLD = 50 // meters
const RECALCULATION_COOLDOWN = 10000 // 10 seconds

Logger.setLogCallback((log) => {
    const { message } = log
    if (
        message.match("Request failed due to a permanent error: Canceled") ||
        message.match("Request failed due to a permanent error: Socket Closed")
    ) {
        return true
    }
    return false
})

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API!)

const routeProfiles = [
    { id: "walking", label: "Walking", icon: "walk" },
    { id: "cycling", label: "Cycling", icon: "bicycle" },
    { id: "driving", label: "Driving", icon: "car" },
    { id: "driving-traffic", label: "Traffic", icon: "car-multiple" },
]

const StoreLocation: React.FC = () => {
    const { data } = useModal()
    const { data: DirectionData } = useDirectionStore()
    const [routeDirections, setRouteDirections] = useState<any | null>(null)
    const [showTraffic, setShowTraffic] = useState(false)
    const cameraRef = useRef<Camera>(null)
    const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null)
    const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null)
    const [distance, setDistance] = useState<string | null>(null)
    const [duration, setDuration] = useState<string | null>(null)
    const [destinationCoords, setDestinationCoords] = useState<[number, number]>([
        DirectionData?.destinationLocation?.longitude ?? 0,
        DirectionData?.destinationLocation?.latitude ?? 0,
    ])
    const [locationPermission, setLocationPermission] = useState(false)
    const [userLocation, setUserLocation] = useState<LocationType | null>(null)
    const [touchOnMap, setTouchOnMap] = useState(false)
    const [selectedRouteProfile, setselectedRouteProfile] = useState<string>("walking")

    // New states for route deviation detection
    const [isOffRoute, setIsOffRoute] = useState(false)
    const [lastRecalculationTime, setLastRecalculationTime] = useState(0)
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([])
    const [showRecalculatingMessage, setShowRecalculatingMessage] = useState(false)

    // Bottom sheet
    const bottomSheetRef = useRef<BottomSheet>(null)
    // Snap points: 12% for destination card, 45% for route profiles
    const snapPoints = useMemo(() => ["12%", "45%"], [])
    const [currentSnapIndex, setCurrentSnapIndex] = useState(0)
    const [isNavigating, setIsNavigating] = useState(false)

    // Animation values
    const recenterButtonScale = useRef(new Animated.Value(1)).current

    // Map style URL state
    const [mapStyleURL, setMapStyleURL] = useState("mapbox://styles/mapbox/navigation-day-v1")

    const [handleRecenterPress, setHandleRecenterPress] = useState(false)
    const [loading, setLoading] = useState(true)
    const [coords, setCoords] = useState<[number, number]>([userLocation?.longitude ?? 0, userLocation?.latitude ?? 0])

    // Bottom sheet callbacks
    const handleSheetChanges = useCallback(
        (index: number) => {
            console.log("handleSheetChanges", index)
            setCurrentSnapIndex(index)
        },
        [isNavigating],
    )

    useFocusEffect(
        useCallback(() => {
            if (touchOnMap) return

            const startWatchingLocation = async () => {
                const { status } = await Location.requestForegroundPermissionsAsync()
                if (status !== "granted") {
                    Alert.alert("Permission to access location was denied")
                    return
                }
                setLocationPermission(true)

                locationSubscriptionRef.current = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        distanceInterval: 1,
                        timeInterval: 5000,
                    },
                    (location) => {
                        const { latitude, longitude, speed } = location.coords
                        console.log("User location updated", latitude, longitude, speed)
                        setLoading(false)
                        setUserLocation({ latitude, longitude })

                        if (routeCoordinates.length > 0) {
                            const isDeviated = checkRouteDeviation({ latitude, longitude }, routeCoordinates)
                            setIsOffRoute(isDeviated)

                            const currentTime = Date.now()
                            if (isDeviated && currentTime - lastRecalculationTime > RECALCULATION_COOLDOWN) {
                                setShowRecalculatingMessage(true)
                                toast("Recalculating route...")
                                createRouterLine([longitude, latitude], selectedRouteProfile)
                                setLastRecalculationTime(currentTime)

                                setTimeout(() => {
                                    setShowRecalculatingMessage(false)
                                }, 3000)
                            }
                        }

                        if (speed! >= 3) {
                            console.log("User is running")
                        } else if (speed! >= 0.5) {
                            console.log("User is walking")
                        } else {
                            console.log("User is stationary")
                        }
                    },
                )
            }

            startWatchingLocation()
            return () => {
                locationSubscriptionRef.current?.remove()
            }
        }, [touchOnMap]),
    )

    useEffect(() => {
        if (showTraffic) {
            setMapStyleURL("mapbox://styles/mapbox/navigation-day-v1")
        } else {
            setMapStyleURL("mapbox://styles/wadzzo/cm1xtphyn01ci01pi20jhfbto")
        }
    }, [showTraffic])

    useEffect(() => {
        if (selectedRouteProfile !== null && userLocation) {
            createRouterLine([userLocation.longitude, userLocation.latitude], selectedRouteProfile)
        }
    }, [selectedRouteProfile, userLocation])

    useEffect(() => {
        if (userLocation) {
            setCoords([userLocation.longitude, userLocation.latitude])
        }
    }, [userLocation])

    useEffect(() => {
        const fetchData = async () => {
            if (userLocation?.latitude && userLocation?.longitude) {
                await createRouterLine([userLocation.longitude, userLocation.latitude], selectedRouteProfile)
            }
        }
        fetchData()
    }, [userLocation?.latitude, userLocation?.longitude, selectedRouteProfile])

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371e3
        const φ1 = (lat1 * Math.PI) / 180
        const φ2 = (lat2 * Math.PI) / 180
        const Δφ = ((lat2 - lat1) * Math.PI) / 180
        const Δλ = ((lon2 - lon1) * Math.PI) / 180
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    const checkRouteDeviation = (userLocation: LocationType, routeCoords: [number, number][]): boolean => {
        let minDistance = Number.POSITIVE_INFINITY
        for (const coord of routeCoords) {
            const distance = calculateDistance(userLocation.latitude, userLocation.longitude, coord[1], coord[0])
            if (distance < minDistance) {
                minDistance = distance
            }
        }
        return minDistance > ROUTE_DEVIATION_THRESHOLD
    }

    function makeRouterFeature(coordinates: [number, number][]): any {
        const routerFeature = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "LineString",
                        coordinates: coordinates,
                    },
                },
            ],
        }
        return routerFeature
    }

    const handleRecenter = () => {
        if (!cameraRef.current) {
            toast.error("Unable to center the map. User location unavailable.")
            return
        }

        // Animate button press
        Animated.sequence([
            Animated.timing(recenterButtonScale, {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(recenterButtonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start()

        setHandleRecenterPress(true)
        cameraRef.current.setCamera({
            centerCoordinate: [coords[0], coords[1]],
            zoomLevel: 16,
            heading: 0,
        })
        setTimeout(() => {
            setHandleRecenterPress(false)
        }, 8000)
        setTouchOnMap(false)
    }

    const toggleTrafficLines = () => {
        setShowTraffic((prev) => !prev)
        toast(showTraffic ? "Traffic lines hidden" : "Traffic lines visible")
    }

    const handleStartNavigation = () => {
        toast("Starting navigation...")
        setIsNavigating(true)
        setTouchOnMap(false) // Enable follow user mode
    }

    const handleStopNavigation = () => {
        setIsNavigating(false)
        setTouchOnMap(true) // Disable follow user mode
        bottomSheetRef.current?.snapToIndex(0) // Snap back to initial collapsed state
        toast("Navigation stopped")
    }

    async function createRouterLine(coords: [number, number], routeProfile: string): Promise<void> {
        if (!coords[0] || !coords[1]) return

        const startCoords = `${coords[0]},${coords[1]}`
        const endCoords = `${[destinationCoords[0], destinationCoords[1]]}`
        const geometries = "geojson"
        const url = `https://api.mapbox.com/directions/v5/mapbox/${routeProfile}/${startCoords};${endCoords}?alternatives=true&geometries=${geometries}&steps=true&banner_instructions=true&overview=full&voice_instructions=true&access_token=${process.env.EXPO_PUBLIC_MAPBOX_API}`

        console.log("Fetching route from URL:", url)
        try {
            const response = await fetch(url)
            const json = await response.json()
            const data = json.routes.map((data: any) => {
                setDistance((data.distance / 1000).toFixed(2))
                const hours = Math.floor(data.duration / 3600)
                const minutes = Math.floor((data.duration % 3600) / 60)
                setDuration(`${hours.toString().padStart(2, "0")}H:${minutes.toString().padStart(2, "0") + "M"}`)
            })

            const coordinates = json["routes"][0]["geometry"]["coordinates"]
            const destinationCoordinates = json["routes"][0]["geometry"]["coordinates"].slice(-1)[0]
            setDestinationCoords(destinationCoordinates)
            setRouteCoordinates(coordinates)

            if (coordinates.length) {
                const routerFeature = makeRouterFeature([...coordinates])
                setRouteDirections(routerFeature)
            }
            setLoading(false)
        } catch (e) {
            setLoading(false)
            toast.error("Failed to fetch route directions")
        }
    }

    const renderRouteProfile = ({
        item,
    }: {
        item: { id: string; label: string; icon: string }
    }) => (
        <TouchableOpacity
            style={[styles.routeProfileButton, item.id == selectedRouteProfile && styles.selectedRouteProfileButton]}
            onPress={() => setselectedRouteProfile(item.id)}
            activeOpacity={0.8}
        >
            <MaterialCommunityIcons
                name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={24}
                color={item.id == selectedRouteProfile ? "white" : Color.wadzzo}
            />
            <Text
                style={[
                    styles.routeProfileButtonText,
                    item.id == selectedRouteProfile && styles.selectedRouteProfileButtonText,
                ]}
            >
                {item.label}
            </Text>
        </TouchableOpacity>
    )

    return (
        <GestureHandlerRootView style={styles.container}>
            <MapView
                style={styles.map}
                zoomEnabled={true}
                pitchEnabled={true}
                logoEnabled={false}
                attributionEnabled={false}
                styleURL={mapStyleURL}
                rotateEnabled={true}
                onTouchMove={() => {
                    setTouchOnMap(true)
                    setHandleRecenterPress(false)
                }}
            >
                <Camera
                    zoomLevel={14}
                    defaultSettings={{
                        centerCoordinate: [coords[0], coords[1]],
                    }}
                    centerCoordinate={[coords[0], coords[1]]}
                    animationMode={"flyTo"}
                    followZoomLevel={16}
                    followPitch={16}
                    heading={0}
                    pitch={0}

                    ref={cameraRef}
                />

                {routeDirections && (
                    <ShapeSource id="line1" shape={routeDirections}>
                        <LineLayer
                            id="routerLine01"
                            style={{
                                lineColor: Color.wadzzo,
                                lineWidth: 5,
                                lineCap: "round",
                                lineOpacity: 0.8,
                            }}
                        />
                    </ShapeSource>
                )}

                {destinationCoords && (
                    <MarkerView
                        id="destinationPoint"
                        allowOverlap={true}
                        allowOverlapWithPuck={true}
                        coordinate={[destinationCoords[0], destinationCoords[1]]}
                    >
                        <View style={styles.destinationMarker}>
                            <Image
                                source={{
                                    uri: data.Collection?.image_url ?? data.Collection?.brand_image_url,
                                }}
                                style={styles.destinationImage}
                            />
                        </View>
                    </MarkerView>
                )}

                <LocationPuck pulsing={{ isEnabled: true, color: Color.wadzzo }} puckBearingEnabled puckBearing="heading" />
            </MapView>

            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
                <View style={styles.buttonBackground}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                </View>
            </TouchableOpacity>

            {/* Recalculating Message */}
            {showRecalculatingMessage && (
                <View style={styles.recalculatingContainer}>
                    <View style={styles.recalculatingBackground}>
                        <ActivityIndicator size="small" color={Color.wadzzo} />
                        <Text style={styles.recalculatingText}>Recalculating route...</Text>
                    </View>
                </View>
            )}

            {/* Loading Indicator */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <View style={styles.loadingBackground}>
                        <ActivityIndicator size="large" color={Color.wadzzo} />
                        <Text style={styles.loadingText}>Finding route...</Text>
                    </View>
                </View>
            )}

            {/* Bottom Sheet */}
            <BottomSheet
                ref={bottomSheetRef}
                index={0} // Start at the first snap point (destination card)
                snapPoints={snapPoints}
                onChange={handleSheetChanges}
                enablePanDownToClose={false}
                backgroundStyle={styles.bottomSheetBackground}
                handleIndicatorStyle={styles.bottomSheetIndicator}
            >
                <BottomSheetView style={styles.bottomSheetContent}>
                    {/* Destination Info / Navigation Header */}
                    {!loading && routeDirections && (
                        <View style={styles.destinationCard}>

                            <View style={styles.destinationHeader}>
                                <View style={styles.destinationLeftContent}>
                                    <View style={styles.destinationImageContainer}>
                                        {data.Collection?.image_url ?? data.Collection?.brand_image_url ? (
                                            <Image source={{ uri: data.Collection?.image_url ?? data.Collection?.brand_image_url }} style={styles.destinationCardImage} />
                                        ) : (
                                            <View style={styles.destinationIconPlaceholder}>
                                                <MaterialCommunityIcons name="map-marker" size={24} color={Color.wadzzo} />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.destinationInfo}>
                                        <Text style={styles.destinationTitle} numberOfLines={1}>
                                            {data.Collection?.title || "Destination"}
                                        </Text>
                                        <View style={styles.destinationStats}>
                                            <View style={styles.statItem}>
                                                <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                                                <Text style={styles.statText}>{duration}</Text>
                                            </View>
                                            <View style={styles.statDivider} />
                                            <View style={styles.statItem}>
                                                <MaterialCommunityIcons name="map-marker-distance" size={16} color="#666" />
                                                <Text style={styles.statText}>{distance} km</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Column for Start Button and Inline Action Buttons */}
                                <View style={styles.buttonColumnContainer}>

                                    {/* {
                                        isNavigating ? (
                                            <TouchableOpacity style={styles.stopButton} onPress={handleStopNavigation}>
                                                <Text style={styles.stopButtonText}>STOP</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity style={styles.startButton} onPress={handleStartNavigation}>
                                                <Text style={styles.startButtonText}>START</Text>
                                            </TouchableOpacity>
                                        )
                                    } */}


                                    {!isNavigating && (
                                        <View style={styles.inlineActionButtonsRow}>
                                            <TouchableOpacity
                                                style={[styles.inlineTrafficToggleButton, showTraffic && styles.inlineTrafficToggleActive]}
                                                onPress={toggleTrafficLines}
                                                activeOpacity={0.8}
                                            >
                                                <MaterialCommunityIcons
                                                    name={showTraffic ? "traffic-light" : "traffic-light-outline"}
                                                    size={20}
                                                    color={showTraffic ? "white" : "#666"}
                                                />
                                                <Text
                                                    style={[
                                                        styles.inlineTrafficToggleText,
                                                        showTraffic && styles.inlineTrafficToggleTextActive,
                                                    ]}
                                                >
                                                    {showTraffic ? "ON" : "OFF"}
                                                </Text>
                                            </TouchableOpacity>
                                            <Animated.View
                                                style={[styles.inlineRecenterButton, { transform: [{ scale: recenterButtonScale }] }]}
                                            >
                                                <TouchableOpacity
                                                    onPress={handleRecenter}
                                                    activeOpacity={0.8}
                                                    style={[
                                                        styles.inlineRecenterButtonInner,
                                                        {
                                                            backgroundColor: !touchOnMap ? Color.wadzzo : "white",
                                                            borderColor: !touchOnMap ? Color.wadzzo : "#ddd",
                                                        },
                                                    ]}
                                                >
                                                    <MaterialCommunityIcons
                                                        name="crosshairs-gps"
                                                        size={20}
                                                        color={!touchOnMap ? "white" : Color.wadzzo}
                                                    />
                                                </TouchableOpacity>
                                            </Animated.View>
                                        </View>
                                    )}
                                </View>
                            </View>

                        </View>
                    )}

                    {/* Route Profiles (Visible when expanded to second snap point, and not navigating) */}
                    {currentSnapIndex >= 1 && !isNavigating && (
                        <View style={styles.routeProfilesContainer}>
                            <Text style={styles.routeProfilesTitle}>Choose route</Text>
                            <FlatList
                                data={routeProfiles}
                                renderItem={renderRouteProfile}
                                keyExtractor={(item) => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.routeProfilesList}
                            />
                            <View style={styles.routeDetails}>
                                <Text style={styles.routeDetailsTitle}>Route Details</Text>
                                <View style={styles.routeDetailItem}>
                                    <MaterialCommunityIcons name="road" size={20} color="#666" />
                                    <Text style={styles.routeDetailText}>Fastest route available</Text>
                                </View>
                                <View style={styles.routeDetailItem}>
                                    <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#666" />
                                    <Text style={styles.routeDetailText}>{isOffRoute ? "Off route - recalculating" : "On route"}</Text>
                                </View>
                                {selectedRouteProfile === "driving-traffic" && (
                                    <View style={styles.routeDetailItem}>
                                        <MaterialCommunityIcons name="traffic-light" size={20} color={Color.wadzzo} />
                                        <Text style={styles.routeDetailText}>Traffic-optimized route</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}


                </BottomSheetView>
            </BottomSheet>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    backButton: {
        position: "absolute",
        top: Platform.OS === "ios" ? 60 : 40,
        left: 20,
        zIndex: 10,
        borderRadius: 25,
        overflow: "hidden",
    },
    buttonBackground: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Color.wadzzo,
    },
    recalculatingContainer: {
        position: "absolute",
        top: Platform.OS === "ios" ? 120 : 100,
        alignSelf: "center",
        zIndex: 10,
        borderRadius: 20,
        overflow: "hidden",
    },
    recalculatingBackground: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    recalculatingText: {
        marginLeft: 12,
        fontWeight: "600",
        color: "#333",
        fontSize: 16,
    },
    loadingContainer: {
        position: "absolute",
        top: "50%",
        alignSelf: "center",
        zIndex: 10,
        borderRadius: 20,
        overflow: "hidden",
    },
    loadingBackground: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loadingText: {
        marginTop: 12,
        fontWeight: "600",
        color: "#333",
        fontSize: 16,
    },
    destinationMarker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: Color.wadzzo,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    destinationImage: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    // Bottom Sheet Styles
    bottomSheetBackground: {
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    bottomSheetIndicator: {
        backgroundColor: Color.wadzzo,
        width: 40,
    },
    bottomSheetContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    destinationCard: {
        marginBottom: 20,
    },
    destinationHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between", // Distribute space between left content and buttons
    },
    destinationLeftContent: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1, // Allow this section to take available space
        marginRight: 10, // Add some space between content and buttons
    },
    destinationImageContainer: {
        marginRight: 16,
    },
    destinationCardImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: Color.wadzzo,
    },
    destinationIconPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: Color.wadzzo,
    },
    destinationInfo: {
        // Removed flex: 1 to let it size naturally
    },
    destinationTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 8,
    },
    destinationStats: {
        flexDirection: "row",
        alignItems: "center",
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    statText: {
        fontSize: 14,
        color: "#666",
        marginLeft: 4,
        fontWeight: "500",
    },
    statDivider: {
        width: 1,
        height: 16,
        backgroundColor: "#ddd",
        marginHorizontal: 12,
    },
    startButton: {
        backgroundColor: Color.wadzzo,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        alignSelf: "flex-end", // Align to the right within its column
    },
    startButtonText: {
        color: "white",
        fontWeight: "700",
        fontSize: 14,
    },
    routeProfilesContainer: {
        // This container will only be visible when currentSnapIndex is 1
    },
    routeProfilesTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 16,
    },
    routeProfilesList: {
        paddingRight: 20,
    },
    routeProfileButton: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginRight: 16,
        borderRadius: 16,
        backgroundColor: "#f8f9fa",
        borderWidth: 2,
        borderColor: "transparent",
        minWidth: 80,
    },
    selectedRouteProfileButton: {
        backgroundColor: Color.wadzzo,
        borderColor: Color.wadzzo,
    },
    routeProfileButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#666",
        marginTop: 8,
    },
    selectedRouteProfileButtonText: {
        color: "white",
    },
    routeDetails: {
        backgroundColor: "#f8f9fa",
        borderRadius: 12,
        padding: 16,
        marginTop: 20, // Added margin to separate from route profiles list
    },
    routeDetailsTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 12,
    },
    routeDetailItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    routeDetailText: {
        fontSize: 14,
        color: "#666",
        marginLeft: 12,
    },
    // Navigation Mode Styles
    navigationContent: {
        flex: 1,
    },
    navigationHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    navigationTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#333",
    },
    stopButton: {
        backgroundColor: "#ff4444",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    stopButtonText: {
        color: "white",
        fontWeight: "700",
        fontSize: 12,
    },
    nextTurnContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    nextTurnInfo: {
        marginLeft: 16,
        flex: 1,
    },
    nextTurnDistance: {
        fontSize: 16,
        fontWeight: "700",
        color: Color.wadzzo,
        marginBottom: 4,
    },
    nextTurnInstruction: {
        fontSize: 14,
        color: "#666",
    },
    navigationStats: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#f8f9fa",
        padding: 16,
        borderRadius: 12,
    },
    navigationStatItem: {
        alignItems: "center",
    },
    navigationStatValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 4,
    },
    navigationStatLabel: {
        fontSize: 12,
        color: "#666",
        textTransform: "uppercase",
    },
    // New styles for button arrangement
    buttonColumnContainer: {
        flexDirection: "column",
        alignItems: "flex-end", // Align items to the right
    },
    inlineActionButtonsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8, // Space below the START button
    },
    inlineTrafficToggleButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: "transparent",
        marginRight: 8, // Space between traffic and recenter
    },
    inlineTrafficToggleActive: {
        backgroundColor: Color.wadzzo,
        borderColor: Color.wadzzo,
        shadowColor: Color.wadzzo,
        shadowOpacity: 0.2,
    },
    inlineTrafficToggleText: {
        fontSize: 9,
        fontWeight: "700",
        color: "#666",
        marginTop: 2,
        letterSpacing: 0.5,
    },
    inlineTrafficToggleTextActive: {
        color: "white",
    },
    inlineRecenterButton: {
        // No position absolute here
    },
    inlineRecenterButtonInner: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
})
export default StoreLocation