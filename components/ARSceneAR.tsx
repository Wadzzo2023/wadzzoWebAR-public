import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  StyleSheet,
  Image,
  Linking,
} from "react-native";
import {
  ViroARScene,
  ViroText,
  Viro3DObject,
  ViroTrackingStateConstants,
  ViroAmbientLight,
  ViroSpotLight,
  ViroNode,
  ViroAnimations,
  ViroImage,
  ViroQuad,
  ViroMaterials,
  ViroSphere,
  ViroParticleEmitter,
  type ViroTrackingReason,
} from "@reactvision/react-viro";

import { useWinnerAnimation } from "./hooks/useWinnerAnimation";
import { ConsumedLocation } from "./types/CollectionTypes";
import { Color } from "./utils/all-colors";
import { useLocationService } from "./hooks/useLocationService";

interface ARSceneARProps {
  items: ConsumedLocation[];
  onCapture: (item: ConsumedLocation | null) => void;
  singleAR?: boolean;
}

// ─── Animations ──────────────────────────────────────────────────────────────

ViroAnimations.registerAnimations({
  rotate: {
    properties: { rotateY: "+=360" },
    duration: 6000,
  },
  scaleUp: {
    properties: { scaleX: 1.5, scaleY: 1.5, scaleZ: 1.5 },
    duration: 500,
  },
  scaleDown: {
    properties: { scaleX: 0, scaleY: 0, scaleZ: 0 },
    duration: 500,
  },
  fadeOut: {
    properties: { opacity: 0 },
    duration: 500,
  },
  warningPulse: {
    properties: {
      scaleX: 1.2,
      scaleY: 1.2,
      scaleZ: 1.2,
      opacity: 1.0,
    },
    duration: 1000,
    easing: "EaseInEaseOut",
  },
  billboardFadeIn: {
    properties: {
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      opacity: 1,
    },
    duration: 300,
    easing: "EaseOut",
  },
  dotPulse: {
    properties: {
      scaleX: 1.4,
      scaleY: 1.4,
      scaleZ: 1.4,
      opacity: 0.4,
    },
    duration: 1200,
  },
});

// ─── Winner Animation ─────────────────────────────────────────────────────────

function WinnerAnimation() {
  return (
    <ViroParticleEmitter
      position={[0, 4.5, 0]}
      duration={4000}
      visible={true}
      delay={0}
      run={true}
      loop={true}
      fixedToEmitter={true}
      image={{
        source: require("../assets/images/wadzzo.png"),
        height: 0.1,
        width: 0.1,
        bloomThreshold: 1.0,
      }}
      spawnBehavior={{
        particleLifetime: [4000, 4000],
        emissionRatePerSecond: [150, 200],
        spawnVolume: {
          shape: "box",
          params: [20, 1, 20],
          spawnOnSurface: false,
        },
        maxParticles: 400,
      }}
      particleAppearance={{
        opacity: {
          initialRange: [0, 0],
          factor: "time",
          interpolation: [
            { endValue: 0.5, interval: [0, 500] },
            { endValue: 1.0, interval: [4000, 5000] },
          ],
        },
        rotation: {
          initialRange: [0, 360],
          factor: "time",
          interpolation: [{ endValue: 1080, interval: [0, 5000] }],
        },
        scale: {
          initialRange: [[5, 5, 5], [10, 10, 10]],
          factor: "time",
          interpolation: [
            { endValue: [3, 3, 3], interval: [0, 4000] },
            { endValue: [0, 0, 0], interval: [4000, 5000] },
          ],
        },
      }}
      particlePhysics={{
        velocity: {
          initialRange: [[-2, -0.5, 0], [2, -3.5, 0]],
        },
      }}
    />
  );
}

// ─── No Items Warning ─────────────────────────────────────────────────────────

interface NoItemsWarningProps {
  nearbyPinDistance: number;
}

function NoItemsWarning({ nearbyPinDistance }: NoItemsWarningProps) {
  return (
    <ViroNode
      position={[0, 0, -4]}
      transformBehaviors={["billboardY"]}
      animation={{ name: "warningPulse", run: true, loop: true }}
    >
      <ViroQuad
        position={[0, 0, -0.01]}
        scale={[4.5, 1.2, 1]}
        materials={["warningBg"]}
      />
      <ViroText
        text="There are no nearby pins available in 50 m."
        style={styles.warningText}
        width={4}
        height={0.4}
        position={[0, 0.2, 0]}
      />
      <ViroText
        text={`Nearest AR collectible is at ${nearbyPinDistance.toFixed(2)} m away`}
        style={styles.warningText}
        width={4}
        height={0.4}
        position={[0, -0.2, 0]}
      />
    </ViroNode>
  );
}

// ─── AR Pin ───────────────────────────────────────────────────────────────────

interface ARPinProps {
  item: ConsumedLocation;
  position: [number, number, number];
  singleAR: boolean;
  imageSource: { uri: string };
  onFocus: (item: ConsumedLocation) => void;
  onBlur: () => void;
}

