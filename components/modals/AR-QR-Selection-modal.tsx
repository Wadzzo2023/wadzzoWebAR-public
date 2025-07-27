import type React from "react"
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useState, useRef } from "react"
import { useARSelection } from "../hooks/use-ARSelection"
import { Color } from "../utils/all-colors"
import { useLocationService } from "../hooks/useLocationService"
import { useRouter } from "expo-router"

const { width, height } = Dimensions.get("window")

export const ARQRSelectionModal: React.FC = () => {
    const { data, setVisible, setSelectAR, setSelectQR, closeModal } = useARSelection()
    const [loadingForAR, setLoadingForAR] = useState(false)
    const [loadingForQR, setLoadingForQR] = useState(false)

    // Use refs to prevent multiple navigation calls
    const isNavigatingAR = useRef(false)
    const isNavigatingQR = useRef(false)

    const {
        userLocation,
        nearestPin,
        nearestPinDistance,
        setUserLocation,
        setAllLocations,
        setMultipleAr,
        nearbyPins,
    } = useLocationService()

    const router = useRouter()

    const handleARPress = async () => {
        // Prevent multiple calls
        if (loadingForAR || isNavigatingAR.current) return

        try {
            setLoadingForAR(true)
            isNavigatingAR.current = true

            // Simulate preparation time
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Set AR selection state
            setSelectAR(true)
            setMultipleAr()

            // Close modal first
            setVisible(false)

            // Small delay to ensure modal closes before navigation
            setTimeout(() => {
                router.push("/ARScreen")
                // Reset loading state after navigation
                setLoadingForAR(false)
                isNavigatingAR.current = false
            }, 100)

        } catch (error) {
            console.error("Error preparing AR:", error)
            setLoadingForAR(false)
            isNavigatingAR.current = false
        }
    }

    const handleQRPress = async () => {
        // Prevent multiple calls
        if (loadingForQR || isNavigatingQR.current) return

        try {
            setLoadingForQR(true)
            isNavigatingQR.current = true

            // Simulate preparation time
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Set QR selection state
            setSelectQR(true)

            setVisible(false)

            setTimeout(() => {
                router.push("/qr/")
                setLoadingForQR(false)
                isNavigatingQR.current = false
            }, 100)

        } catch (error) {
            console.error("Error preparing QR:", error)
            setLoadingForQR(false)
            isNavigatingQR.current = false
        }
    }

    const handleCloseModal = () => {
        // Don't allow closing while loading
        if (loadingForAR || loadingForQR) return
        closeModal()
    }

    return (
        <Modal
            visible={data.visible}
            transparent
            animationType="fade"
            onRequestClose={handleCloseModal}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Choose Experience</Text>
                        <TouchableOpacity
                            onPress={handleCloseModal}
                            style={[
                                styles.closeButton,
                                (loadingForAR || loadingForQR) && styles.disabledButton
                            ]}
                            disabled={loadingForAR || loadingForQR}
                        >
                            <MaterialCommunityIcons
                                name="close"
                                size={24}
                                color={(loadingForAR || loadingForQR) ? Color.secondary : Color.wadzzo}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Options */}
                    <View style={styles.optionsContainer}>
                        {/* AR Option */}
                        <TouchableOpacity
                            style={[
                                styles.optionButton,
                                loadingForAR && styles.loadingButton,
                                (loadingForQR || loadingForAR) && styles.disabledOption
                            ]}
                            onPress={handleARPress}
                            activeOpacity={0.8}
                            disabled={loadingForAR || loadingForQR}
                        >
                            <View style={styles.iconContainer}>
                                {loadingForAR ? (
                                    <ActivityIndicator size="large" color={Color.wadzzo} />
                                ) : (
                                    <MaterialCommunityIcons name="cube-scan" size={48} color={Color.wadzzo} />
                                )}
                            </View>
                            <Text style={[styles.optionTitle, loadingForAR && styles.loadingText]}>
                                {loadingForAR ? "Preparing..." : "Go to AR"}
                            </Text>
                            <Text style={styles.optionDescription}>
                                {loadingForAR
                                    ? "Setting up AR experience, please wait..."
                                    : "Explore AR pins and collect rewards"
                                }
                            </Text>
                        </TouchableOpacity>

                        {/* QR Option */}
                        <TouchableOpacity
                            style={[
                                styles.optionButton,
                                loadingForQR && styles.loadingButton,
                                (loadingForAR || loadingForQR) && styles.disabledOption
                            ]}
                            onPress={handleQRPress}
                            activeOpacity={0.8}
                            disabled={loadingForAR || loadingForQR}
                        >
                            <View style={styles.iconContainer}>
                                {loadingForQR ? (
                                    <ActivityIndicator size="large" color={Color.wadzzo} />
                                ) : (
                                    <MaterialCommunityIcons name="qrcode-scan" size={48} color={Color.wadzzo} />
                                )}
                            </View>
                            <Text style={[styles.optionTitle, loadingForQR && styles.loadingText]}>
                                {loadingForQR ? "Preparing..." : "Go to QR"}
                            </Text>
                            <Text style={styles.optionDescription}>
                                {loadingForQR
                                    ? "Setting up QR experience, please wait..."
                                    : "Scan QR codes to collect pins and unlock rewards"
                                }
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        backgroundColor: Color.offWhite,
        borderRadius: 20,
        width: width * 0.85,
        maxWidth: 400,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
    closeButton: {
        padding: 4,
    },
    disabledButton: {
        opacity: 0.5,
    },
    optionsContainer: {
        gap: 16,
    },
    optionButton: {
        backgroundColor: Color.white,
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "transparent",
    },
    loadingButton: {
        borderColor: Color.wadzzo,
        backgroundColor: `${Color.wadzzo}05`,
    },
    disabledOption: {
        opacity: 0.6,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${Color.wadzzo}20`,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    optionTitle: {
        textTransform: "uppercase",
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 8,
    },
    loadingText: {
        color: Color.wadzzo,
    },
    optionDescription: {
        fontSize: 14,
        opacity: 0.7,
        textAlign: "center",
        lineHeight: 20,
    },
})