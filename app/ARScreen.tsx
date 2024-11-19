import { ViroARSceneNavigator, ViroAnimations } from "@reactvision/react-viro";
import { useQueryClient } from "@tanstack/react-query";

import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";

import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { Appbar, Text } from "react-native-paper";
import Svg, {
  ClipPath,
  Defs,
  Polygon,
  Image as SvgImage,
} from "react-native-svg";
import { useNearByPin } from "../components/hooks/useNearbyPin";
import { ConsumedLocation } from "../components/types/CollectionTypes";
import { useWinnerAnimation } from "../components/hooks/useWinnerAnimation";
import { BASE_URL } from "../components/utils/Common";
import ARSceneAR from "../components/ARSceneAR";
import { Color } from "../components/utils/all-colors";
const { width, height } = Dimensions.get("window");

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
  spacecraftEnter: {
    properties: {
      positionY: "-=10",
      opacity: 1,
    },
    duration: 1000,
    easing: "EaseInEaseOut",
  },
  lightPulse: {
    properties: {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
    },
    duration: 1000,
    easing: "EaseInEaseOut",
  },

  lightFade: {
    properties: {
      opacity: 0.5,
    },
    duration: 1000,
    easing: "EaseInEaseOut",
  },
});

const HexagonalImage = ({ source }: { source: string; style?: any }) => {
  return (
    <View style={styles.HexContainer}>
      <Svg height="100%" width="100%" viewBox="0 0 100 100" style={styles.svg}>
        <Defs>
          <ClipPath id="hexagonClip">
            <Polygon points="50 0, 95 25, 95 75, 50 100, 5 75, 5 25" />
          </ClipPath>
        </Defs>
        <SvgImage
          href={{ uri: source }}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#hexagonClip)"
        />
      </Svg>
    </View>
  );
};
const ARScene = () => {
  const { data } = useNearByPin();
  const items = data?.nearbyPins || [];
  const singleAR = data.singleAR;
  const router = useRouter();
  const [capturedItem, setCapturedItem] = useState<ConsumedLocation | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { setData } = useWinnerAnimation();
  const spacecraftAnimation = useRef(new Animated.Value(0)).current;
  const beamOpacity = useRef(new Animated.Value(0)).current;
  const beamScale = useRef(new Animated.Value(0)).current;
  const itemAnimation = useRef(new Animated.Value(height)).current;
  const spacecraftFlyOut = useRef(new Animated.Value(0)).current;
  const itemOpacity = useRef(new Animated.Value(0)).current;

  const onCaptureButtonPress = async () => {
    if (capturedItem) {
      setLoading(true);
      try {
        const response = await fetch(
          new URL("api/game/locations/consume", BASE_URL).toString(),
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ location_id: capturedItem.id.toString() }),
          }
        );

        if (response.ok) {
          Vibration.vibrate(1000);
          setData({ showWinnerAnimation: true });

          Animated.timing(itemOpacity, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }).start(() => {
            Animated.timing(itemAnimation, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }).start(() => {
              // Start spacecraft and beam animations
              Animated.parallel([
                Animated.timing(itemOpacity, {
                  toValue: 0,
                  duration: 1000,
                  useNativeDriver: true,
                }),
                Animated.timing(spacecraftAnimation, {
                  toValue: 1,
                  duration: 1000,
                  useNativeDriver: true,
                }),
                Animated.sequence([
                  Animated.timing(beamOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                  }),
                  Animated.timing(beamOpacity, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                  }),
                ]),
                Animated.sequence([
                  Animated.timing(beamScale, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                  }),
                  Animated.timing(beamScale, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true,
                  }),
                ]),
              ]).start(() => {
                // Fly out animation
                Animated.timing(spacecraftFlyOut, {
                  toValue: 1,
                  duration: 1000,
                  useNativeDriver: true,
                }).start(() => {
                  setLoading(false);
                  setCapturedItem(null);
                  setData({ showWinnerAnimation: false });
                  queryClient.invalidateQueries({
                    queryKey: ["collection", "MapsAllPins"],
                  });
                  router.back();
                });
              });
            });
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
        console.error("Error claiming item:", error);
      }
    } else {
      console.log("No item captured");
    }
  };

  const beamStyle = {
    opacity: beamOpacity,
    transform: [{ scale: beamScale }],
  };

  const spacecraftStyle = {
    transform: [
      {
        translateY: spacecraftAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [-100, 0],
        }),
      },
      {
        translateY: spacecraftFlyOut.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -height],
        }),
      },
    ],
    opacity: spacecraftAnimation,
  };

  const itemStyle = {
    transform: [
      {
        translateY: itemAnimation,
      },
    ],
    opacity: itemOpacity,
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction color="white" onPress={() => router.back()} />
        <Appbar.Content title={"AR Scanner"} titleStyle={styles.appbarTitle} />
      </Appbar.Header>
      {!singleAR && (
        <Text style={styles.itemTitle}>
          {capturedItem
            ? loading
              ? "Collecting Pin...."
              : capturedItem.title
            : "No item selected!"}
        </Text>
      )}

      <ViroARSceneNavigator
        autofocus={true}
        initialScene={{
          scene: () => (
            <ARSceneAR
              onCapture={setCapturedItem}
              items={items}
              singleAR={singleAR}
            />
          ),
        }}
        style={styles.f1}
      />

      {!singleAR && capturedItem && (
        <>
          <TouchableOpacity
            disabled={loading || !capturedItem}
            style={styles.captureButton}
            onPress={onCaptureButtonPress}
          >
            <Image
              source={require("../assets/images/scan.png")}
              style={styles.captureIcon}
            />
          </TouchableOpacity>
        </>
      )}

      {loading && capturedItem && (
        <>
          <Animated.View style={[styles.spacecraft, spacecraftStyle]}>
            <Image
              source={require("../assets/images/spacecraft.png")}
              style={styles.spacecraftImage}
            />
            <Animated.Image
              source={require("../assets/images/light_beam.png")}
              style={[styles.beamLight, beamStyle]}
            />
          </Animated.View>
          <Animated.View style={[styles.item, itemStyle]}>
            <HexagonalImage
              source={capturedItem.image_url}
              style={styles.itemImage}
            />
            {/* <Image
              source={{ uri: capturedItem.image_url }}
              style={styles.itemImage}
            /> */}
          </Animated.View>
        </>
      )}
    </View>
  );
};

export default ARScene;

const styles = StyleSheet.create({
  arNavigator: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  beamLight: {
    position: "absolute",
    width: 150,
    height: 300,
    resizeMode: "contain",
    bottom: -150, // Adjust this for beam positioning below the spacecraft
  },
  HexContainer: {
    width: 80, // adjust to the desired hexagon width
    height: 80, // adjust to the desired hexagon height
    aspectRatio: 1, // Ensure aspect ratio is 1:1 for hexagon shape
    overflow: "hidden",
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
    // for testing purposes // for testing purposes
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
    fontSize: 20,
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
  hexagonImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  auraCircle: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  item: {
    position: "absolute",
    bottom: height - 230,
    alignSelf: "center",
  },
  itemImage: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  logo: {
    position: "absolute",
    width: width * 0.2,
    height: width * 0.2,
    resizeMode: "contain",
  },
  spacecraft: {
    position: "absolute",
    top: 80, // Adjust this value to position the spacecraft below the "Collecting Pin...." text
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  spacecraftImage: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
});
