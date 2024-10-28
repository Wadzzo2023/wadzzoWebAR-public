import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Animated,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import {
  ViroARScene,
  ViroText,
  Viro3DObject,
  ViroTrackingStateConstants,
  ViroARSceneNavigator,
  ViroAmbientLight,
  ViroSpotLight,
  ViroNode,
  ViroAnimations,
  ViroImage,
  ViroFlexView,
  ViroButton,
  ViroParticleEmitter,
  ViroTrackingReason,
} from "@reactvision/react-viro";
import { ConsumedLocation } from "@/types/CollectionTypes";
import { Color } from "@/constants/Colors";
const { width, height } = Dimensions.get("window");

interface ARSceneARProps {
  items: ConsumedLocation[];
  onCapture: (item: ConsumedLocation) => void;
  singleAR?: boolean;
}

ViroAnimations.registerAnimations({
  rotate: {
    properties: {
      rotateY: "+=360",
    },
    duration: 2500,
  },
  scaleUp: {
    properties: {
      scaleX: 1.5,
      scaleY: 1.5,
      scaleZ: 1.5,
    },
    duration: 500,
  },
  scaleDown: {
    properties: {
      scaleX: 0,
      scaleY: 0,
      scaleZ: 0,
    },
    duration: 500,
  },
  fadeOut: {
    properties: {
      opacity: 0,
    },
    duration: 500,
  },
});

const ARSceneAR: React.FC<ARSceneARProps> = ({
  items,
  singleAR,
  onCapture,
}) => {
  const [trackingStatus, setTrackingStatus] =
    useState<ViroTrackingStateConstants>(
      ViroTrackingStateConstants.TRACKING_UNAVAILABLE
    );
  const onItemFocus = (item: ConsumedLocation) => {
    console.log("Item focused", item);
    onCapture(item);
  };
  const onItemBlur = () => {
    console.log("Item blurred");
  };
  const itemPositions = useMemo(() => {
    return items.slice(0, 20).map(() => {
      const angleY = Math.random() * Math.PI * 2; // Random angle for horizontal (360 degrees)
      const angleX = Math.random() * Math.PI - Math.PI / 2; // Random angle for vertical
      const radius = 5; // Distance from the camera
      const x = radius * Math.cos(angleX) * Math.cos(angleY);
      const y = radius * Math.sin(angleX);
      const z = radius * Math.cos(angleX) * Math.sin(angleY);
      return [x, y % 4, z];
    });
  }, [items]); // Only calculate positions once when items change
  const onARInitialized = (
    state: ViroTrackingStateConstants,
    reason: ViroTrackingReason
  ) => {
    setTrackingStatus(state);
  };

  return (
    <ViroARScene onTrackingUpdated={onARInitialized}>
      <ViroAmbientLight color="#FFFFFF" />
      <ViroSpotLight
        innerAngle={5}
        outerAngle={90}
        direction={[0, -1, -0.2]}
        position={[0, 3, 1]}
        color="#FFFFFF"
        castsShadow={true}
      />

      {trackingStatus == ViroTrackingStateConstants.TRACKING_NORMAL &&
        items.slice(0, 20).map((item, index) => (
          <ViroNode
            key={`${index}-${item.id}`}
            animation={{
              name: "rotate",
              run: true,
              loop: true,
            }}
            position={
              singleAR
                ? [0, 0, -5]
                : [
                    itemPositions[index][0],
                    itemPositions[index][1],
                    itemPositions[index][1],
                  ]
            }
            onHover={(isHovering) => {
              if (isHovering) {
                onItemFocus(item);
              } else {
                onItemBlur();
              }
            }}
          >
            <Viro3DObject
              rotation={[0, 0, 0]}
              source={require("../assets/circle/10438_Circular_Grass_Patch_v1_iterations-2.obj")}
              scale={[0.002, 0.002, 0.002]} // Slightly larger scale for distance
              position={[0, 0.5, 0]}
              type="OBJ"
            />
            {/* Front Side Image */}
            <ViroImage
              source={{ uri: item.image_url }}
              height={1}
              width={1}
              rotation={[0, 180, 0]}
              scale={[0.4, 0.4, 0]} // Larger scale for better visibility
              position={[0, 0.5, -0.025]}
            />
            {/* Back Side Image */}
            <ViroImage
              source={{ uri: item.image_url }}
              height={1}
              width={1}
              rotation={[0, 0, 0]}
              scale={[0.4, 0.4, 0]} // Larger scale for back image as well
              position={[0, 0.5, 0.025]}
            />
            <ViroText
              text={item.title}
              scale={[0.7, 0.7, 0.7]} // Larger text scale
              position={[0, 1.1, 0]}
              style={styles.itemTitle}
            />
          </ViroNode>
        ))}
    </ViroARScene>
  );
};
const styles = StyleSheet.create({
  arNavigator: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  f1: {
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
    fontSize: 18,
    fontWeight: "bold",
  },
  captureButton: {
    position: "absolute",
    bottom: 40,
    left: "50%",
    transform: [{ translateX: -35 }],
    width: 100,
    height: 100,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  captureIcon: {
    width: 80,
    height: 100,
  },
  itemTitle: {
    fontFamily: "Arial",
    fontSize: 12,
    color: Color.wadzzo,
    textAlignVertical: "center",
    textAlign: "center",
  },
  auraEffect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  auraCircle: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  logo: {
    position: "absolute",
    width: width * 0.2,
    height: width * 0.2,
    resizeMode: "contain",
  },
});

export default ARSceneAR;
