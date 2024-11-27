import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import Mapbox, {
  Camera,
  LocationPuck,
  MapView,
  MarkerView,
  UserLocation,
  UserTrackingMode,
} from "@rnmapbox/maps";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  findNodeHandle,
  Image,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { useQuery } from "@tanstack/react-query";

import { useRouter } from "expo-router";

import { Text } from "react-native-paper";
import { useExtraInfo } from "@/components/hooks/useExtraInfo";
import { useNearByPin } from "@/components/hooks/useNearbyPin";
import {
  BrandMode,
  useAccountAction,
} from "@/components/hooks/useAccountAction";
import { useModal } from "@/components/hooks/useModal";
import { ConsumedLocation } from "@/components/types/CollectionTypes";
import { BASE_URL } from "@/components/utils/Common";
import { getMapAllPins } from "../api/routes/get-Map-all-pins";
import { getUserPlatformAsset } from "../api/routes/get-user-platformAsset";
import LoadingScreen from "@/components/Loading";
import { Color } from "@/components/utils/all-colors";
import { Walkthrough } from "@/components/walkthrough/WalkthroughProvider";
import { useWalkThrough } from "@/components/hooks/useWalkThrough";
import { useAuth } from "@/components/lib/auth/Provider";
import { Position } from "@rnmapbox/maps/lib/typescript/src/types/Position";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API!);

