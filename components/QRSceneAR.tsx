import { useState, useEffect, useRef, useMemo } from "react"
import {
    ViroARScene,
    ViroText,
    ViroBox,
    ViroAmbientLight,
    ViroSpotLight,
    ViroNode,
    ViroAnimations,
    ViroSphere,
    ViroTrackingStateConstants,
    Viro3DObject,
    ViroMaterials,
    ViroQuad,
    type ViroTrackingReason,
} from "@reactvision/react-viro"

interface Description {
    id: string
    title: string
    content: string
    order: number
    qrItemId: string
}

interface QRItemData {
    creator: {
        id: string
        image: string | null
        name: string
    }
    descriptions: Description[]
    endDate: string
    externalLink: string | null
    id: string
    isActive: boolean
    modelUrl: string
    startDate: string
    title: string
}

interface ViroAppProps {
    qrId: string
    qrItemData: QRItemData
    onModelLoadStart?: () => void
    onModelLoadEnd?: () => void
    modelScale: number
    modelRotation?: number[]
    modelPosition?: number[]
    onScaleChange?: (scale: number) => void
    onRotationChange?: (rotation: number[]) => void
    onPositionChange?: (position: number[]) => void
}

interface ARSceneWithIDProps {
    sceneNavigator?: {
        viroAppProps?: ViroAppProps
        [key: string]: any
    }
    arSceneNavigator?: any
}

interface BillboardPosition {
    x: number
    y: number
    z: number
}

