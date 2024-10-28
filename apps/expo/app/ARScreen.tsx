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
import { BASE_URL } from "@/constants/Common";
import { useNearByPin } from "@/components/hooks/useNearbyPin";
import { Appbar, Text } from "react-native-paper";
import { useFocusEffect, useRouter } from "expo-router";
import { Color } from "@/constants/Colors";
import { useQueryClient } from "@tanstack/react-query";
import ARSceneAR from "@/components/ARSceneAR";
const { width, height } = Dimensions.get("window");

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
  const auraAnimation = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;

  const startAuraAnimation = () => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(auraAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(auraAnimation, {
          toValue: 0,
          duration: 1000,
          delay: 3000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(logoRotation, {
        toValue: 1,
        duration: 4000, // 5 seconds total - 1 second
        useNativeDriver: true,
      }),
    ]).start(() => {
      logoRotation.setValue(0); // Reset rotation for next animation
    });
  };
  const spin = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

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
          startAuraAnimation();
          setTimeout(() => {
            setLoading(false);
            setCapturedItem(null);
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
          {capturedItem ? capturedItem.title : "No item captured"}
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

      {!singleAR && (
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
          <Animated.View
            style={[
              styles.auraEffect,
              {
                opacity: auraAnimation,
                transform: [
                  {
                    scale: auraAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.5],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.auraCircle} />
            <Animated.Image
              source={require("../assets/images/wadzzo.png")}
              style={[
                styles.logo,
                {
                  transform: [{ rotate: spin }],
                },
              ]}
            />
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