type userLocationType = {
  latitude: number;
  longitude: number;
};
type ButtonLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};
const HomeScreen = () => {
  const [locationPermission, setLocationPermission] = useState(false);
  const [userLocation, setUserLocation] = useState<userLocationType | null>(
    null
  );
  const [pinAnim] = useState(new Animated.Value(0));

  const router = useRouter();
  const { setData: setExtraInfo } = useExtraInfo();
  const [loading, setLoading] = useState(true);
  const [followUser, setFollowUser] = useState(true);
  const { setData } = useNearByPin();
  const { data } = useAccountAction();
  const autoCollectModeRef = useRef(data.mode);
  const [trackingMode, setTrackingMode] = useState(true);
  const { onOpen } = useModal();
  const cameraRef = useRef<Camera>(null);
  const { isAuthenticated } = useAuth();
  const [center, setCenter] = useState<Position>([0, 0]);
  const scrollViewRef = useRef(null);
  const [buttonLayouts, setButtonLayouts] = useState<ButtonLayout[]>([]);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const { data: accountActionData, setData: setAccountActionData } =
    useAccountAction();
  const { data: walkthroughData } = useWalkThrough();

  const steps = [
    {
      target: buttonLayouts[0],
      title: "Welcome to the Wadzzo app!",
      content:
        "This tutorial will show you how to use Wadzzo to find pins around you, follow your favorite brands, and collect rewards.",
    },
    {
      target: buttonLayouts[1],
      title: "Wadzzo Balance",
      content:
        "The Wadzzo Balance displays your Wadzzo count. Check the Bounty Board for the latest ways to earn more Wadzzo!",
    },
    {
      target: buttonLayouts[2],
      title: "Refresh Button",
      content:
        "If you need to refresh your map, press the refresh button. This will reload your entire map with all up to date app data.",
    },
    {
      target: buttonLayouts[3],
      title: "Re-center button",
      content:
        "Press the Re-center button to center your map view to your current location",
    },
    {
      target: buttonLayouts[4],
      title: "AR button",
      content:
        "To collect manual pins, press the AR button on your map to view your surroundings. Locate the icon on your screen, then tap Claim to add the item to your collection.",
    },
  ];
  const onButtonLayout = useCallback(
    (event: LayoutChangeEvent, index: number) => {
      if (scrollViewRef.current) {
        const scrollViewHandle = findNodeHandle(scrollViewRef.current);
        if (scrollViewHandle) {
          event.target.measureLayout(
            scrollViewHandle,
            (x, y, width, height) => {
              setButtonLayouts((prevLayouts) => {
                const newLayouts = [...prevLayouts];
                newLayouts[index] = { x, y, width, height };
                // console.log(newLayouts);
                return newLayouts;
              });
            },
            () => console.error("Failed to measure layout")
          );
        }
      }
    },
    []
  );
  const checkFirstTimeSignIn = async () => {
    // console.log(showWalkthrough);
    if (walkthroughData.showWalkThrough) {
      setShowWalkthrough(true);
    } else {
      setShowWalkthrough(false);
    }
  };
  const getNearbyPins = (
    userLocation: userLocationType,
    locations: ConsumedLocation[],
    radius: number
  ) => {
    return locations.filter((location) => {
      if (location.auto_collect || location.collection_limit_remaining <= 0 || location.collected)
        return false;
      const distance = getDistanceFromLatLonInMeters(
        userLocation.latitude,
        userLocation.longitude,
        location.lat,
        location.lng
      );
      return distance <= radius;
    });
  };

  const getDistanceFromLatLonInMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      0.5 -
      Math.cos(dLat) / 2 +
      (Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        (1 - Math.cos(dLon))) /
      2;
    return R * 2 * Math.asin(Math.sqrt(a));
  };

  const handleARPress = (
    userLocation: userLocationType,
    locations: ConsumedLocation[]
  ) => {
    const nearbyPins = getNearbyPins(userLocation, locations, 1000);
    if (nearbyPins.length > 0) {
      setData({
        nearbyPins: nearbyPins,
        singleAR: false,
      });
      router.push("/ARScreen");
    } else {
      onOpen("NearbyPin");
    }
  };

  const getAutoCollectPins = (
    userLocation: userLocationType,
    locations: ConsumedLocation[],
    radius: number
  ) => {
    return locations.filter((location) => {
      if (location.collection_limit_remaining <= 0 || location.collected) return false;
      if (location.auto_collect) {
        const distance = getDistanceFromLatLonInMeters(
          userLocation.latitude,
          userLocation.longitude,
          location.lat,
          location.lng
        );
        return distance <= radius;
      }
    });
  };
  const collectPinsSequentially = async (pins: ConsumedLocation[]) => {
    for (const pin of pins) {
      if (!autoCollectModeRef.current) {
        // console.log("Auto collect mode paused");
        return; // Exit if auto-collect is turned off
      }
      if (pin.collection_limit_remaining <= 0) {
        // console.log("Pin limit reached:", pin.id);
        continue;
      }
      const response = await fetch(
        new URL("api/game/locations/consume", BASE_URL).toString(),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ location_id: pin.id.toString() }),
        }
      );

      if (response.ok) {
        // console.log("Collected pin:", pin.id);
        showPinCollectionAnimation();
      }

      await new Promise((resolve) => setTimeout(resolve, 20000)); // Wait 20 seconds
    }
  };

  const showPinCollectionAnimation = () => {
    Animated.sequence([
      Animated.timing(pinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pinAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRecenter = () => {
    if (userLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 16,

      });
      setFollowUser(true); // Enable following again
    }
  };
  const response = useQuery({
    queryKey: ["MapsAllPins", accountActionData.brandMode],
    queryFn: async () =>
      getMapAllPins({
        filterID: accountActionData.brandMode === BrandMode.FOLLOW ? "1" : "0",
      }),
  });
  const balanceRes = useQuery({
    queryKey: ["balance"],
    queryFn: getUserPlatformAsset,
  });
  const locations = response.data?.locations ?? [];

  useEffect(() => {
    // Request location permission
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        return;
      }

      setLocationPermission(true);


      // Start watching the user's location
      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1, // update position every meter
          timeInterval: 1000,  // update position every second
        },
        (location) => {
          const { latitude, longitude, speed } = location.coords;

          setLoading(false);
          setUserLocation({
            latitude,
            longitude,
          });
          console.log("User location:", latitude, longitude);
          // Track if the user is walking or running based on speed (in meters per second)
          if (speed! >= 3) {
            console.log("User is running");
          } else if (speed! >= 0.5) {
            console.log("User is walking");
          } else {
            console.log("User is stationary");
          }

          setExtraInfo({
            useCurrentLocation: {
              latitude,
              longitude,
            },
          });
        }
      );

      // Clean up the subscription when the component unmounts or when location tracking stops
      return () => {
        if (locationSubscription) {
          locationSubscription.remove();
        }
      };
    })();
  }, []);


  useEffect(() => {
    if (userLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 16,
        animationDuration: 5000,
      });
    }
  }, [userLocation]);
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/Login");
    } else {
      checkFirstTimeSignIn(); // Check if it's the first sign-in
    }
  }, [isAuthenticated, walkthroughData]);

  useEffect(() => {
    if (userLocation && cameraRef.current) {
      let zoomLevel = 16; // Default zoom level for walking
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel,
        animationDuration: 1000,
      });
    }
  }, [userLocation]);

  useEffect(() => {
    if (data.mode && userLocation && locations) {
      const autoCollectPins = getAutoCollectPins(userLocation, locations, 1000);
      // console.log("Auto collect pins:", autoCollectPins);
      if (autoCollectPins.length > 0) {
        collectPinsSequentially(autoCollectPins);
      }
    }
  }, [data.mode, userLocation, locations]);

  useEffect(() => {
    autoCollectModeRef.current = data.mode;
  }, [data.mode]);



  if (response.isLoading || loading || !locationPermission || !userLocation) {
    return <LoadingScreen />;
  }


  return (
    <View style={styles.container} ref={scrollViewRef}>

      <>
        <MapView
          styleURL="mapbox://styles/wadzzo/cm1xtphyn01ci01pi20jhfbto"
          style={styles.map}
          pitchEnabled={true}
          shouldRasterizeIOS={true}
          logoEnabled={false}


        >
          <Camera
            defaultSettings={{
              centerCoordinate: [userLocation.longitude, userLocation.latitude],
            }}

            zoomLevel={16}
            followZoomLevel={16}
            followPitch={16}
            pitch={0}
            allowUpdates={true}
            followUserMode={UserTrackingMode.Follow}
            ref={cameraRef}
            centerCoordinate={[userLocation.longitude, userLocation.latitude]}
          />
          <LocationPuck pulsing={{ isEnabled: true }} puckBearingEnabled puckBearing="heading" />
          <Marker locations={locations} />
        </MapView>

        {showWalkthrough && (
          <View
            style={styles.welcome}
            onLayout={(event) => onButtonLayout(event, 0)}
          >

          </View>
        )}
        {/* Recenter button */}
        <View
          style={styles.balance}
          onLayout={(event) => onButtonLayout(event, 1)}
        >
          <Image
            style={{
              height: 20,
              width: 20,
            }}
            source={require("../../assets/images/wadzzo.png")}
            height={100}
            width={100}
          />
          <Text
            style={{
              color: "white",
            }}
          >
            {Number(balanceRes.data).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={handleRecenter}
          onLayout={(event) => onButtonLayout(event, 3)}
        >
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={20}
            color="black"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onLayout={(event) => onButtonLayout(event, 4)}
          style={styles.AR}
          onPress={() => handleARPress(userLocation, locations)}
        >
          <MaterialCommunityIcons name="cube-scan" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onLayout={(event) => onButtonLayout(event, 2)}
          style={styles.Refresh}
          onPress={async () => await response.refetch()}
        >
          <FontAwesome name="refresh" size={20} color="black" />
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.pinCollectedAnim,
            {
              opacity: pinAnim,
              transform: [
                {
                  scale: pinAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.5], // Scale effect from 1 to 1.5
                  }),
                },
              ],
            },
          ]}
        >
          <Image
            source={require("../../assets/images/wadzzo.png")}
            style={styles.pinImage}
          />
        </Animated.View>
      </>

      {showWalkthrough && (
        <Walkthrough steps={steps} onFinish={() => setShowWalkthrough(false)} />
      )}
    </View>
  );
};

