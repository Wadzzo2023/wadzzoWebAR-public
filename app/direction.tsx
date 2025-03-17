"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import {
    View,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Platform,
    Alert,
} from "react-native"
import Mapbox, { Logger, Camera, LocationPuck, MapView, MarkerView, ShapeSource, LineLayer } from "@rnmapbox/maps"
import * as Location from "expo-location"

import { Text } from "react-native"
import { useModal } from "@/components/hooks/useModal"
import { useDirectionStore } from "@/components/store/direction-store"
import { Color } from "@/components/utils/all-colors"
import { Image } from "react-native"
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons"
import { Button, Switch } from "react-native-paper"
import { toast } from "@backpackapp-io/react-native-toast"
import { router, useFocusEffect } from "expo-router"

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
]

const StoreLocation: React.FC = () => {
    const { data } = useModal()
    const { data: DirectionData } = useDirectionStore()
    const [routeDirections, setRouteDirections] = useState<any | null>(null)
    const [showTraffic, setShowTraffic] = useState(true) // New state for toggling traffic lines

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

    // Map style URL state - we'll toggle between styles with and without traffic
    const [mapStyleURL, setMapStyleURL] = useState("mapbox://styles/mapbox/navigation-day-v1")

    useFocusEffect(
        useCallback(() => {
            if (touchOnMap) return // Exit early if trackingMode is false
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
                        console.log("User location updated", latitude, longitude, speed)
                        setLoading(false)
                        setUserLocation({ latitude, longitude })

                        // Check if user is off route and handle recalculation
                        if (routeCoordinates.length > 0) {
                            const isDeviated = checkRouteDeviation({ latitude, longitude }, routeCoordinates)
                            setIsOffRoute(isDeviated)

                            // Recalculate route if user is off route and cooldown period has passed
                            const currentTime = Date.now()
                            if (isDeviated && currentTime - lastRecalculationTime > RECALCULATION_COOLDOWN) {
                                setShowRecalculatingMessage(true)
                                toast("Recalculating route...")
                                createRouterLine([longitude, latitude], selectedRouteProfile)
                                setLastRecalculationTime(currentTime)

                                // Hide recalculating message after 3 seconds
                                setTimeout(() => {
                                    setShowRecalculatingMessage(false)
                                }, 3000)
                            }
                        }

                        // Track user activity based on speed
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

    // Effect to update map style when traffic toggle changes
    useEffect(() => {
        if (showTraffic) {
            setMapStyleURL("mapbox://styles/mapbox/navigation-day-v1") // Style with traffic
        } else {
            setMapStyleURL("mapbox://styles/wadzzo/cm1xtphyn01ci01pi20jhfbto") // Style without traffic
        }
    }, [showTraffic])

    const [handleRecenterPress, setHandleRecenterPress] = useState(false)

    const [loading, setLoading] = useState(true)

    const [coords, setCoords] = useState<[number, number]>([userLocation?.longitude ?? 0, userLocation?.latitude ?? 0])

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

    // Calculate distance between two points in meters
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371e3 // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180
        const φ2 = (lat2 * Math.PI) / 180
        const Δφ = ((lat2 - lat1) * Math.PI) / 180
        const Δλ = ((lon2 - lon1) * Math.PI) / 180

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    // Check if user has deviated from the route
    const checkRouteDeviation = (userLocation: LocationType, routeCoords: [number, number][]): boolean => {
        // Find the closest point on the route to the user
        let minDistance = Number.POSITIVE_INFINITY

        for (const coord of routeCoords) {
            const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                coord[1], // Mapbox coordinates are [longitude, latitude]
                coord[0],
            )

            if (distance < minDistance) {
                minDistance = distance
            }
        }

        // If the minimum distance is greater than the threshold, user is off route
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

    // Toggle traffic lines function
    const toggleTrafficLines = () => {
        setShowTraffic((prev) => !prev)
        toast(showTraffic ? "Traffic lines hidden" : "Traffic lines visible")
    }

    async function createRouterLine(coords: [number, number], routeProfile: string): Promise<void> {
        if (!coords[0] || !coords[1]) return

        const startCoords = `${coords[0]},${coords[1]}`
        const endCoords = `${[destinationCoords[0], destinationCoords[1]]}`

        const geometries = "geojson"
        const url = `https://api.mapbox.com/directions/v5/mapbox/${routeProfile}/${startCoords};${endCoords}?alternatives=true&geometries=${geometries}&steps=true&banner_instructions=true&overview=full&voice_instructions=true&access_token=${process.env.EXPO_PUBLIC_MAPBOX_API}`

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

            // Store route coordinates for deviation detection
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

    const renderItem = ({
        item,
    }: {
        item: { id: string; label: string; icon: string }
    }) => (
        <TouchableOpacity
            style={[styles.routeProfileButton, item.id == selectedRouteProfile && styles.selectedRouteProfileButton]}
            onPress={() => setselectedRouteProfile(item.id)}
        >
            <Text
                style={[
                    styles.routeProfileButtonText,
                    item.id == selectedRouteProfile && styles.selectedRouteProfileButtonText,
                ]}
            >
                <MaterialCommunityIcons
                    name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={24}
                    color="black"
                />
                {item.label}
            </Text>
        </TouchableOpacity>
    )

    return (
        <View style={styles.container}>
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
                    zoomLevel={16}
                    defaultSettings={{
                        centerCoordinate: [coords[0], coords[1]],
                    }}
                    centerCoordinate={[coords[0], coords[1]]}
                    animationMode={"flyTo"}
                    followZoomLevel={16}
                    followPitch={16}
                    heading={0}
                    pitch={0}
                    allowUpdates={true}
                    ref={cameraRef}
                />
                {routeDirections && (
                    <ShapeSource id="line1" shape={routeDirections}>
                        <LineLayer
                            id="routerLine01"
                            style={{
                                lineColor: "#493D9E",
                                lineWidth: 4,
                                lineCap: "round",
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
                        <Image
                            source={{
                                uri: data.Collection?.brand_image_url,
                            }}
                            height={30}
                            width={30}
                            style={[
                                {
                                    height: 30,
                                    width: 30,
                                    borderWidth: 2,
                                    borderColor: Color.wadzzo,
                                },
                                !data.Collection?.auto_collect && {
                                    borderRadius: 20,
                                },
                                data.Collection?.auto_collect && { opacity: 0.4 },
                            ]}
                        />
                    </MarkerView>
                )}
                <LocationPuck pulsing={{ isEnabled: true }} puckBearingEnabled puckBearing="heading" />
            </MapView>

            <Button
                mode="contained"
                onPress={() => {
                    router.back()
                }}
                style={{
                    position: "absolute",
                    top: 50,
                    left: 10,
                    zIndex: 1,
                    backgroundColor: Color.wadzzo,
                    padding: 0,
                    borderRadius: 10,
                }}
            >
                <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </Button>

            {/* Traffic Toggle Button */}
            <View style={styles.toggleContainer}>
                <MaterialCommunityIcons name="alarm-light-off" size={20} color={!showTraffic ? Color.light.error : "#666"} />
                <Switch value={showTraffic} onValueChange={toggleTrafficLines} color={Color.wadzzo} style={styles.toggle} />
                <MaterialCommunityIcons name="traffic-light" size={20} color={showTraffic ? Color.wadzzo : "#666"} />
            </View>

            <TouchableOpacity
                style={[styles.recenterButton, { borderColor: !touchOnMap ? Color.wadzzo : "transparent" }]}
                onPress={handleRecenter}
            >
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color={!touchOnMap ? Color.wadzzo : "black"} />
            </TouchableOpacity>

            {/* Recalculating route notification */}
            {showRecalculatingMessage && (
                <View style={styles.recalculatingContainer}>
                    <MaterialCommunityIcons name="refresh" size={20} color={Color.wadzzo} style={styles.spinningIcon} />
                    <Text style={styles.recalculatingText}>Recalculating route...</Text>
                </View>
            )}

            <FlatList
                data={routeProfiles}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                contentContainerStyle={styles.routeProfileList}
                showsHorizontalScrollIndicator={false}
                style={styles.flatList}
            />

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}></TouchableOpacity>
            {loading ? (
                <ActivityIndicator size="large" color="white" style={styles.loadingIndicator} />
            ) : (
                routeDirections && (
                    <View style={styles.cardContainer}>
                        <CustomLocationCard
                            title={data.Collection?.title || "Destination"}
                            duration={duration}
                            distance={distance}
                            brandImageUrl={data.Collection?.brand_image_url}
                            backgroundColor={Color.wadzzo}
                            onPress={() => { }}
                        />
                    </View>
                )
            )}
        </View>
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
        top: 20,
        left: 20,
        zIndex: 1,
        backgroundColor: "rgba(0, 0 ,0 , 0.5)",
        borderRadius: 20,
        padding: 8,
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
    loadingIndicator: {
        position: "absolute",
        top: "50%",
        left: "50%",
        zIndex: 2,
    },
    cardContainer: {
        position: "absolute",
        top: 50,
        right: 10,
        zIndex: 1,
    },
    destinationIcon: {
        width: 30,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    routeProfileList: {
        backgroundColor: "transparent",
        zIndex: 1,
    },
    flatList: {
        position: "absolute",
        bottom: 20,
        left: Dimensions.get("window").width / 2 - 170,
        right: 0,
        backgroundColor: "transparent",
        zIndex: 1,
    },
    routeProfileButton: {
        width: 100,
        height: 40,
        borderRadius: 10,
        marginHorizontal: 5,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Color.offWhite,
        color: "black",
    },
    selectedRouteProfileButton: {
        backgroundColor: Color.wadzzo,
        borderColor: "#FA9E14",
    },
    routeProfileButtonText: {
        color: "black",
    },
    selectedRouteProfileButtonText: {
        color: "black",
    },
    recalculatingContainer: {
        position: "absolute",
        top: 100,
        alignSelf: "center",
        backgroundColor: "white",
        padding: 10,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 10,
    },
    recalculatingText: {
        marginLeft: 8,
        fontWeight: "500",
    },
    spinningIcon: {
        transform: [{ rotate: "0deg" }],
    },
    // New styles for toggle button
    toggleContainer: {
        position: "absolute",
        bottom: Platform.OS === "ios" ? 150 : 140,
        right: 0,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 8,
        flexDirection: "row",
        alignItems: "center",
        zIndex: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    toggle: {
        marginLeft: 5,
        transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    },
    toggleText: {
        marginLeft: 5,
        fontSize: 12,
        fontWeight: "500",
        color: "#333",
    },
})

export default StoreLocation
interface CustomLocationCardProps {
    title: string
    duration: string | null
    distance: string | null
    brandImageUrl?: string
    backgroundColor?: string
    onPress: () => void
}

const CustomLocationCard = ({
    title,
    duration,
    distance,
    brandImageUrl,
    backgroundColor = "#493D9E", // Default to wadzzo color
    onPress,
}: CustomLocationCardProps) => {
    return (
        <TouchableOpacity style={[cardStyles.card, { backgroundColor }]} onPress={onPress} activeOpacity={0.9}>
            <View style={cardStyles.cardHeader}>
                {brandImageUrl ? (
                    <Image source={{ uri: brandImageUrl }} style={cardStyles.brandImage} />
                ) : (
                    <View style={cardStyles.iconPlaceholder}>
                        <MaterialCommunityIcons name="map-marker" size={20} color="white" />
                    </View>
                )}
                <Text style={cardStyles.title} numberOfLines={1} ellipsizeMode="tail">
                    {title}
                </Text>
            </View>

            <View style={cardStyles.cardContent}>
                <View style={cardStyles.infoContainer}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color="white" />
                    <Text style={cardStyles.durationText}>{duration}</Text>
                </View>

                <View style={cardStyles.divider} />

                <View style={cardStyles.infoContainer}>
                    <MaterialCommunityIcons name="map-marker-distance" size={18} color="white" />
                    <Text style={cardStyles.distanceText}>{distance} km</Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}

const cardStyles = StyleSheet.create({
    card: {
        width: 220,
        borderRadius: 12,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: "hidden",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    brandImage: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.5)",
    },
    iconPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
    title: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        flex: 1,
    },
    cardContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    infoContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    durationText: {
        color: "white",
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 4,
    },
    distanceText: {
        color: "white",
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 4,
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        marginHorizontal: 10,
    },
})