function ARPin({ item, position, singleAR, imageSource, onFocus, onBlur }: ARPinProps) {
  const [isHovered, setIsHovered] = useState(false);

  const resolvedPosition: [number, number, number] = singleAR
    ? [0, 0, -5]
    : position;

  const handleHover = useCallback(
    (hovering: boolean) => {
      setIsHovered(hovering);
      if (hovering) {
        onFocus(item);
      } else {
        onBlur();
      }
    },
    [item, onFocus, onBlur]
  );

  const handleLinkPress = useCallback(() => {
    if (item.url) {
      Linking.openURL(item.url).catch((err) =>
        console.error("Failed to open URL:", err)
      );
    }
  }, [item.url]);

  const truncatedTitle = item.title && item.title.length > 28
    ? item.title.slice(0, 28) + "..."
    : (item.title ?? "No title");

  const truncatedDesc = item.description
    ? item.description.length > 120
      ? item.description.slice(0, 120) + "..."
      : item.description
    : "No description available";

  return (
    <ViroNode
      animation={{ name: "rotate", run: true, loop: true }}
      position={resolvedPosition}
      onHover={handleHover}
    >
      {/* ── Coin base ── */}
      <Viro3DObject
        rotation={[0, 0, 0]}
        source={require("../assets/circle/10438_Circular_Grass_Patch_v1_iterations-2.obj")}
        scale={[0.002, 0.002, 0.002]}
        position={[0, 0.5, 0]}
        type="OBJ"
      />

      {/* ── Coin face images ── */}
      <ViroImage
        source={imageSource}
        height={1}
        width={1}
        rotation={[0, 180, 0]}
        scale={[0.4, 0.4, 0.01]}
        position={[0, 0.5, -0.022]}
      />
      <ViroImage
        source={imageSource}
        height={1}
        width={1}
        rotation={[0, 0, 0]}
        scale={[0.4, 0.4, 0.01]}
        position={[0, 0.5, 0.022]}
      />

      {/* ── Coin label ── */}
      <ViroText
        text={item.title}
        scale={[0.7, 0.7, 0.7]}
        position={[0, 1.1, 0]}
        style={styles.itemTitle}
      />

      {/* ── Detail billboard ── */}
      <ViroNode
        visible={isHovered}
        position={[0, 2.6, 0]}
        transformBehaviors={["billboardY"]}
        animation={{ name: "billboardFadeIn", run: isHovered, loop: false }}
        scale={[0.8, 0.8, 0.8]}
        opacity={0}
      >
        {/* Card background */}
        <ViroQuad
          position={[0, 0, -0.02]}
          scale={[3.4, 2.8, 1]}
          materials={["billboardBg"]}
        />
        {/* Left accent strip */}
        <ViroQuad
          position={[-1.68, 0, -0.01]}
          scale={[0.06, 2.8, 1]}
          materials={["billboardAccent"]}
        />

        {/* ── Header row ── */}
        <ViroImage
          source={imageSource}
          height={0.6}
          width={0.6}
          position={[-1.1, 0.85, 0]}
        />
        <ViroText
          text={truncatedTitle}
          style={styles.billboardTitle}
          width={2.0}
          height={0.35}
          position={[0.15, 0.95, 0]}
        />
        <ViroText
          text={item.brand_name}
          style={styles.billboardBrand}
          width={2.0}
          height={0.2}
          position={[0.15, 0.7, 0]}
        />

        {/* Divider */}
        <ViroQuad
          position={[0, 0.48, -0.01]}
          scale={[2.9, 0.012, 1]}
          materials={["billboardDivider"]}
        />

        {/* ── Description ── */}
        <ViroText
          text={truncatedDesc}
          style={styles.billboardDesc}
          width={2.9}
          height={0.7}
          position={[0, 0.02, 0]}
        />

        {/* Divider */}
        <ViroQuad
          position={[0, -0.4, -0.01]}
          scale={[2.9, 0.012, 1]}
          materials={["billboardDivider"]}
        />

        {/* ── Footer ── */}
        <ViroNode position={[-0.7, -0.6, 0]}>
          <ViroSphere
            radius={0.06}
            materials={["footerDot"]}
            position={[-0.35, 0, 0]}
            animation={{ name: "dotPulse", run: true, loop: true }}
          />
          <ViroText
            text={`${item.collection_limit_remaining} remaining`}
            style={styles.billboardFooterLeft}
            width={1.2}
            height={0.2}
            position={[0.15, 0, 0]}
          />
        </ViroNode>

        {/* Link button — ViroQuad as tap target for reliable iOS clicks */}
        {item.url ? (
          <ViroNode
            position={[0.75, -0.6, 0]}
            onClick={handleLinkPress}
          >
            <ViroQuad
              position={[0, 0, -0.005]}
              scale={[1.2, 0.3, 1]}
              materials={["linkButtonBg"]}
            />
            <ViroText
              text="Open Link  >"
              style={styles.billboardLink}
              width={1.1}
              height={0.2}
              position={[0, 0, 0]}
            />
          </ViroNode>
        ) : null}
      </ViroNode>
    </ViroNode>
  );
}