const EnhancedMultiDescriptionAR = (props: ARSceneWithIDProps) => {
    const viroAppProps = props.sceneNavigator?.viroAppProps
    const qrId = viroAppProps?.qrId ?? ""
    const qrItemData = viroAppProps?.qrItemData
    const onModelLoadStart = viroAppProps?.onModelLoadStart
    const onModelLoadEnd = viroAppProps?.onModelLoadEnd
    const modelScale = viroAppProps?.modelScale ?? 1
    const onScaleChange = viroAppProps?.onScaleChange
    const onRotationChange = viroAppProps?.onRotationChange
    const onPositionChange = viroAppProps?.onPositionChange
    const rr = viroAppProps?.modelRotation
    const rr0 = rr?.[0] ?? 0
    const rr1 = rr?.[1] ?? 0
    const rr2 = rr?.[2] ?? 0
    const modelRotation = useMemo<[number, number, number]>(
        () => [rr0, rr1, rr2],
        [rr0, rr1, rr2],
    )
    const rp = viroAppProps?.modelPosition
    const rp0 = rp?.[0] ?? 0
    const rp1 = rp?.[1] ?? 0
    const rp2 = rp?.[2] ?? 0
    const modelPosition = useMemo<[number, number, number]>(
        () => [rp0, rp1, rp2],
        [rp0, rp1, rp2],
    )

    const [trackingStatus, setTrackingStatus] = useState<ViroTrackingStateConstants>(
        ViroTrackingStateConstants.TRACKING_UNAVAILABLE,
    )

    const currentScaleRef = useRef(1)
    const lastPinchRef = useRef(1)
    const lastRotateRef = useRef(0)
    const currentRotationYRef = useRef(0)

    const [arInitialized, setArInitialized] = useState(false)
    const [modelLoaded, setModelLoaded] = useState(false)
    const [modelError, setModelError] = useState(false)
    const [showInfo, setShowInfo] = useState(false)
    const [loadingProgress, setLoadingProgress] = useState(0)
    const [retryCount, setRetryCount] = useState(0)
    const [isRetrying, setIsRetrying] = useState(false)
    const [modelKey, setModelKey] = useState(0)
    const [modelBounds, setModelBounds] = useState({ width: 1, height: 1, depth: 1 })
    const [showBillboards, setShowBillboards] = useState(true)

    const MAX_RETRY_ATTEMPTS = 3

    useEffect(() => {
        currentScaleRef.current = modelScale
    }, [modelScale])

    useEffect(() => {
        const yRot = modelRotation[1] ?? 0
        lastRotateRef.current = yRot
        currentRotationYRef.current = yRot
    }, [modelRotation])

    const handlePinch = (pinchState: number, scaleFactor: number) => {
        if (pinchState === 1) {
            lastPinchRef.current = currentScaleRef.current
        } else if (pinchState === 2) {
            const newScale = lastPinchRef.current * scaleFactor
            const clamped = Math.min(3.0, Math.max(0.3, newScale))
            currentScaleRef.current = clamped
            onScaleChange?.(clamped)
        }
    }

    const handleRotate = (rotateState: number, rotationFactor: number) => {
        if (rotateState === 1) {
            lastRotateRef.current = currentRotationYRef.current
        } else if (rotateState === 2) {
            const newRotation = lastRotateRef.current - rotationFactor
            currentRotationYRef.current = newRotation
            onRotationChange?.([0, newRotation, 0])
        }
    }

    const handleDrag = (dragToPos: number[]) => {
        onPositionChange?.(dragToPos)
    }

    const getBillboardPositions = (count: number): BillboardPosition[] => {
        const positions: BillboardPosition[] = []
        const baseDistance = 6 // Distance from center
        const yOffset = 0 // Same height as model

        switch (count) {
            case 1:
                positions.push({ x: baseDistance, y: yOffset, z: 0 })
                break
            case 2:
                positions.push({ x: -baseDistance, y: yOffset, z: 0 }) // Left
                positions.push({ x: baseDistance, y: yOffset, z: 0 }) // Right
                break
            case 3:
                positions.push({ x: -baseDistance, y: yOffset, z: 0 }) // Left
                positions.push({ x: baseDistance, y: yOffset, z: 0 }) // Right
                positions.push({ x: 0, y: yOffset, z: baseDistance }) // Back
                break
            case 4:
                positions.push({ x: -baseDistance, y: yOffset + 4, z: -2 }) // Left Top
                positions.push({ x: -baseDistance, y: yOffset - 4, z: -2 }) // Left Bottom
                positions.push({ x: baseDistance, y: yOffset + 4, z: -2 }) // Right Top
                positions.push({ x: baseDistance, y: yOffset - 4, z: -2 }) // Right Bottom
                break
            default:
                positions.push({ x: baseDistance, y: yOffset, z: 0 })
        }
        return positions
    }

    const getBillboardRotation = (count: number): BillboardPosition[] => {
        const Rotation: BillboardPosition[] = []
        switch (count) {
            case 1:
                Rotation.push({ x: 0, y: -25, z: 0 })
                break
            case 2:
                Rotation.push({ x: 0, y: 25, z: 0 })
                Rotation.push({ x: 0, y: -25, z: 0 })
                break
            case 3:
                Rotation.push({ x: 0, y: 25, z: 0 })
                Rotation.push({ x: 0, y: -25, z: 0 })
                Rotation.push({ x: 0, y: 0, z: 0 })
                break
            case 4:
                Rotation.push({ x: 0, y: 25, z: 0 })
                Rotation.push({ x: 0, y: 25, z: 0 })
                Rotation.push({ x: 0, y: -25, z: 0 })
                Rotation.push({ x: 0, y: -25, z: 0 })
                break
            default:
                Rotation.push({ x: 0, y: 0, z: 0 })
        }
        return Rotation
    }

    // Progress bar animation
    useEffect(() => {
        if (!modelLoaded && !modelError && qrItemData?.modelUrl) {
            const interval = setInterval(() => {
                setLoadingProgress((prev) => {
                    if (prev >= 90) return 90
                    return prev + Math.random() * 15
                })
            }, 200)
            return () => clearInterval(interval)
        }
    }, [modelLoaded, modelError, qrItemData?.modelUrl, modelKey])

    const handleARInitialized = (state: ViroTrackingStateConstants, reason: ViroTrackingReason) => {
        console.log("AR Tracking State:", state, "Reason:", reason)
        setTrackingStatus(state)
        if (state === ViroTrackingStateConstants.TRACKING_NORMAL) {
            setArInitialized(true)
        }
    }

    const handleModelLoadStart = () => {
        console.log("3D Model loading started - Attempt:", retryCount + 1)
        setModelLoaded(false)
        setModelError(false)
        setLoadingProgress(10)
        setIsRetrying(false)
        onModelLoadStart?.()
    }

    const handleModelLoadEnd = () => {
        console.log("3D Model loading completed successfully")
        setModelLoaded(true)
        setLoadingProgress(100)
        setRetryCount(0)
        estimateModelBounds()
        onModelLoadEnd?.()
    }

    const handleModelLoadError = (error: any) => {
        console.error("3D Model loading error:", error, "Attempt:", retryCount + 1)
        setLoadingProgress(0)
        if (retryCount < MAX_RETRY_ATTEMPTS) {
            setIsRetrying(true)
            setRetryCount((prev) => prev + 1)
            setTimeout(() => {
                console.log("Retrying model load, attempt:", retryCount + 2)
                setModelKey((prev) => prev + 1)
            }, 2000)
        } else {
            setModelError(true)
            setIsRetrying(false)
            onModelLoadEnd?.()
        }
    }

    const handleModelHover = () => {
        if (modelLoaded && !showInfo) {
            setShowInfo(true)
        }
    }

    const estimateModelBounds = () => {
        const fileExtension = qrItemData?.modelUrl?.split(".").pop()?.toLowerCase()
        let estimatedBounds = { width: 1.2, height: 1.4, depth: 1.2 }

        switch (fileExtension) {
            case "glb":
            case "gltf":
                estimatedBounds = { width: 1.4, height: 1.6, depth: 1.4 }
                break
            case "obj":
                estimatedBounds = { width: 1.2, height: 1.4, depth: 1.2 }
                break
            case "fbx":
                estimatedBounds = { width: 1.3, height: 1.5, depth: 1.3 }
                break
        }
        setModelBounds(estimatedBounds)
    }

    const getMainBillboardPosition = (): [number, number, number] => {
        const yOffset = modelBounds.height * modelScale + 4
        return [0, yOffset, -4]
    }

    const getModelType = (url: string): "GLB" | "OBJ" | "VRX" | "GLTF" => {
        const extension = url.split(".").pop()?.toLowerCase()
        switch (extension) {
            case "obj":
                return "OBJ"
            case "gltf":
                return "GLTF"
            case "vrx":
                return "VRX"
            case "glb":
            default:
                return "GLB"
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    if (!qrItemData) {
        return (
            <ViroARScene>
                <ViroAmbientLight color="#ffffff" intensity={250} />
                <ViroText
                    text="Loading..."
                    position={[0, 0, -3]}
                    style={{ fontSize: 22, color: "#ffffff", textAlign: "center" }}
                />
            </ViroARScene>
        )
    }

    const sortedDescriptions = qrItemData.descriptions.sort((a, b) => a.order - b.order)
    const billboardPositions = getBillboardPositions(sortedDescriptions.length)
    const billboardRotations = getBillboardRotation(sortedDescriptions.length)

    return (
        <ViroARScene onTrackingUpdated={handleARInitialized}>
            {/* Enhanced Lighting */}
            <ViroAmbientLight color="#ffffff" intensity={250} />
            <ViroSpotLight
                color="#ffffff"
                direction={[0, -1, 0]}
                position={[0, 6, 0]}
                intensity={1000}
                innerAngle={15}
                outerAngle={45}
                castsShadow={true}
            />
            <ViroSpotLight
                color="#64B5F6"
                direction={[1, -0.5, -1]}
                position={[-3, 4, 3]}
                intensity={500}
                innerAngle={20}
                outerAngle={60}
            />
            <ViroSpotLight
                color="#81C784"
                direction={[-1, -0.5, -1]}
                position={[3, 4, 3]}
                intensity={400}
                innerAngle={25}
                outerAngle={70}
            />

            {/* AR Content */}
            {arInitialized && (
                <ViroNode position={[0, 0, -6]}>
                    {/* Enhanced Loading State */}
                    {!modelLoaded && !modelError && qrItemData.modelUrl && (
                        <ViroNode position={[0, 0, 0]}>
                            <ViroQuad position={[0, 0, -0.01]} scale={[4, 3, 1]} materials={["loadingBg"]} />
                            <ViroNode position={[0, 0.6, 0]}>
                                <ViroSphere
                                    radius={0.1}
                                    materials={["loadingCore"]}
                                    animation={{ name: "loadingPulse", run: true, loop: true }}
                                />
                                <ViroSphere
                                    radius={0.03}
                                    position={[0.2, 0, 0]}
                                    materials={["loadingDot1"]}
                                    animation={{ name: "orbitSpin", run: true, loop: true }}
                                />
                                <ViroSphere
                                    radius={0.03}
                                    position={[0, 0.2, 0]}
                                    materials={["loadingDot2"]}
                                    animation={{ name: "orbitSpin", run: true, loop: true }}
                                />
                                <ViroSphere
                                    radius={0.03}
                                    position={[-0.2, 0, 0]}
                                    materials={["loadingDot3"]}
                                    animation={{ name: "orbitSpin", run: true, loop: true }}
                                />
                            </ViroNode>
                            <ViroText
                                text={isRetrying ? `Retrying... (${retryCount}/${MAX_RETRY_ATTEMPTS})` : "Loading 3D Model"}
                                position={[0, 0, 0]}
                                width={3}
                                style={{
                                    fontSize: 28,
                                    color: "#ffffff",
                                    textAlign: "center",
                                    fontWeight: "500",
                                }}
                                materials={["textGlow"]}
                            />
                            <ViroNode position={[0, -0.5, 0.01]}>
                                <ViroQuad position={[0, 0, 0]} scale={[3, 0.1, 1]} materials={["progressBg"]} />
                                <ViroQuad
                                    position={[-1.5 + (loadingProgress / 100) * 1.5, 0, 0.001]}
                                    scale={[(loadingProgress / 100) * 3, 0.08, 1]}
                                    materials={["progressFill"]}
                                />
                                <ViroText
                                    text={`${Math.round(loadingProgress)}%`}
                                    position={[0, -0.2, 0]}
                                    style={{
                                        fontSize: 18,
                                        color: "#64B5F6",
                                        textAlign: "center",
                                        fontWeight: "400",
                                    }}
                                    materials={["textGlow"]}
                                />
                            </ViroNode>
                            {isRetrying && (
                                <ViroText
                                    text="Connection issue detected, retrying..."
                                    position={[0, -1, 0]}
                                    width={3}
                                    style={{
                                        fontSize: 16,
                                        color: "#FFB74D",
                                        textAlign: "center",
                                        fontWeight: "300",
                                    }}
                                    materials={["textGlow"]}
                                />
                            )}
                        </ViroNode>
                    )}

                    {/* 3D Model with Enhanced Scaling */}
                    {qrItemData.modelUrl && !modelError && (
                        <ViroNode
                            position={modelPosition}
                            scale={[modelScale, modelScale, modelScale]}
                            rotation={modelRotation}
                            dragType="FixedDistance"
                            onPinch={handlePinch}
                            onRotate={handleRotate}
                            onDrag={handleDrag}
                        >
                            <Viro3DObject
                                key={`${modelKey}`}
                                source={{ uri: qrItemData.modelUrl }}
                                type={getModelType(qrItemData.modelUrl)}
                                position={[0, 0, 0]}
                                onLoadStart={handleModelLoadStart}
                                onLoadEnd={handleModelLoadEnd}
                                onError={handleModelLoadError}
                                onHover={handleModelHover}
                                opacity={modelLoaded ? 1.0 : 0.0}
                            />
                        </ViroNode>
                    )}
                    {qrItemData.modelUrl && !modelError && modelLoaded && !showInfo && (
                        <ViroNode position={[0, modelBounds.height * modelScale + 0.6, 0]}>
                            <ViroSphere
                                radius={0.06}
                                materials={["proximityIndicator"]}
                                animation={{ name: "proximityPulse", run: true, loop: true }}
                            />
                            <ViroText
                                text="Look closer for details"
                                position={[0, -0.25, 0]}
                                style={{
                                    fontSize: 18,
                                    color: "#64B5F6",
                                    textAlign: "center",
                                    fontWeight: "300",
                                }}
                                materials={["textGlow"]}
                                animation={{ name: "textFloat", run: true, loop: true }}
                            />
                        </ViroNode>
                    )}

                    {/* Debug Scale Display */}
                    {modelLoaded && (
                        <ViroNode position={[0, -2, 0]}>
                            <ViroText
                                text={`Current Scale: ${modelScale.toFixed(1)}x`}
                                position={[0, 0, 0]}
                                style={{
                                    fontSize: 16,
                                    color: "#FFB74D",
                                    textAlign: "center",
                                    fontWeight: "400",
                                }}
                                materials={["textGlow"]}
                            />
                        </ViroNode>
                    )}

                    {/* Main Title and Creator Billboard (Above Model) */}
                    {showBillboards && modelLoaded && (
                        <ViroNode
                            scale={[0.3, 0.3, 0.3]}
                            position={getMainBillboardPosition()}
                            animation={{ name: "slideIn", run: showBillboards }}
                        >
                            <ViroQuad position={[0, 0, -0.01]} scale={[5, 1.5, 1]} materials={["mainBillboardBg"]} />
                            {/* Main Title */}
                            <ViroText
                                text={qrItemData.title}
                                position={[0, 0.3, 0]}
                                width={4.5}
                                style={{
                                    fontSize: 36,
                                    color: "#00E5FF",
                                    textAlign: "center",
                                    fontWeight: "700",
                                }}
                                materials={["titleGlow"]}
                            />
                            {/* Creator */}
                            <ViroText
                                text={`Created by: ${qrItemData.creator.name}`}
                                position={[0, -0.1, 0]}
                                width={4}
                                style={{
                                    fontSize: 20,
                                    color: "#FFB74D",
                                    textAlign: "center",
                                    fontWeight: "500",
                                }}
                                materials={["textGlow"]}
                            />
                            {/* Date Range */}
                            <ViroText
                                text={`${formatDate(qrItemData.startDate)} - ${formatDate(qrItemData.endDate)}`}
                                position={[0, -0.4, 0]}
                                width={4}
                                style={{
                                    fontSize: 16,
                                    color: "#81C784",
                                    textAlign: "center",
                                    fontWeight: "400",
                                }}
                                materials={["textGlow"]}
                            />
                            {/* Main Billboard border */}
                            <ViroQuad position={[-2.49, 0, 0.005]} scale={[0.02, 1.5, 1]} materials={["holoBorder"]} />
                            <ViroQuad position={[2.49, 0, 0.005]} scale={[0.02, 1.5, 1]} materials={["holoBorder"]} />
                            <ViroQuad position={[0, 0.74, 0.005]} scale={[5, 0.02, 1]} materials={["holoBorder"]} />
                            <ViroQuad position={[0, -0.74, 0.005]} scale={[5, 0.02, 1]} materials={["holoBorder"]} />
                        </ViroNode>
                    )}

                    {/* Description Billboards */}
                    {showInfo &&
                        modelLoaded &&
                        sortedDescriptions.map((description, index) => {
                            const position = billboardPositions[index]
                            const rotation = billboardRotations[index]
                            if (!position) return null

                            return (
                                <ViroNode
                                    scale={[0.1, 0.1, 0.1]}
                                    rotation={[rotation.x, rotation.y, rotation.z]}
                                    key={description.id}
                                    position={[position.x, position.y, position.z]}
                                    animation={{ name: "slideIn", run: showInfo }}
                                >
                                    {/* Large Billboard Background */}
                                    <ViroQuad position={[0, 0, -0.01]} scale={[4.5, 6, 1]} materials={["descriptionBillboardBg"]} />
                                    {/* Scan Lines Effect */}
                                    <ViroQuad
                                        position={[0, 0, 0]}
                                        scale={[4.4, 0.06, 1]}
                                        materials={["scanLine"]}
                                        animation={{ name: "scanLineMove", run: true, loop: true }}
                                    />
                                    {/* Description Header */}
                                    <ViroNode position={[0, 2.5, 0.01]}>
                                        <ViroText
                                            text={description.title.toUpperCase()}
                                            position={[0, 0, 0]}
                                            width={4}
                                            style={{
                                                fontSize: 24,
                                                color: "#00E5FF",
                                                textAlign: "center",
                                                fontWeight: "600",
                                            }}
                                            materials={["titleGlow"]}
                                        />
                                        <ViroQuad position={[0, -0.2, 0]} scale={[3, 0.03, 1]} materials={["accentLine"]} />
                                    </ViroNode>
                                    {/* Description Content */}
                                    <ViroNode position={[0, 0.5, 0.01]}>
                                        <ViroText
                                            text={description.content}
                                            position={[0, -3.5, 0]}
                                            width={4.2}
                                            height={10}
                                            style={{
                                                fontSize: 20,
                                                color: "#E0E0E0",
                                            }}
                                            materials={["textGlow"]}
                                        />
                                    </ViroNode>
                                    {/* Order Indicator */}
                                    <ViroNode position={[0, -2.8, 0.01]}>
                                        <ViroText
                                            text={`Section ${description.order}`}
                                            position={[0, 0, 0]}
                                            style={{
                                                fontSize: 14,
                                                color: "#81C784",
                                                textAlign: "center",
                                                fontWeight: "400",
                                            }}
                                            materials={["textGlow"]}
                                        />
                                    </ViroNode>
                                    {/* Billboard Borders */}
                                    <ViroQuad position={[-2.24, 0, 0.005]} scale={[0.02, 5.9, 1]} materials={["holoBorder"]} />
                                    <ViroQuad position={[2.24, 0, 0.005]} scale={[0.02, 5.9, 1]} materials={["holoBorder"]} />
                                    <ViroQuad position={[0, 2.99, 0.005]} scale={[4.5, 0.02, 1]} materials={["holoBorder"]} />
                                    <ViroQuad position={[0, -2.99, 0.005]} scale={[4.5, 0.02, 1]} materials={["holoBorder"]} />
                                    {/* Corner Accents */}
                                    <ViroQuad position={[-2.1, 2.8, 0.01]} scale={[0.3, 0.02, 1]} materials={["cornerAccent"]} />
                                    <ViroQuad position={[-2.2, 2.7, 0.01]} scale={[0.02, 0.3, 1]} materials={["cornerAccent"]} />
                                    <ViroQuad position={[2.1, 2.8, 0.01]} scale={[0.3, 0.02, 1]} materials={["cornerAccent"]} />
                                    <ViroQuad position={[2.2, 2.7, 0.01]} scale={[0.02, 0.3, 1]} materials={["cornerAccent"]} />
                                </ViroNode>
                            )
                        })}

                    {/* Error State */}
                    {modelError && (
                        <ViroNode position={[0, 0, 0]}>
                            <ViroQuad position={[0, 0, -0.01]} scale={[4, 3, 1]} materials={["errorBg"]} />
                            <ViroSphere
                                radius={0.2}
                                position={[0, 0.7, 0]}
                                materials={["errorSphere"]}
                                animation={{ name: "errorPulse", run: true, loop: true }}
                            />
                            <ViroText
                                text="Failed to Load Model"
                                position={[0, 0.2, 0]}
                                style={{
                                    fontSize: 28,
                                    color: "#FF5252",
                                    textAlign: "center",
                                    fontWeight: "500",
                                }}
                                materials={["textGlow"]}
                            />
                            <ViroText
                                text={`Tried ${MAX_RETRY_ATTEMPTS} times. Check your connection.`}
                                position={[0, -0.2, 0]}
                                style={{
                                    fontSize: 18,
                                    color: "#FFAB91",
                                    textAlign: "center",
                                    fontWeight: "300",
                                }}
                                materials={["textGlow"]}
                            />
                        </ViroNode>
                    )}

                    {/* Fallback Design */}
                    {!qrItemData.modelUrl && (
                        <ViroNode position={[0, 0, 0]}>
                            <ViroBox
                                position={[0, 0, 0]}
                                scale={[modelScale, modelScale, modelScale]}
                                materials={["fallbackCube"]}
                                animation={{ name: "staticFloat", run: true, loop: true }}
                                onHover={handleModelHover}
                            />
                            <ViroText
                                text={qrItemData.title}
                                position={[0, 1.5, 0]}
                                style={{
                                    fontSize: 28,
                                    color: "#00E5FF",
                                    textAlign: "center",
                                    fontWeight: "500",
                                }}
                                materials={["titleGlow"]}
                            />
                        </ViroNode>
                    )}
                </ViroNode>
            )}

            {/* Initialization State */}
            {!arInitialized && (
                <ViroNode position={[0, 0, -3]}>
                    <ViroSphere
                        radius={0.12}
                        materials={["initSphere"]}
                        animation={{ name: "initPulse", run: true, loop: true }}
                    />
                    <ViroText
                        text="Scanning Environment..."
                        position={[0, -0.6, 0]}
                        width={3}
                        style={{
                            fontSize: 22,
                            color: "#64B5F6",
                            textAlign: "center",
                            fontWeight: "300",
                        }}
                        materials={["textGlow"]}
                    />
                </ViroNode>
            )}
        </ViroARScene>
    )
}

// Enhanced Animations
ViroAnimations.registerAnimations({
    orbitSpin: {
        properties: {
            rotateY: "+=360",
        },
        duration: 3000,
    },
    loadingPulse: {
        properties: {
            scaleX: 1.3,
            scaleY: 1.3,
            scaleZ: 1.3,
            opacity: 0.7,
        },
        duration: 1500,
    },
    gentleFloat: {
        properties: {
            positionY: "+=0.12",
        },
        duration: 4000,
    },
    staticFloat: {
        properties: {
            positionY: "+=0.1",
        },
        duration: 3000,
    },
    proximityPulse: {
        properties: {
            scaleX: 1.6,
            scaleY: 1.6,
            scaleZ: 1.6,
            opacity: 0.3,
        },
        duration: 1500,
    },
    textFloat: {
        properties: {
            positionY: "+=0.06",
        },
        duration: 2000,
    },
    slideIn: {
        properties: {
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
        },
        duration: 1000,
    },
    scanLineMove: {
        properties: {
            positionY: "+=5.5",
        },
        duration: 3000,
    },
    initPulse: {
        properties: {
            scaleX: 1.6,
            scaleY: 1.6,
            scaleZ: 1.6,
            opacity: 0.4,
        },
        duration: 1500,
    },
    errorPulse: {
        properties: {
            scaleX: 1.3,
            scaleY: 1.3,
            scaleZ: 1.3,
            opacity: 0.5,
        },
        duration: 1000,
    },
})

// Enhanced Materials
ViroMaterials.createMaterials({
    holographicMaterial: {
        lightingModel: "PBR",
        diffuseColor: "#ffffff",
        metalness: 0.1,
        roughness: 0.3,
    },
    loadingBg: {
        diffuseColor: "#000000",
    },
    loadingCore: {
        diffuseColor: "#64B5F6",
        shininess: 3.0,
    },
    progressBg: {
        diffuseColor: "#333333",
    },
    progressFill: {
        diffuseColor: "#00E5FF",
        shininess: 2.0,
    },
    proximityIndicator: {
        diffuseColor: "#64B5F6",
        shininess: 3.0,
    },
    mainBillboardBg: {
        diffuseColor: "#000000",
    },
    descriptionBillboardBg: {
        diffuseColor: "#000000",
    },
    scanLine: {
        diffuseColor: "#00E5FF",
    },
    titleGlow: {
        diffuseColor: "#00E5FF",
        shininess: 2.0,
    },
    textGlow: {
        diffuseColor: "#ffffff",
        shininess: 1.0,
    },
    accentLine: {
        diffuseColor: "#00E5FF",
        shininess: 2.0,
    },
    holoBorder: {
        diffuseColor: "#00E5FF",
    },
    cornerAccent: {
        diffuseColor: "#81C784",
        shininess: 2.0,
    },
    navButtonBg: {
        diffuseColor: "#1976D2",
    },
    loadingDot1: {
        diffuseColor: "#00E5FF",
        shininess: 3.0,
    },
    loadingDot2: {
        diffuseColor: "#64B5F6",
        shininess: 3.0,
    },
    loadingDot3: {
        diffuseColor: "#81C784",
        shininess: 3.0,
    },
    errorBg: {
        diffuseColor: "#1A0000",
    },
    errorSphere: {
        diffuseColor: "#FF5252",
        shininess: 2.0,
    },
    retryButtonBg: {
        diffuseColor: "#FF7043",
    },
    initSphere: {
        diffuseColor: "#64B5F6",
        shininess: 3.0,
    },
    fallbackCube: {
        lightingModel: "PBR",
        diffuseColor: "#00E5FF",
        metalness: 0.7,
        roughness: 0.2,
    },
})

export default EnhancedMultiDescriptionAR
