"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ViroNode, ViroText, ViroBox, ViroSphere, ViroAnimations, ViroMaterials } from "@reactvision/react-viro"
import { ConsumedLocation } from "./types/CollectionTypes"

interface ARCoinProps {
    pin: ConsumedLocation
    position: [number, number, number]
    distance: number
    onCoinHover?: (pin: ConsumedLocation, isHovered: boolean) => void
}

// Define animations once
ViroAnimations.registerAnimations({
    coinFloat: {
        properties: {
            positionY: "+=0.03",
        },
        duration: 2500,
    },
    coinFocus: {
        properties: {
            scaleX: 1.3,
            scaleY: 1.3,
            scaleZ: 1.3,
        },
        duration: 200,
    },
    coinRotate: {
        properties: {
            rotateY: "+=180",
        },
        duration: 1000,
    },
    billboardSlideIn: {
        properties: {
            scaleX: 1.0,
            scaleY: 1.0,
            scaleZ: 1.0,
            opacity: 1.0,
        },
        duration: 300,
        easing: "EaseOut",
    },
    billboardSlideOut: {
        properties: {
            scaleX: 0.8,
            scaleY: 0.8,
            scaleZ: 0.8,
            opacity: 0.0,
        },
        duration: 200,
        easing: "EaseIn",
    },
    billboardPulse: {
        properties: {
            scaleX: 1.05,
            scaleY: 1.05,
            scaleZ: 1.05,
        },
        duration: 1500,
    },
})

