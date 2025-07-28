"use client"

import { ViroARSceneNavigator } from "@reactvision/react-viro"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { Dimensions, StyleSheet, View, Text, TouchableOpacity, StatusBar } from "react-native"
import { ActivityIndicator, Appbar } from "react-native-paper"
import { Color } from "@/components/utils/all-colors"
import QRscreenAR from "@/components/QRSceneAR"
import { BASE_URL } from "@/components/utils/Common"
import { LinearGradient } from "expo-linear-gradient"
import { MaterialCommunityIcons } from "@expo/vector-icons"

const { width, height } = Dimensions.get("window")

export interface QRItemData {
    creator: {
        id: string
        image: string | null
        name: string
    }
    descriptions: {
        id: string;
        title: string;
        content: string;
        order: number;
        qrItemId: string;
    }[]
    endDate: string
    externalLink: string | null
    id: string
    isActive: boolean
    modelUrl: string
    startDate: string
    title: string
}

export interface QRItemResponse {
    success: boolean
    data: QRItemData
    error?: string
}

const ARViewScreen = () => {
    const router = useRouter()
    const params = useLocalSearchParams()
    const id = (params.id as string)
    const [trackingState, setTrackingState] = useState("Initializing")
    const [loading, setLoading] = useState(true)
    const [arReady, setArReady] = useState(false)

    const [qrItemData, setQrItemData] = useState<QRItemData | null>(null)
    const [dataLoading, setDataLoading] = useState(true)
    const [modelLoading, setModelLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Add delay before initializing AR to ensure camera is released
    useEffect(() => {
        const timer = setTimeout(() => {
            setArReady(true)
            setLoading(false)
        }, 500)

        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        const fetchQRItem = async () => {
            setDataLoading(true)
            setError(null)
            try {
                const response = await fetch(new URL("api/game/qr/get-qr-by-id", BASE_URL).toString(), {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        qrId: id?.toString(),
                    }),
                })

                if (!response.ok) {
                    throw new Error("Failed to fetch QR item")
                }

                const data = await response.json()
                console.log("QR Item Data:", data)
                setQrItemData(data)
            } catch (err) {
                console.error("Error fetching QR item:", err)
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setDataLoading(false)
            }
        }

        fetchQRItem()
    }, [id])

    const handleBackPress = () => {
        setArReady(false)
        router.navigate("/(tabs)/")
    }

    if (!id) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={Color.wadzzo} />
                <LinearGradient colors={[Color.wadzzo, "#1a1a2e", "#0f3460"]} style={styles.gradientContainer}>
                    <View style={styles.modernHeader}>
                        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
                        </TouchableOpacity>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>Error</Text>
                            <Text style={styles.headerSubtitle}>QR Scanner</Text>
                        </View>
                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.errorContainer}>
                        <View style={styles.errorIconContainer}>
                            <View style={styles.iconBackground}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#E24A4A" />
                            </View>
                        </View>
                        <Text style={styles.errorTitle}>No QR Code Found</Text>
                        <Text style={styles.errorText}>Please scan a valid QR code to access the AR experience.</Text>
                        <TouchableOpacity style={styles.modernButton} onPress={handleBackPress}>
                            <LinearGradient colors={[Color.wadzzo, "#357ABD"]} style={styles.buttonGradient}>
                                <MaterialCommunityIcons name="arrow-left" size={20} color="#ffffff" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Go Back</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>
        )
    }

    if (dataLoading || loading || !arReady) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={Color.wadzzo} />
                <Appbar.Header style={styles.appbar}>
                    <Appbar.BackAction disabled={loading} color="white" onPress={handleBackPress} />
                    <Appbar.Content title="AR Scanner" titleStyle={styles.appbarTitle} />
                </Appbar.Header>

                <LinearGradient colors={["#000000", "#1a1a2e", "#16213e"]} style={styles.loadingGradient}>
                    <View style={styles.loadingContainer}>
                        <View style={styles.loadingSpinnerContainer}>
                            <View style={styles.spinnerBackground}>
                                <ActivityIndicator size="large" color={Color.wadzzo} />
                            </View>
                        </View>

                        <View style={styles.loadingTextContainer}>
                            <Text style={styles.loadingTitle}>{dataLoading ? "Preparing AR Experience" : "Initializing Camera"}</Text>
                            <Text style={styles.loadingSubtitle}>
                                {dataLoading ? "Fetching 3D content and details" : "Setting up augmented reality"}
                            </Text>
                        </View>

                        <View style={styles.loadingProgress}>
                            <View style={styles.progressBarContainer}>
                                <View style={styles.progressBar}>
                                    <LinearGradient colors={[Color.wadzzo, "#357ABD"]} style={styles.progressFill} />
                                </View>
                                <Text style={styles.progressText}>{dataLoading ? "Loading content..." : "Preparing camera..."}</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        )
    }

    if (error || !qrItemData) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={Color.wadzzo} />
                <Appbar.Header style={styles.appbar}>
                    <Appbar.BackAction disabled={loading} color="white" onPress={handleBackPress} />
                    <Appbar.Content title="AR Scanner" titleStyle={styles.appbarTitle} />
                </Appbar.Header>

                <LinearGradient colors={["#000000", "#1a1a2e", "#16213e"]} style={styles.errorGradient}>
                    <View style={styles.errorContainer}>
                        <View style={styles.errorIconContainer}>
                            <View style={styles.iconBackground}>
                                <MaterialCommunityIcons name="cloud-off-outline" size={60} color="#E24A4A" />
                            </View>
                        </View>
                        <Text style={styles.errorTitle}>Experience Unavailable</Text>
                        <Text style={styles.errorText}>{error || "The requested AR experience could not be loaded."}</Text>
                        <TouchableOpacity style={styles.modernButton} onPress={handleBackPress}>
                            <LinearGradient colors={[Color.wadzzo, "#357ABD"]} style={styles.buttonGradient}>
                                <MaterialCommunityIcons name="refresh" size={20} color="#ffffff" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Try Again</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Color.wadzzo} />

            {/* Modern Header */}
            <Appbar.Header style={styles.appbar}>
                <Appbar.BackAction disabled={loading} color="white" onPress={handleBackPress} />
                <Appbar.Content title="QR Scanner" titleStyle={styles.appbarTitle} />
            </Appbar.Header>

            {/* AR View */}
            <ViroARSceneNavigator
                autofocus={true}
                initialScene={{
                    scene: () => (
                        <QRscreenAR
                            qrId={id}
                            qrItemData={qrItemData}
                            onModelLoadStart={() => setModelLoading(true)}
                            onModelLoadEnd={() => setModelLoading(false)}
                        />
                    ),
                }}
                style={styles.arNavigator}
                worldAlignment="Gravity"
                videoQuality="High"
            />

            {/* Enhanced Bottom Panel */}
            <View style={styles.bottomPanelContainer}>
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.95)"]} style={styles.bottomPanel}>
                    <View style={styles.statusSection}>
                        <View style={styles.statusIndicator}>
                            <View
                                style={[
                                    styles.statusDot,
                                    {
                                        backgroundColor: modelLoading ? "#FFB800" : "#00C851",
                                        shadowColor: modelLoading ? "#FFB800" : "#00C851",
                                        shadowOffset: { width: 0, height: 0 },
                                        shadowOpacity: 0.8,
                                        shadowRadius: 4,
                                    },
                                ]}
                            />
                            <Text style={styles.statusText}>{modelLoading ? "Loading 3D Content" : "AR Experience Active"}</Text>
                        </View>
                    </View>

                    <View style={styles.instructionSection}>
                        <Text style={styles.instructionTitle}>{modelLoading ? "Please Wait" : "Ready to Explore"}</Text>
                        <Text style={styles.instructionText}>
                            {modelLoading
                                ? "Your 3D model is being prepared for the best AR experience"
                                : "Tap the 3D model to view detailed information and interact with the content"}
                        </Text>
                    </View>

                    {modelLoading && (
                        <View style={styles.loadingIndicator}>
                            <ActivityIndicator size="small" color={Color.wadzzo} />
                            <Text style={styles.loadingIndicatorText}>Processing 3D assets...</Text>
                        </View>
                    )}
                </LinearGradient>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000000",
    },
    gradientContainer: {
        flex: 1,
    },
    loadingGradient: {
        flex: 1,
    },
    errorGradient: {
        flex: 1,
    },
    appbar: {
        elevation: 8,
        backgroundColor: Color.wadzzo,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
    appbarTitle: {
        textAlign: "center",
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "bold",
    },
    modernHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    headerContent: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 20,
    },
    headerTitle: {
        color: "#ffffff",
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 2,
    },
    headerSubtitle: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 14,
        fontWeight: "400",
        textAlign: "center",
    },
    headerSpacer: {
        width: 44,
    },
    arNavigator: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30,
    },
    loadingSpinnerContainer: {
        marginBottom: 40,
    },
    spinnerBackground: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    loadingTextContainer: {
        alignItems: "center",
        marginBottom: 40,
    },
    loadingTitle: {
        color: "#ffffff",
        fontSize: 26,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 12,
    },
    loadingSubtitle: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 16,
        fontWeight: "400",
        textAlign: "center",
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    loadingProgress: {
        width: "100%",
        alignItems: "center",
    },
    progressBarContainer: {
        width: "100%",
        alignItems: "center",
    },
    progressBar: {
        width: "85%",
        height: 6,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 12,
    },
    progressFill: {
        height: "100%",
        width: "65%",
        borderRadius: 3,
    },
    progressText: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 14,
        fontWeight: "400",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30,
    },
    errorIconContainer: {
        marginBottom: 30,
    },
    iconBackground: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(226, 74, 74, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "rgba(226, 74, 74, 0.3)",
    },
    errorTitle: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 16,
    },
    errorText: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 16,
        fontWeight: "400",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 40,
        paddingHorizontal: 10,
    },
    modernButton: {
        borderRadius: 28,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonGradient: {
        flexDirection: "row",
        paddingHorizontal: 32,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
    },
    bottomPanelContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
    bottomPanel: {
        paddingTop: 30,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    statusSection: {
        marginBottom: 20,
    },
    statusIndicator: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    statusText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "500",
    },
    instructionSection: {
        alignItems: "center",
    },
    instructionTitle: {
        color: "#ffffff",
        fontSize: 22,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 12,
    },
    instructionText: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: 15,
        fontWeight: "400",
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    loadingIndicator: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        backgroundColor: `rgba(${Number.parseInt(Color.wadzzo.slice(1, 3), 16)}, ${Number.parseInt(Color.wadzzo.slice(3, 5), 16)}, ${Number.parseInt(Color.wadzzo.slice(5, 7), 16)}, 0.15)`,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: `rgba(${Number.parseInt(Color.wadzzo.slice(1, 3), 16)}, ${Number.parseInt(Color.wadzzo.slice(3, 5), 16)}, ${Number.parseInt(Color.wadzzo.slice(5, 7), 16)}, 0.3)`,
    },
    loadingIndicatorText: {
        color: Color.wadzzo,
        fontSize: 13,
        fontWeight: "500",
        marginLeft: 10,
    },
})

export default ARViewScreen
