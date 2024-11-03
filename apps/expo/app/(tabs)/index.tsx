import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native"; // Import the hook
import Mapbox, {
  Camera,
  MapView,
  MarkerView,
  UserLocation,
} from "@rnmapbox/maps";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { useQuery } from "@tanstack/react-query";

import LoadingScreen from "@/components/Loading";
import {
  BrandMode,
  useAccountAction,
} from "@/components/hooks/useAccountAction";
import { useExtraInfo } from "@/components/hooks/useExtraInfo";
import { useModal } from "@/components/hooks/useModal";
import { useNearByPin } from "@/components/hooks/useNearbyPin";
import { getMapAllPins } from "@api/routes/get-Map-all-pins";
import { ConsumedLocation } from "@app/types/CollectionTypes";
import { Color } from "app/utils/Colors";
import { BASE_URL } from "app/utils/Common";
import { useRouter } from "expo-router";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API!);

type userLocationType = {
  latitude: number;
  longitude: number;
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
  const { onOpen } = useModal();
  const cameraRef = useRef<Camera>(null);
  const { data: accountActionData, setData: setAccountActionData } =
    useAccountAction();
  const isFocused = useIsFocused();

  const getNearbyPins = (
    userLocation: userLocationType,
    locations: ConsumedLocation[],
    radius: number
  ) => {
    return locations.filter((location) => {
      if (location.auto_collect || location.collection_limit_remaining <= 0)
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
      if (location.collection_limit_remaining <= 0) return false;
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
        console.log("Auto collect mode paused");
        return; // Exit if auto-collect is turned off
      }
      if (pin.collection_limit_remaining <= 0) {
        console.log("Pin limit reached:", pin.id);
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

  const response = useQuery({
    queryKey: ["MapsAllPins"],
    queryFn: () =>
      getMapAllPins({
        filterID: accountActionData.brandMode === BrandMode.FOLLOW ? "1" : "0",
      }),
  });

  const locations = response.data?.locations ?? [];

  useEffect(() => {
    autoCollectModeRef.current = data.mode;
  }, [data.mode]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        return;
      }

      setLocationPermission(true);

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 1,
      });
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setExtraInfo({
        useCurrentLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      });

      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (userLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 16,
        animationDuration: 1000,
      });
    }
  }, [userLocation]);

  useEffect(() => {
    if (data.mode && userLocation && locations) {
      const autoCollectPins = getAutoCollectPins(userLocation, locations, 100);

      if (autoCollectPins.length > 0) {
        collectPinsSequentially(autoCollectPins);
      }
    }
  }, [data.mode, userLocation, locations]);

  const handleRecenter = () => {
    if (userLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 16,
        animationDuration: 1000,
      });
      setFollowUser(true); // Enable following again
    }
  };

  useEffect(() => {
    if (isFocused) {
      handleRecenter();
    }
  }, [isFocused]);

  return (
    <View style={styles.container}>
      {loading ? (
        <LoadingScreen />
      ) : (
        locationPermission &&
        userLocation && (
          <>
            <MapView
              styleURL="mapbox://styles/wadzzo/cm1xtphyn01ci01pi20jhfbto"
              style={styles.map}
              pitchEnabled={true}
              shouldRasterizeIOS={true}
              logoEnabled={false}
            >
              <UserLocation visible={true} />
              <Camera
                defaultSettings={{
                  centerCoordinate: [
                    userLocation.longitude,
                    userLocation.latitude,
                  ],
                }}
                animationMode="none"
                zoomLevel={16}
                pitch={0}
                ref={cameraRef}
                centerCoordinate={[
                  userLocation.longitude,
                  userLocation.latitude,
                ]}
              />
              <Marker locations={locations} />
            </MapView>

            {/* Recenter button */}
            <TouchableOpacity
              style={styles.recenterButton}
              onPress={handleRecenter}
            >
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={20}
                color="black"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.AR}
              onPress={() => handleARPress(userLocation, locations)}
            >
              <MaterialCommunityIcons
                name="cube-scan"
                size={20}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
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
        )
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
                !location.collected && {},
                location.collection_limit_remaining <= 0 && {
                  opacity: 0.4,
                },
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
    bottom: 80,
    right: 10,
    backgroundColor: Color.white,
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  AR: {
    position: "absolute",
    bottom: 140,
    right: 10,
    backgroundColor: Color.wadzzo,
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  Refresh: {
    position: "absolute",
    bottom: 80,
    right: 60,
    backgroundColor: Color.white,
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
});

export default HomeScreen;
