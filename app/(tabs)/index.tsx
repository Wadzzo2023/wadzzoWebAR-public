"use client";

import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import Mapbox, { Camera, LocationPuck, MapView } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  findNodeHandle,
  Image,
  type LayoutChangeEvent,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";

import { useQuery } from "@tanstack/react-query";

import { useFocusEffect, useRouter } from "expo-router";

import {
  BrandMode,
  useAccountAction,
} from "@/components/hooks/useAccountAction";
import { useExtraInfo } from "@/components/hooks/useExtraInfo";
import type { ConsumedLocation } from "@/components/types/CollectionTypes";
import { BASE_URL } from "@/components/utils/Common";
import { ActivityIndicator } from "react-native-paper";

import { CollectionAnimation } from "@/components/CollectionAnimation";
import { useWalkThrough } from "@/components/hooks/useWalkThrough";
import { useAuth } from "@/components/lib/auth/Provider";
import LoadingScreen from "@/components/Loading";
import NearestPinIndicator from "@/components/nearest-pin-indicator";
import { type ButtonLayout, createStepsForMap } from "@/components/steps/map";
import {
  type DirectionDataType,
  useDirectionStore,
} from "@/components/store/direction-store";
import { Color } from "@/components/utils/all-colors";
import { calculateBearing, getAutoCollectPins } from "@/components/utils/map";
import { Walkthrough } from "@/components/walkthrough/WalkthroughProvider";
import { toast } from "@backpackapp-io/react-native-toast";
import { getMapAllPins } from "../api/routes/get-Map-all-pins";

import { useLocationService } from "@/components/hooks/useLocationService";
import { Balance } from "@/components/screen/map/Balance";
import { Marker } from "@/components/screen/map/Marker";
import { mapScreenStyles as styles } from "@/components/screen/map/style";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API!);