const ARCoin: React.FC<ARCoinProps> = ({ pin, position, distance, onCoinHover }) => {
    const [isFocused, setIsFocused] = useState(false)
    const [materialsCreated, setMaterialsCreated] = useState(false)

    // Create materials safely
    useEffect(() => {
        try {
            ViroMaterials.createMaterials({
                [`coinBrandImage_${pin.id}`]: {
                    diffuseTexture: { uri: pin.brand_image_url || pin.image_url },
                    lightingModel: "Lambert",
                    cullMode: "None",
                },
                [`coinItemImage_${pin.id}`]: {
                    diffuseTexture: { uri: pin.image_url },
                    lightingModel: "Constant",
                    cullMode: "None",
                },
                [`coinBorder_${pin.id}`]: {
                    diffuseColor: pin.collected ? "#666666" : "#FFD700",
                    lightingModel: "Lambert",
                },
                [`coinRing_${pin.id}`]: {
                    diffuseColor: pin.collected ? "#444444" : "#FFA500",
                    lightingModel: "Lambert",
                },
                // Billboard materials
                [`billboardBg_${pin.id}`]: {
                    diffuseColor: "#1a1a1a",
                    lightingModel: "Constant",

                },
                [`billboardAccent_${pin.id}`]: {
                    diffuseColor: pin.collected ? "#4ade80" : "#f59e0b",
                    lightingModel: "Constant",
                },
                [`billboardFrame_${pin.id}`]: {
                    diffuseColor: "#ffffff",
                    lightingModel: "Constant",

                },
                [`billboardImage_${pin.id}`]: {
                    diffuseTexture: { uri: pin.image_url },
                    lightingModel: "Constant",
                },
            })
            setMaterialsCreated(true)
        } catch (error) {
            console.error("Error creating materials:", error)
        }
    }, [pin.id, pin.brand_image_url, pin.image_url, pin.collected])

    // Don't render until materials are created
    if (!materialsCreated) {
        return null
    }

    // Adjusted scale for closer distances
    const scale = Math.max(0.8, Math.min(1.5, 120 / distance))
    const coinRadius = 0.15 * scale
    const coinThickness = 0.02 * scale

    // Billboard dimensions
    const billboardWidth = 1.0
    const billboardHeight = 0.8
    const billboardOffset = coinRadius + 0.4

    const handleHover = (isHovered: boolean) => {
        try {
            console.log("Coin hovered:", pin.brand_name, "isHovered:", isHovered)
            if (isHovered) {
                setIsFocused(true)
                onCoinHover?.(pin, true)
            } else {
                setIsFocused(false)
                onCoinHover?.(pin, false)
            }
        } catch (error) {
            console.error("Error in hover handler:", error)
        }
    }

    const truncateText = (text: string, maxLength: number) => {
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
    }

    return (
        <ViroNode position={position}>
            {/* Beautiful Billboard - appears on hover */}
            {isFocused && (
                <ViroNode
                    position={[0, coinRadius + billboardHeight / 2 + 0.2, 0]}
                    animation={{
                        name: "billboardSlideIn",
                        run: true,
                        loop: false,
                    }}
                    opacity={0}
                    scale={[0.8, 0.8, 0.8]}
                >
                    {/* Main billboard background with gradient effect */}
                    <ViroBox
                        height={billboardHeight}
                        width={billboardWidth}
                        length={0.02}
                        materials={[`billboardBg_${pin.id}`]}
                        position={[0, 0, 0]}
                    />

                    {/* Glowing frame */}
                    <ViroBox
                        height={billboardHeight + 0.02}
                        width={billboardWidth + 0.02}
                        length={0.01}
                        materials={[`billboardFrame_${pin.id}`]}
                        position={[0, 0, -0.015]}
                    />

                    {/* Accent bar at top */}
                    <ViroBox
                        height={0.06}
                        width={billboardWidth}
                        length={0.025}
                        materials={[`billboardAccent_${pin.id}`]}
                        position={[0, billboardHeight / 2 - 0.03, 0.01]}
                        animation={{
                            name: "billboardPulse",
                            run: true,
                            loop: true,
                        }}
                    />

                    {/* Brand Name - Header */}
                    <ViroText
                        text={pin.brand_name}
                        height={0.1}
                        scale={[0.2, 0.2, 0.2]}
                        position={[0, billboardHeight / 2 - 0.03, 0.1]}
                        style={{
                            fontFamily: "Arial",
                            fontSize: 24,
                            color: "#000000",
                            textAlignVertical: "center",
                            textAlign: "center",
                            fontWeight: "bold",
                        }}
                    />

                    {/* Item Image */}
                    <ViroBox
                        height={0.35}
                        width={0.35}
                        length={0.02}
                        materials={[`billboardImage_${pin.id}`]}
                        position={[-billboardWidth / 2 + 0.25, 0.05, 0.02]}
                    />

                    {/* Title */}
                    <ViroText
                        height={1}
                        width={5}
                        text={truncateText(pin.title, 25)}
                        scale={[0.18, 0.18, 0.18]}
                        position={[0.42, 0.25, 0.02]}
                        style={{
                            fontFamily: "Arial",
                            fontSize: 22,
                            color: "#ffffff",
                            textAlignVertical: "center",
                            textAlign: "left",
                            fontWeight: "600",
                        }}
                    />

                    {/* Description */}
                    <ViroText
                        height={1}
                        width={5}
                        text={truncateText(pin.description, 45)}
                        scale={[0.13, 0.13, 0.13]}
                        position={[0.3, 0.1, 0.02]}
                        style={{
                            fontFamily: "Arial",
                            fontSize: 18,
                            color: "#cccccc",
                            textAlignVertical: "center",
                            textAlign: "left",
                        }}
                    />

                    {/* Collection Status */}
                    <ViroText
                        text={pin.collected ? "✓ COLLECTED" : "AVAILABLE"}
                        scale={[0.15, 0.15, 0.15]}
                        position={[0.05, -0.05, 0.02]}
                        style={{
                            fontFamily: "Arial",
                            fontSize: 18,
                            color: pin.collected ? "#4ade80" : "#f59e0b",
                            textAlignVertical: "center",
                            textAlign: "left",
                            fontWeight: "bold",
                        }}
                    />

                    {/* Distance Info */}
                    <ViroText
                        text={`${Math.round(distance)}m away`}
                        scale={[0.15, 0.15, 0.15]}
                        position={[0.01, -0.1, 0.02]}
                        style={{
                            fontFamily: "Arial",
                            fontSize: 16,
                            color: "#888888",
                            textAlignVertical: "center",
                            textAlign: "right",
                        }}
                    />

                    {/* Collection limit if available */}
                    {pin.collection_limit_remaining > 0 && (
                        <ViroText
                            text={`${pin.collection_limit_remaining} left`}
                            scale={[0.2, 0.2, 0.2]}
                            position={[0.01, -0.15, 0.02]}
                            style={{
                                fontFamily: "Arial",
                                fontSize: 14,
                                color: "#ff6b6b",
                                textAlignVertical: "center",
                                textAlign: "right",
                                fontWeight: "bold",
                            }}
                        />
                    )}

                    {/* Decorative elements */}
                    <ViroSphere
                        radius={0.025}
                        materials={[`billboardAccent_${pin.id}`]}
                        position={[-billboardWidth / 2 + 0.08, billboardHeight / 2 - 0.08, 0.02]}
                        animation={{
                            name: "coinRotate",
                            run: true,
                            loop: true,
                        }}
                    />

                    <ViroSphere
                        radius={0.02}
                        materials={[`billboardAccent_${pin.id}`]}
                        position={[billboardWidth / 2 - 0.08, -billboardHeight / 2 + 0.08, 0.02]}
                        animation={{
                            name: "coinRotate",
                            run: true,
                            loop: true,
                        }}
                    />
                </ViroNode>
            )}

            {/* Main Coin Structure */}
            <ViroNode
                onHover={handleHover}
                animation={{
                    name: isFocused ? "coinFocus" : "coinFloat",
                    run: true,
                    loop: !isFocused,
                }}
            >
                {/* Brand Name - Top */}
                <ViroText
                    text={pin.brand_name || "Brand"}
                    scale={[0.1, 0.1, 0.1]}
                    position={[0, coinRadius + 0.1, 0]}
                    style={{
                        fontFamily: "Arial",
                        fontSize: 18,
                        color: "#ffffff",
                        textAlignVertical: "center",
                        textAlign: "center",
                        fontWeight: "bold",
                    }}
                />

                {/* Two-Sided Coin - Center */}
                <ViroNode
                    position={[0, 0, 0]}
                >
                    {/* Coin Body with different materials on each side */}
                    <ViroBox
                        height={coinRadius * 2}
                        width={coinRadius * 2}
                        length={coinThickness}
                        materials={[
                            `coinBrandImage_${pin.id}`, // front face
                            `coinItemImage_${pin.id}`,  // back face  
                            `coinBorder_${pin.id}`,     // top edge
                            `coinBorder_${pin.id}`,     // bottom edge
                            `coinBorder_${pin.id}`,     // right edge
                            `coinBorder_${pin.id}`,     // left edge
                        ]}
                    />

                    {/* Outer Ring/Border for front side */}
                </ViroNode>

                {/* Distance - Bottom */}
                <ViroText
                    text={`${Math.round(distance)}m`}
                    scale={[0.1, 0.1, 0.1]}
                    position={[0, -coinRadius - 0.1, 0]}
                    style={{
                        fontFamily: "Arial",
                        fontSize: 16,
                        color: "#cccccc",
                        textAlignVertical: "center",
                        textAlign: "center",
                    }}
                />
            </ViroNode>
        </ViroNode>
    )
}

export default ARCoin