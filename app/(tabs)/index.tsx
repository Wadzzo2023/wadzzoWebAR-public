import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import Mapbox, {
  Camera,
  Images,
  LocationPuck,
  MapView,
  MarkerView,
  ShapeSource,
  SymbolLayer,
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

import { useFocusEffect, useRouter } from "expo-router";

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
import { CollectionAnimation } from "@/components/CollectionAnimation";
import { featureCollection, point } from "@turf/turf";
import { toast } from "@backpackapp-io/react-native-toast";

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
  const { setData } = useNearByPin();
  const { data } = useAccountAction();
  const autoCollectModeRef = useRef(data.mode);
  const { onOpen } = useModal();
  const cameraRef = useRef<Camera>(null);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [showAnimation, setShowAnimation] = useState(false);
  const scrollViewRef = useRef(null);
  const [buttonLayouts, setButtonLayouts] = useState<ButtonLayout[]>([]);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showAutoCollectionAnimation, setShowAutoCollectionAnimation] = useState(false);
  const { data: accountActionData, setData: setAccountActionData } =
    useAccountAction();
  const { data: walkthroughData } = useWalkThrough();
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const [handleRecenterPress, setHandleRecenterPress] = useState(false);
  const [countCurrentStep, setCountCurrentStep] = useState(0);
  const steps = [
    {
      target: buttonLayouts[0],
      title: "Welcome to the Wadzzo app!",
      content:
        "This tutorial will show you how to use Wadzzo to find pins around you, follow your favorite brands, and collect rewards.",
    },
    {
      target: buttonLayouts[2],
      title: "Wadzzo Balance",
      content:
        "The Wadzzo Balance displays your Wadzzo count. Check the Bounty Board for the latest ways to earn more Wadzzo!",
    },
    {
      target: buttonLayouts[3],
      title: "Refresh Button",
      content:
        "If you need to refresh your map, press the refresh button. This will reload your entire map with all up to date app data.",
    },
    {
      target: buttonLayouts[4],
      title: "Re-center button",
      content:
        "Press the Re-center button to center your map view to your current location",
    },
    {
      target: buttonLayouts[5],
      title: "AR button",
      content:
        "To collect manual pins, press the AR button on your map to view your surroundings.  Locate the icon on your screen, then press the Collect button that appears below it to add the item to your collection.",
    },
    {
      target: buttonLayouts[1],
      title: "Pin Auto Collection",
      content:
        "When you automatically collect a pin a celebration will play on screen, indicating your auto collection. This celebration will appear as Wadzzo bursting across your map.",
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
    const nearbyPins = getNearbyPins(userLocation, locations, 50);
    console.log("Nearby pins:", nearbyPins.length);
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
    userLocation: userLocationType | null,
    locations: ConsumedLocation[],
    radius: number
  ) => {
    if (!userLocation) return []; // Exit early if userLocation is null
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
        break; // Exit if auto-collect is turned off
      }
      if (pin.collection_limit_remaining <= 0 || pin.collected) {
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
        console.log("Collected pin:", pin.id);
        showPinCollectionAnimation();
      }

      await new Promise((resolve) => setTimeout(resolve, 20000)); // Wait 20 seconds
    }
  };

  const showPinCollectionAnimation = () => {
    setShowAnimation(true);
  };

  const handleRecenter = () => {
    if (!userLocation || !cameraRef.current) {
      toast.error("Unable to center the map. User location unavailable.");
      return;
    }
    setHandleRecenterPress(true);
    cameraRef.current.setCamera({
      centerCoordinate: [userLocation.longitude, userLocation.latitude],
      zoomLevel: 16,
    });

    setTimeout(() => {
      setHandleRecenterPress(false);
    }, 8000);

    setAccountActionData({
      ...accountActionData,
      trackingMode: true,
    });


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
    if (!data.trackingMode) return; // Exit early if trackingMode is false

    // Request location permission and start watching the user's location
    const startWatchingLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        return;
      }

      setLocationPermission(true);

      // Start watching the user's location
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1, // update position every meter
          timeInterval: 5000,  // update position every 5 seconds
        },
        (location) => {
          const { latitude, longitude, speed } = location.coords;

          setLoading(false);
          setUserLocation({ latitude, longitude });
          console.log("User location:", latitude, longitude);

          // Track user activity based on speed
          if (speed! >= 3) {
            console.log("User is running");
          } else if (speed! >= 0.5) {
            console.log("User is walking");
          } else {
            console.log("User is stationary");
          }

          setExtraInfo({
            useCurrentLocation: { latitude, longitude },
          });
        }
      );
    };

    startWatchingLocation();

    // Cleanup function in case the component unmounts while tracking
    return () => {
      locationSubscriptionRef.current?.remove();
    };
  }, [data.trackingMode]); // Depend on trackingMode

  useEffect(() => {
    if (authLoading) return; // Exit if still loading

    if (!isAuthenticated) {
      router.replace("/Login");
    } else {
      checkFirstTimeSignIn(); // Check if it's the first sign-in
    }
  }, [authLoading, isAuthenticated, walkthroughData]);


  useEffect(() => {
    console.log("Tracking mode:", data.trackingMode);
  }, [data.trackingMode]);

  useEffect(() => {
    if (countCurrentStep === 5) {
      console.log("countCurrentStep", countCurrentStep)
      showPinCollectionAnimation();
    }
  }, [countCurrentStep]);

  useFocusEffect(
    useCallback(() => {
      console.log("Refetching data"),
        response.refetch();
    }, [])
  );



  useEffect(() => {
    if (data.mode && locations) {
      const autoCollectPins = getAutoCollectPins(userLocation, locations, 50);
      if (autoCollectPins.length > 0) {
        collectPinsSequentially(autoCollectPins);
      }
    }
  }, [data.mode, locations]);

  useEffect(() => {
    console.log("Auto collect mode:", data.mode);
    autoCollectModeRef.current = data.mode;
  }, [data.mode]);



  if (response.isLoading || loading || !locationPermission || !userLocation || authLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container} ref={scrollViewRef}>

      <>
        <MapView
          styleURL="mapbox://styles/wadzzo/cm1xtphyn01ci01pi20jhfbto"
          style={styles.map}

          pitchEnabled={true}
          logoEnabled={false}
          onCameraChanged={(event) => {
            // console.log("Region is changing:", event.properties.zoom);
            if ((event.properties.zoom < 14 || event.properties.zoom > 18) && data.trackingMode && !handleRecenterPress) {
              // console.log("Zoom level:", event.properties.zoom.toFixed(0));
              setAccountActionData({
                ...accountActionData,
                trackingMode: false,
              });
            }
          }
          }
        >
          <Camera
            defaultSettings={{
              centerCoordinate: [userLocation.longitude, userLocation.latitude],
            }}
            zoomLevel={16}
            followZoomLevel={16}
            followPitch={16}
            heading={0}
            pitch={0}
            ref={cameraRef}
            centerCoordinate={[userLocation.longitude, userLocation.latitude]}
          />
          <LocationPuck pulsing={{ isEnabled: true }} puckBearingEnabled puckBearing="heading" />
          <Marker locations={locations} />
        </MapView>
        <CollectionAnimation
          visible={showAnimation}
          onAnimationComplete={() => setShowAnimation(false)}
        />
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
          onLayout={(event) => onButtonLayout(event, 2)}
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
          onLayout={(event) => onButtonLayout(event, 4)}
        >
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={20}
            color="black"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onLayout={(event) => onButtonLayout(event, 5)}
          style={styles.AR}
          onPress={() => handleARPress(userLocation, locations)}
        >
          <MaterialCommunityIcons name="cube-scan" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onLayout={(event) => onButtonLayout(event, 3)}
          style={styles.Refresh}
          onPress={async () => await response.refetch()}
        >
          <FontAwesome name="refresh" size={20} color="black" />
        </TouchableOpacity>

        {
          showWalkthrough && countCurrentStep === 5 && (
            <View
              style={styles.pinCollectedAnim}
              onLayout={(event) => onButtonLayout(event, 1)}
            >
              <Image
                source={require("../../assets/images/wadzzo.png")}
                style={styles.pinImage}
              />
            </View>
          )
        }


      </>

      {showWalkthrough && (
        <Walkthrough steps={steps} setCountCurrentStep={setCountCurrentStep} onFinish={() => setShowWalkthrough(false)} />
      )}
    </View>
  );
};

const Marker = ({ locations }: { locations: ConsumedLocation[] }) => {
  const { onOpen } = useModal();
  const pins = locations.map((location) => point([location.lng, location.lat]));
  return (
    <>
      {locations.map((location: ConsumedLocation, index: number) => (
        <MarkerView
          allowOverlap={true}
          allowOverlapWithPuck={true}
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
                  borderWidth: 2,

                  borderColor: Color.wadzzo,
                },
                !location.auto_collect && {
                  borderRadius: 20, // Add borderRadius only when auto_collect is false
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
