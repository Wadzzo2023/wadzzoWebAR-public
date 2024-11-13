import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Alert,
  TouchableOpacity,
  Animated,
} from "react-native";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";

import { useQuery } from "@tanstack/react-query";

import { getMapAllPins } from "@api/routes/get-Map-all-pins";
import { ConsumedLocation } from "@app/types/CollectionTypes";
import { MdOutlineViewInAr } from "react-icons/md";

import { Color } from "app/utils/all-colors";
import { useNearByPin } from "@/components/hooks/useNearbyPin";

import { useExtraInfo } from "@/components/hooks/useExtraInfo";
import { BASE_URL } from "@app/utils/Common";
import {
  BrandMode,
  useAccountAction,
} from "@/components/hooks/useAccountAction";
import Image from "next/image";
import LoadingScreen from "@/components/Loading";
import { useModal } from "@/components/hooks/useModal";

import { FaLocationCrosshairs } from "react-icons/fa6";
import { FiRefreshCcw } from "react-icons/fi";
import MainLayout from "./layout";
import { useRouter } from "next/router";

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

  const { setData } = useNearByPin();
  const { data } = useAccountAction();
  const autoCollectModeRef = useRef(data.mode);
  const { onOpen } = useModal();

  const { data: accountActionData } = useAccountAction();

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
    const nearbyPins = getNearbyPins(userLocation, locations, 50000);
    if (nearbyPins.length > 0) {
      setData({
        nearbyPins: nearbyPins,
        singleAR: false,
      });
      router.push("/(tabs)/ar2");
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
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      Alert.alert("Geolocation is not supported by your browser");
      return;
    }

    // Request location permission and get location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission(true);
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setExtraInfo({
          useCurrentLocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
        setLoading(false);
      },
      (error) => {
        Alert.alert("Permission to access location was denied");
        console.error(error);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    if (data.mode && userLocation && locations) {
      const autoCollectPins = getAutoCollectPins(userLocation, locations, 100);

      if (autoCollectPins.length > 0) {
        collectPinsSequentially(autoCollectPins);
      }
    }
  }, [data.mode, userLocation, locations]);

  if (response.isLoading) {
    return <LoadingScreen />;
  }
  return (
    <MainLayout>
      <View style={styles.container}>
        {loading ? (
          <LoadingScreen />
        ) : (
          locationPermission &&
          userLocation && (
            <>
              <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}>
                <Map
                  minZoom={4}
                  defaultZoom={10}
                  onZoomChanged={(zoom) => console.log("Zoom changed", zoom)}
                  defaultCenter={
                    userLocation
                      ? {
                          lat: userLocation.latitude,
                          lng: userLocation.longitude,
                        }
                      : { lat: 0, lng: 0 }
                  }
                  mapId={"bf51eea910020fa25a"}
                  gestureHandling={"greedy"}
                  style={styles.map}
                  zoomControl={false}
                >
                  <Marker
                    position={{
                      lat: userLocation.latitude,
                      lng: userLocation.longitude,
                    }}
                  />
                  <MyPins locations={locations} />
                </Map>
                {/* Recenter button */}
                <TouchableOpacity style={styles.recenterButton}>
                  <FaLocationCrosshairs size={20} color="black" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.AR}
                  onPress={() => handleARPress(userLocation, locations)}
                >
                  <MdOutlineViewInAr size={30} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.Refresh}
                  onPress={async () => await response.refetch()}
                >
                  <FiRefreshCcw size={20} color="black" />
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
                    height={100}
                    width={100}
                    alt="Wadzzo"
                    src={"/assets/images/wadzzo.png"}
                    style={styles.pinImage}
                  />
                </Animated.View>
              </APIProvider>
            </>
          )
        )}
      </View>
    </MainLayout>
  );
};

const MyPins = ({ locations }: { locations: ConsumedLocation[] }) => {
  const { onOpen } = useModal();

  return (
    <>
      {locations.map((location: ConsumedLocation, index: number) => (
        <Marker
          key={index}
          onClick={() =>
            onOpen("LocationInformation", {
              Collection: location,
            })
          }
          icon={{
            url: location.image_url,
            scaledSize: {
              width: 30,
              height: 30,
              equals: () => true,
            },
          }}
          position={{
            lat: location.lat,
            lng: location.lng,
          }}
        />
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
    height: "100%",
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