const HomeScreen = () => {
  const [locationPermission, setLocationPermission] = useState(false);

  const router = useRouter();
  const { setData: setExtraInfo } = useExtraInfo();
  const { setData: setDirectionData } = useDirectionStore();
  const [loading, setLoading] = useState(true);
  const {
    userLocation,
    nearestPin,
    nearestPinDistance,
    setUserLocation,
    setAllLocations,
    setMultipleAr,
    nearbyPins,
  } = useLocationService();
  const { data } = useAccountAction();
  const autoCollectModeRef = useRef(data.mode);
  const cameraRef = useRef<Camera>(null);
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [showAnimation, setShowAnimation] = useState(false);
  const [userHeading, setUserHeading] = useState(0);
  const scrollViewRef = useRef(null);
  const [buttonLayouts, setButtonLayouts] = useState<ButtonLayout[]>([]);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [bearing, setBearing] = useState(0);
  const { data: accountActionData, setData: setAccountActionData } =
    useAccountAction();
  const { data: walkthroughData } = useWalkThrough();
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null
  );
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null
  );
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const [handleRecenterPress, setHandleRecenterPress] = useState(false);
  const [countCurrentStep, setCountCurrentStep] = useState(0);
  const [touchOnMap, setTouchOnMap] = useState(false);

  const lastHeadingUpdate = useRef<number>(Date.now());
  const MIN_HEADING_UPDATE_INTERVAL = 3000; // Minimum time between heading updates (1 second)
  const MIN_HEADING_CHANGE = 5; // Minimum heading change in degrees to trigger update
  const steps = createStepsForMap(buttonLayouts);

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

  const handleARPress = () => {
    setMultipleAr();
    console.log(
      ">>>>>> nearest pin",
      nearestPin?.brand_name,
      nearestPinDistance,
      nearbyPins.length
    );
    router.push("/ARScreen");
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
      heading: 0,
    });

    setTimeout(() => {
      setHandleRecenterPress(false);
    }, 8000);

    setAccountActionData({
      ...accountActionData,
      trackingMode: true,
    });

    setTouchOnMap(false);
  };

  const response = useQuery({
    queryKey: ["MapsAllPins", accountActionData.brandMode],
    queryFn: async () =>
      getMapAllPins({
        filterID: accountActionData.brandMode === BrandMode.FOLLOW ? "1" : "0",
      }),
  });

  const locations = response.data?.locations ?? [];

  // Update when data changes
  useEffect(() => {
    if (locations.length > 0) {
      console.log(
        "locaiton upating, ll.................xxx",
        nearestPin,
        nearestPinDistance
      );
      setAllLocations(locations);
    }
  }, [locations]);

  useFocusEffect(
    useCallback(() => {
      if (!data.trackingMode) return; // Exit early if trackingMode is false

      // Request location permission and start watching the user's location
      const startWatchingLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
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
            timeInterval: 5000, // update position every 5 seconds
          },
          (location) => {
            const { latitude, longitude, speed } = location.coords;

            setLoading(false);
            setUserLocation({ latitude, longitude });
            console.log("User location updated:", { latitude, longitude });
            setDirectionData((prevData?: DirectionDataType) => ({
              destinationLocation: prevData?.destinationLocation, // Preserve current location
              currentLocation: {
                latitude: latitude,
                longitude: longitude,
              },
            }));

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
        headingSubscriptionRef.current = await Location.watchHeadingAsync(
          ({ trueHeading }) => {
            const now = Date.now();
            const timeSinceLastUpdate = now - lastHeadingUpdate.current;

            // Check if enough time has passed and heading change is significant
            if (
              timeSinceLastUpdate >= MIN_HEADING_UPDATE_INTERVAL &&
              Math.abs(trueHeading - userHeading) >= MIN_HEADING_CHANGE
            ) {
              setUserHeading(trueHeading);
              lastHeadingUpdate.current = now;
            }
          }
        );
      };

      startWatchingLocation();

      // Cleanup function in case the component unmounts while tracking
      return () => {
        locationSubscriptionRef.current?.remove();
        headingSubscriptionRef.current?.remove();
      };
    }, [data.trackingMode])
  ); // Depend on trackingMode

  useEffect(() => {
    if (userHeading && nearestPin && userLocation) {
      const bearing = calculateBearing(
        userLocation.latitude,
        userLocation.longitude,
        nearestPin.lat,
        nearestPin.lng
      );

      const relativeBearing = (bearing - userHeading) % 360;

      setBearing(relativeBearing);
      Animated.timing(rotateAnim, {
        toValue: relativeBearing,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start();
    }
  }, [userHeading, nearestPin, userLocation]);

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
      showPinCollectionAnimation();
    }
  }, [countCurrentStep]);

  useFocusEffect(
    useCallback(() => {
      console.log("Refetching data");
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
    autoCollectModeRef.current = data.mode;
  }, [data.mode]);

  if (
    response.isLoading ||
    loading ||
    !locationPermission ||
    !userLocation ||
    authLoading
  ) {
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
          scaleBarEnabled={false}
          attributionEnabled={false}
          onTouchMove={() => {
            setTouchOnMap(true);
            setHandleRecenterPress(false);
          }}
          onCameraChanged={(event) => {
            if (touchOnMap && data.trackingMode && !handleRecenterPress) {
              setAccountActionData({
                ...accountActionData,
                trackingMode: false,
              });
            }
          }}
        >
          <Camera
            defaultSettings={{
              centerCoordinate: [userLocation.longitude, userLocation.latitude],
            }}
            animationMode={"flyTo"}
            zoomLevel={16}
            followZoomLevel={16}
            followPitch={16}
            heading={0}
            allowUpdates={true}
            pitch={0}
            ref={cameraRef}
            centerCoordinate={[userLocation.longitude, userLocation.latitude]}
          />
          <LocationPuck
            pulsing={{ isEnabled: true }}
            puckBearingEnabled
            puckBearing="heading"
          />
          <Marker locations={locations} />
        </MapView>
        {nearestPin &&
          userLocation &&
          !showWalkthrough &&
          data.trackingMode &&
          nearestPinDistance &&
          nearestPinDistance < 5000 && (
            <NearestPinIndicator
              bearing={bearing}
              distance={nearestPinDistance || 0}
              userLocation={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              pinLocation={{
                latitude: nearestPin.lat,
                longitude: nearestPin.lng,
              }}
              pin={nearestPin}
            />
          )}
        <CollectionAnimation
          visible={showAnimation}
          onAnimationComplete={() => setShowAnimation(false)}
        />
        {showWalkthrough && (
          <View
            style={styles.welcome}
            onLayout={(event) => onButtonLayout(event, 0)}
          ></View>
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
          <Balance />
        </View>
        {/* <View style={styles.balance}>
          <Text>
            d, {nearestPin?.brand_name.slice(2)} {nearestPinDistance}
          </Text>
        </View> */}
        <TouchableOpacity
          style={[
            styles.recenterButton,
            { borderColor: data.trackingMode ? Color.wadzzo : "transparent" },
          ]}
          onPress={handleRecenter}
          onLayout={(event) => onButtonLayout(event, 4)}
        >
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={20}
            color={data.trackingMode ? Color.wadzzo : "black"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onLayout={(event) => onButtonLayout(event, 5)}
          style={styles.AR}
          onPress={() => handleARPress()}
        >
          <MaterialCommunityIcons name="cube-scan" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onLayout={(event) => onButtonLayout(event, 3)}
          style={styles.Refresh}
          onPress={async () => await response.refetch()}
        >
          {response.isFetching ? (
            <ActivityIndicator size={22} color={Color.wadzzo} />
          ) : (
            <FontAwesome name="refresh" size={22} color="black" />
          )}
        </TouchableOpacity>

        {showWalkthrough && countCurrentStep === 5 && (
          <View
            style={styles.pinCollectedAnim}
            onLayout={(event) => onButtonLayout(event, 1)}
          >
            <Image
              source={require("../../assets/images/wadzzo.png")}
              style={styles.pinImage}
            />
          </View>
        )}
      </>

      {showWalkthrough && (
        <Walkthrough
          steps={steps}
          setCountCurrentStep={setCountCurrentStep}
          onFinish={() => setShowWalkthrough(false)}
        />
      )}
    </View>
  );
};

export default HomeScreen;