const Marker = ({ locations }: { locations: ConsumedLocation[] }) => {
  const { onOpen } = useModal();
  return (
    <>
      {locations.map((location: ConsumedLocation, index: number) => (
        <MarkerView
          key={`${index}-${location.id}`}
          coordinate={[location.lng, location.lat]}
        >
          <TouchableOpacity
            onPress={() =>
              onOpen("LocationInformation", {
                Collection: location,
              })
            }
          >
            <Image
              source={{ uri: location.brand_image_url }}
              height={30}
              width={30}
              style={[
                {
                  height: 30,
                  width: 30,
                },
                !location.auto_collect && {
                  borderRadius: 15, // Add borderRadius only when auto_collect is false
                },
                location.collected && { opacity: 0.4, }
              ]}
            />
          </TouchableOpacity>
        </MarkerView>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 40,
    height: 60,
  },
  markerImage: {
    width: "100%",
    height: "100%",
  },
  autoCollectButton: {
    position: "absolute",
    bottom: 100,
    left: 20,
    padding: 10,
    backgroundColor: Color.wadzzo,
    borderRadius: 8,
  },
  pinCollectedAnim: {
    position: "absolute",
    bottom: 300,
    left: "50%",
    marginLeft: -50,
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
    backgroundColor: Color.wadzzo, // Your branding color here
  },
  pinImage: {
    width: 80,
    height: 80,
  },

  recenterButton: {
    position: "absolute",
    bottom: Platform.OS === 'ios' ? 90 : 80,
    right: 10,
    backgroundColor: Color.white,
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  balance: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    gap: 4,
    top: 40,
    right: 10,
    backgroundColor: Color.wadzzo,
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  welcome: {
    position: "absolute",
    top: 100,
    left: 10,
  },

  AR: {
    position: "absolute",
    bottom: Platform.OS === 'ios' ? 150 : 140,
    right: 10,
    backgroundColor: Color.wadzzo,
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  Refresh: {
    position: "absolute",
    bottom: Platform.OS === 'ios' ? 90 : 80,
    right: 60,
    backgroundColor: Color.white,
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
});

export default HomeScreen;
