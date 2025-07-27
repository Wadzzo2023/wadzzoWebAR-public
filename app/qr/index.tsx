"use client"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from "react-native"
import { Camera, CameraView } from "expo-camera"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Color } from "@/components/utils/all-colors"
import { useARSelection } from "@/components/hooks/use-ARSelection"
import { useRouter } from "expo-router"

const QRScanner = () => {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const [scanned, setScanned] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [cameraActive, setCameraActive] = useState(true)
    const { data: ARSelectionData, setVisible, setSelectAR, setSelectQR, setTutorialMode, closeModal } = useARSelection()
    const router = useRouter()

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync()
            setHasPermission(status === "granted")
        }
        getCameraPermissions()
        setScanned(false)
        setCameraActive(true)
    }, [])

    // Cleanup camera when component unmounts or navigates away
    useEffect(() => {
        return () => {
            setCameraActive(false)
        }
    }, [])

    const handleQRClose = () => {
        console.log("QR Scanner closed")
        setCameraActive(false) // Deactivate camera first
        setSelectAR(false)
        setSelectQR(false)
        setVisible(false)
        setTutorialMode(false)

        // Add small delay to ensure camera is released
        setTimeout(() => {
            router.back()
        }, 100)
    }

    const handleQRCodeScanned = ({ data }: { data: string }) => {
        if (scanned || isProcessing || !cameraActive) return

        try {
            console.log("Raw QR Code data:", data)
            setIsProcessing(true)
            setScanned(true)
            setCameraActive(false) // Deactivate camera immediately after scan

            let qrData
            let id

            try {
                qrData = JSON.parse(data)
                id = qrData.id
            } catch (parseError) {
                console.log("QR data is not JSON, using as direct ID")
                id = data
            }

            if (!id) {
                Alert.alert("Invalid QR Code", "QR code does not contain a valid ID")
                setScanned(false)
                setIsProcessing(false)
                setCameraActive(true)
                return
            }

            console.log("QR Code scanned with ID:", id)

            // Update AR selection state
            setSelectQR(false)
            setSelectAR(true)

            // Add delay to ensure camera is properly released before AR starts
            setTimeout(() => {
                router.push(`/qr/${id}`)
            }, 200)
        } catch (error) {
            console.error("Error processing QR code:", error)
            Alert.alert("Error", "Failed to process QR code")
            setScanned(false)
            setIsProcessing(false)
            setCameraActive(true)
        }
    }

    if (hasPermission === null) {
        return (
            <View style={styles.containerMaximized}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButtonCamera} onPress={handleQRClose}>
                        <MaterialCommunityIcons name="close" size={20} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Camera Permission</Text>
                </View>
                <View style={styles.contentContainer}>
                    <MaterialCommunityIcons name="camera" size={64} color={Color.wadzzo} />
                    <Text style={styles.text}>Requesting camera permission...</Text>
                    <Text style={styles.subText}>Camera access is needed to scan QR codes</Text>
                </View>
            </View>
        )
    }

    if (hasPermission === false) {
        return (
            <View style={styles.containerMaximized}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButtonCamera} onPress={handleQRClose}>
                        <MaterialCommunityIcons name="close" size={20} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Camera Access</Text>
                </View>
                <View style={styles.contentContainer}>
                    <MaterialCommunityIcons name="camera-off" size={64} color="#ff6b6b" />
                    <Text style={styles.text}>No access to camera</Text>
                    <Text style={styles.subText}>Please enable camera permissions in your device settings to scan QR codes</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={handleQRClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View style={styles.containerMaximized}>
            {cameraActive && (
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing={"back"}
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    onBarcodeScanned={cameraActive ? handleQRCodeScanned : undefined}
                >
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.closeButtonCamera} onPress={handleQRClose}>
                            <MaterialCommunityIcons name="close" size={20} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerText}>Scan Tutorial QR Code</Text>
                    </View>

                    {/* Scanning Frame */}
                    <View style={styles.scanFrame}>
                        <View style={styles.scanCorners}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </View>
                        <View style={styles.scanLine} />
                    </View>

                    {/* Instructions */}
                    <View style={styles.instructionsContainer}>
                        <MaterialCommunityIcons name="qrcode-scan" size={40} color="white" />
                        <Text style={styles.instructionsTitle}>Scan to Start AR Experience</Text>
                        <Text style={styles.instructionsText}>Position a QR code within the frame to begin your AR experience</Text>
                        <Text style={styles.validCodesText}>Scanning will automatically start AR mode</Text>

                        {(scanned || isProcessing) && (
                            <View style={styles.scannedIndicator}>
                                <MaterialCommunityIcons name="check-circle" size={24} color="#4ade80" />
                                <Text style={styles.scannedText}>
                                    {isProcessing ? "Processing QR Code..." : "QR Code Detected! Loading AR..."}
                                </Text>
                            </View>
                        )}
                    </View>
                </CameraView>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    containerMinimized: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "50%",
        zIndex: 1000,
        backgroundColor: "#000000",
        borderBottomWidth: 2,
        borderBottomColor: Color.wadzzo,
    },
    containerMaximized: {
        position: "absolute",
        top: 0,
        left: 0,
        height: "100%",
        right: 0,
        bottom: 0,
        zIndex: 1000,
        backgroundColor: "#000000",
    },
    header: {
        flexDirection: "row",
        zIndex: 1000,
        alignItems: "center",
        paddingTop: Platform.OS === "ios" ? 50 : 30,
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    closeButtonCamera: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        padding: 8,
        borderRadius: 20,
        marginRight: 15,
    },
    headerText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    text: {
        fontSize: 18,
        color: "white",
        textAlign: "center",
        marginTop: 16,
        marginBottom: 8,
        fontWeight: "600",
    },
    subText: {
        fontSize: 14,
        color: "#cccccc",
        textAlign: "center",
        marginBottom: 24,
        paddingHorizontal: 32,
        lineHeight: 20,
    },
    closeButton: {
        backgroundColor: Color.wadzzo,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    closeButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    scanFrame: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: 280,
        height: 280,
        marginTop: -140,
        marginLeft: -140,
    },
    scanCorners: {
        flex: 1,
        position: "relative",
    },
    corner: {
        position: "absolute",
        width: 40,
        height: 40,
        borderColor: Color.wadzzo,
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    scanLine: {
        position: "absolute",
        top: "50%",
        left: 20,
        right: 20,
        height: 2,
        backgroundColor: Color.wadzzo,
        opacity: 0.8,
    },
    instructionsContainer: {
        position: "absolute",
        bottom: 80,
        left: 0,
        right: 0,
        alignItems: "center",
        paddingHorizontal: 24,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        marginHorizontal: 20,
        borderRadius: 12,
        paddingVertical: 20,
    },
    instructionsTitle: {
        color: "white",
        fontSize: 22,
        fontWeight: "bold",
        marginTop: 16,
        marginBottom: 12,
        textAlign: "center",
    },
    instructionsText: {
        color: "#cccccc",
        fontSize: 16,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 8,
    },
    validCodesText: {
        color: Color.wadzzo,
        fontSize: 14,
        textAlign: "center",
        fontStyle: "italic",
        marginBottom: 16,
    },
    scannedIndicator: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        backgroundColor: "rgba(74, 222, 128, 0.2)",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: "#4ade80",
    },
    scannedText: {
        color: "#4ade80",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 12,
    },
})

export default QRScanner