// ─── Main AR Scene ────────────────────────────────────────────────────────────

const ARSceneAR: React.FC<ARSceneARProps> = ({
  items,
  singleAR = false,
  onCapture,
}) => {
  const [trackingStatus, setTrackingStatus] =
    useState<ViroTrackingStateConstants>(
      ViroTrackingStateConstants.TRACKING_UNAVAILABLE
    );

  const { nearestPinDistanceForAR } = useLocationService();
  const { data } = useWinnerAnimation();

  const hasNoItems = items.length === 0;

  // ── Prefetch all images on mount so the first ViroImage render hits cache ──
  useEffect(() => {
    items.slice(0, 20).forEach((item) => {
      if (item.image_url) {
        Image.prefetch(item.image_url).catch(() => { });
      }
    });
  }, [items]);

  // ── Stable image source objects — same reference = no unnecessary re-renders ──
  const imageSources = useMemo(
    () => items.slice(0, 20).map((item) => ({ uri: item.image_url })),
    [items]
  );

  // ── Pin world positions — computed once per items change ──
  const itemPositions = useMemo<[number, number, number][]>(() => {
    return items.slice(0, 20).map(() => {
      const angleY = Math.random() * Math.PI * 2;
      const angleX = Math.random() * Math.PI - Math.PI / 2;
      const radius = 8;
      const x = radius * Math.cos(angleX) * Math.cos(angleY);
      const z = radius * Math.cos(angleX) * Math.sin(angleY);
      return [x, 0, z];
    });
  }, [items]);

  // ── Stable callbacks — ARPin memo comparator won't see new references ──
  const handleFocus = useCallback(
    (item: ConsumedLocation) => {
      onCapture(item);
    },
    [onCapture]
  );

  const handleBlur = useCallback(() => {
    onCapture(null);
  }, [onCapture]);

  const onARInitialized = useCallback(
    (state: ViroTrackingStateConstants, _reason: ViroTrackingReason) => {
      setTrackingStatus(state);
    },
    []
  );

  return (
    <ViroARScene onTrackingUpdated={onARInitialized}>
      <ViroAmbientLight color="#FFFFFF" intensity={200} />
      <ViroSpotLight
        innerAngle={5}
        outerAngle={90}
        direction={[0, -1, -0.2]}
        position={[0, 3, 1]}
        color="#FFFFFF"
        castsShadow={true}
      />

      {trackingStatus === ViroTrackingStateConstants.TRACKING_NORMAL && (
        <>
          {hasNoItems ? (
            <NoItemsWarning nearbyPinDistance={nearestPinDistanceForAR ?? 0} />
          ) : (
            items.slice(0, 20).map((item, index) => (
              <ARPin
                key={`pin-${item.id}`}
                item={item}
                position={itemPositions[index]}
                singleAR={singleAR}
                imageSource={imageSources[index]}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            ))
          )}
        </>
      )}

      {data.showWinnerAnimation && <WinnerAnimation />}
    </ViroARScene>
  );
};

// ─── Materials ────────────────────────────────────────────────────────────────

ViroMaterials.createMaterials({
  billboardBg: {
    diffuseColor: "#111827",
    lightingModel: "Constant",
  },
  billboardAccent: {
    diffuseColor: Color.wadzzo,
    lightingModel: "Constant",
  },
  billboardDivider: {
    diffuseColor: "rgba(255,255,255,0.12)",
    lightingModel: "Constant",
  },
  footerDot: {
    diffuseColor: "#4ade80",
    lightingModel: "Constant",
  },
  linkButtonBg: {
    diffuseColor: Color.wadzzo,
    lightingModel: "Constant",
  },
  warningBg: {
    diffuseColor: "rgba(0,0,0,0.8)",
    lightingModel: "Constant",
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  itemTitle: {
    fontFamily: "Arial",
    fontSize: 12,
    color: Color.wadzzo,
    textAlignVertical: "center",
    textAlign: "center",
  },
  billboardTitle: {
    fontFamily: "Arial",
    fontSize: 22,
    color: "#FFFFFF",
    textAlignVertical: "center",
    textAlign: "left",
    fontWeight: "bold",
  },
  billboardBrand: {
    fontFamily: "Arial",
    fontSize: 13,
    color: Color.wadzzo,
    textAlignVertical: "center",
    textAlign: "left",
    fontWeight: "600",
  },
  billboardDesc: {
    fontFamily: "Arial",
    fontSize: 14,
    color: "#d1d5db",
    textAlignVertical: "top",
    textAlign: "left",
  },
  billboardFooterLeft: {
    fontFamily: "Arial",
    fontSize: 13,
    color: "#4ade80",
    textAlignVertical: "center",
    textAlign: "left",
    fontWeight: "bold",
  },
  billboardLink: {
    fontFamily: "Arial",
    fontSize: 13,
    color: "#FFFFFF",
    textAlignVertical: "center",
    textAlign: "center",
    fontWeight: "bold",
  },
  warningText: {
    fontFamily: "Arial",
    fontSize: 20,
    color: "#FFFFFF",
    textAlignVertical: "center",
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default ARSceneAR;