import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Animated,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  Vibration,
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
import { ConsumedLocation } from "@app/types/CollectionTypes";
import { BASE_URL } from "app/utils/Common";
import { useNearByPin } from "@/components/hooks/useNearbyPin";
import { Appbar, Text } from "react-native-paper";
import { useFocusEffect, useRouter } from "expo-router";
import { Color } from "app/utils/Colors";
import { useQueryClient } from "@tanstack/react-query";
import ARSceneAR from "@/components/ARSceneAR";
import { useWinnerAnimation } from "@/components/hooks/useWinnerAnimation";
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
});
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
  const onCaptureButtonPress = async () => {
    if (capturedItem) {
      console.log(`Captured item: ${capturedItem.id}`);
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
        console.log("response", response);
        if (response.ok) {
          Vibration.vibrate(1000);
          setData({
            showWinnerAnimation: true,
          });
          setTimeout(() => {
            setLoading(false);
            setCapturedItem(null);
            setData({
              showWinnerAnimation: false,
            });
            queryClient.invalidateQueries({
              queryKey: ["collection", "MapsAllPins"],
            });
            router.back();
          }, 5000);
        } else {
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
        console.error("Error claiming item:", error);
      }
      setCapturedItem(null);
    } else {
      console.log("No item captured");
    }
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
