import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  StyleSheet,
  Image,
  Dimensions,
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
  ViroFlexView,
  ViroParticleEmitter,
  ViroTrackingReason,
} from "@reactvision/react-viro";

import { useWinnerAnimation } from "./hooks/useWinnerAnimation";
import { ConsumedLocation } from "./types/CollectionTypes";
import { Color } from "./utils/all-colors";
import { useLocationService } from "./hooks/useLocationService";

const { width } = Dimensions.get("window");

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
      scaleX: "1.0+0.2*sin(2*3.14*t/1000)",
      scaleY: "1.0+0.2*sin(2*3.14*t/1000)",
      scaleZ: "1.0+0.2*sin(2*3.14*t/1000)",
      opacity: "0.8+0.2*sin(2*3.14*t/1000)",
    },
    duration: 1000,
    easing: "EaseInEaseOut",
  },
});

// ─── Winner Animation ─────────────────────────────────────────────────────────

const WinnerAnimation = React.memo(() => (
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
));

// ─── No Items Warning ─────────────────────────────────────────────────────────

interface NoItemsWarningProps {
  nearbyPinDistance: number;
}

const NoItemsWarning = React.memo(({ nearbyPinDistance }: NoItemsWarningProps) => (
  <ViroFlexView
    style={styles.warningContainer}
    position={[0, 0, -4]}
    rotation={[0, 0, 0]}
    height={1}
    width={5}
    transformBehaviors={["billboardY"]}
    animation={{ name: "warningPulse", run: true, loop: true }}
  >
    <ViroText
      text="There are no nearby pins available in 50 m."
      style={styles.warningText}
      width={5}
      height={1}
    />
    <ViroText
      text={`Nearest AR collectible is at ${nearbyPinDistance.toFixed(2)} m away`}
      style={styles.warningText}
      width={5}
      height={1}
    />
  </ViroFlexView>
));

// ─── AR Pin ───────────────────────────────────────────────────────────────────
//
// KEY FIX: The detail panel (billboard with ViroImage) lives INSIDE each pin
// and is ALWAYS MOUNTED. We toggle `visible` on a wrapper ViroNode instead of
// mounting/unmounting the panel. This means ViroImage is created once per pin
// and never has to reload from the network on re-hover.

interface ARPinProps {
  item: ConsumedLocation;
  position: [number, number, number];
  singleAR: boolean;
  imageSource: { uri: string };
  onFocus: (item: ConsumedLocation) => void;
  onBlur: () => void;
}

const ARPin = React.memo(
  ({ item, position, singleAR, imageSource, onFocus, onBlur }: ARPinProps) => {
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
      Linking.openURL(item.url).catch((err) =>
        console.error("Failed to open URL:", err)
      );
    }, [item.url]);

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

        {/* ── Coin face images — loaded once on first mount, cached forever ── */}
        <ViroImage
          source={imageSource}
          height={1}
          width={1}
          rotation={[0, 180, 0]}
          scale={[0.4, 0.4, 0]}
          position={[0, 0.5, -0.022]}
        />
        <ViroImage
          source={imageSource}
          height={1}
          width={1}
          rotation={[0, 0, 0]}
          scale={[0.4, 0.4, 0]}
          position={[0, 0.5, 0.022]}
        />

        {/* ── Coin label ── */}
        <ViroText
          text={item.title}
          scale={[0.7, 0.7, 0.7]}
          position={[0, 1.1, 0]}
          style={styles.itemTitle}
        />

        {/* ── Detail billboard ──
            Always mounted in the scene tree, just invisible when not hovered.
            `visible={false}` hides it with zero GPU cost but keeps the texture
            in VRAM — so the next hover shows it instantly with no reload. ── */}
        <ViroNode visible={isHovered} position={[0, 2.5, 0]}>
          <ViroFlexView
            style={styles.itemDetailContainer}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            height={2.5}
            width={3}
            transformBehaviors={["billboardY"]}
          >
            <ViroFlexView style={styles.itemDetailHeader}>
              {/* Reuses the same imageSource already in VRAM — instant display */}
              <ViroImage
                source={imageSource}
                style={styles.itemDetailImage}
                height={0.8}
                width={0.8}
              />
              <ViroText
                text={item.title ?? "No title"}
                style={styles.itemDetailTitle}
                height={0.5}
                width={1}
              />
            </ViroFlexView>

            <ViroText
              text={`Brand: ${item.brand_name}`}
              style={styles.itemDetailText}
              height={0.2}
              width={3.5}
            />
            <ViroText
              text={`Description: ${item.description ?? "No description"}`}
              style={styles.itemDetailText}
              height={0.6}
              width={3}
            />
            <ViroText
              text={`Remaining: ${item.collection_limit_remaining}`}
              style={styles.itemDetailText}
              height={0.2}
              width={1}
            />
            <ViroText
              onClick={handleLinkPress}
              text={`Link: ${item.url.slice(0, 35)}...`}
              style={styles.itemDetailText}
              height={0.2}
              width={3.5}
            />
          </ViroFlexView>
        </ViroNode>
      </ViroNode>
    );
  },
  // Only re-render this pin if its own data changes
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.singleAR === next.singleAR &&
    prev.imageSource.uri === next.imageSource.uri
);

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  itemTitle: {
    fontFamily: "Arial",
    fontSize: 12,
    color: Color.wadzzo,
    textAlignVertical: "center",
    textAlign: "center",
  },
  itemDetailContainer: {
    flexDirection: "column",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 0.1,
  },
  itemDetailHeader: {
    flexDirection: "row",
    height: 1,
  },
  itemDetailImage: {
    height: 1,
    width: 1,
  },
  itemDetailTitle: {
    fontFamily: "Arial",
    fontSize: 20,
    color: "#FFFFFF",
    textAlignVertical: "center",
    textAlign: "left",
    flex: 1,
  },
  itemDetailText: {
    fontFamily: "Arial",
    fontSize: 14,
    color: "#FFFFFF",
    textAlignVertical: "center",
    textAlign: "left",
    padding: 0.05,
  },
  warningContainer: {
    flexDirection: "column",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 0.2,
    borderRadius: 0.1,
    borderWidth: 0.02,
    borderColor: Color.wadzzo,
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