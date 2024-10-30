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
import { useWinnerAnimation } from "./hooks/useWinnerAnimation";
const { width, height } = Dimensions.get("window");

interface ARSceneARProps {
  items: ConsumedLocation[];
  onCapture: (item: ConsumedLocation) => void;
  singleAR?: boolean;
}
const renderWinnerAnimation = () => {
  return (
    <ViroParticleEmitter
      position={[0, 4.5, 0]} // Position in the scene
      duration={2000} // How long the emitter will emit particles
      visible={true} // Whether the emitter is visible
      delay={0} // No delay before starting
      run={true} // Whether it should run
      loop={true} // Loop the particle emission
      fixedToEmitter={true} // Particles follow the emitter's movement
      image={{
        source: require("../assets/images/wadzzo.png"), // Replace with your particle image
        height: 0.1,
        width: 0.1,
        bloomThreshold: 1.0, // Adjust for glow effect if needed
      }}
      spawnBehavior={{
        particleLifetime: [4000, 4000], // Particles last between 4000ms to 4000ms
        emissionRatePerSecond: [150, 200], // Particles emitted per second
        spawnVolume: {
          shape: "box", // Shape of emission area
          params: [20, 1, 20], // Size of the box
          spawnOnSurface: false, // Spawn inside the volume, not just on the surface
        },
        maxParticles: 800, // Maximum number of particles active at once
      }}
      particleAppearance={{
        opacity: {
          initialRange: [0, 0], // Start fully transparent
          factor: "time", // Change opacity over time
          interpolation: [
            { endValue: 0.5, interval: [0, 500] }, // Increase opacity to 0.5 over first 500ms
            { endValue: 1.0, interval: [4000, 5000] }, // Fade out by the end
          ],
        },
        rotation: {
          initialRange: [0, 360], // Start with random rotation
          factor: "time", // Rotate over time
          interpolation: [
            { endValue: 1080, interval: [0, 5000] }, // Spin the particle by 1080 degrees over 5 seconds
          ],
        },
        scale: {
          initialRange: [
            [5, 5, 5], // Start with larger size
            [10, 10, 10], // Range of initial scales
          ],
          factor: "time",
          interpolation: [
            { endValue: [3, 3, 3], interval: [0, 4000] }, // Shrink over 4 seconds
            { endValue: [0, 0, 0], interval: [4000, 5000] }, // Shrink to 0 by 5 seconds
          ],
        },
      }}
      particlePhysics={{
        velocity: {
          initialRange: [
            [-2, -0.5, 0], // Initial velocity range
            [2, -3.5, 0], // Spread particles over time
          ],
        },
      }}
    />
  );
};

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

  const { data } = useWinnerAnimation();

  console.log("showWinnerAnimation", data.showWinnerAnimation);
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
  useEffect(() => {
    if (data.showWinnerAnimation) {
      console.log("Winner animation triggered");
    }
  }, [data.showWinnerAnimation]);

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
      {data.showWinnerAnimation && renderWinnerAnimation()}
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
