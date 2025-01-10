import { StyleSheet, View, FlatList, ViewToken } from "react-native";
import React, { useState, useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedRef,
} from "react-native-reanimated";

import LottieView from "lottie-react-native"; // Import Lottie
import { useRouter } from "expo-router";
import data, { OnboardingData } from "../components/data";
import { useAuth } from "../components/lib/auth/Provider";
import RenderItem from "../components/RenderItem";
import Pagination from "../components/Pagination";
import CustomButton from "../components/CustomButton";
import LoadingScreen from "@/components/Loading";
import LoadingForAuthenticationScreen from "@/components/LoadingForAuthentication";

const OnboardingScreen = () => {
  const flatListRef = useAnimatedRef<FlatList<OnboardingData>>();
  const x = useSharedValue(0);
  const flatListIndex = useSharedValue(0);
  const [playAnimation, setPlayAnimation] = useState(false);
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();

  const onViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: ViewToken[];
  }) => {
    if (viewableItems[0]?.index !== null) {
      flatListIndex.value = viewableItems[0].index;
      // Trigger animation when item changes
      setPlayAnimation(true);
      // Set a timeout to stop the animation after a short delay
      setTimeout(() => setPlayAnimation(false), 1500); // Play animation for 1.5 seconds
    }
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      x.value = event.contentOffset.x;
    },
  });

  useEffect(() => {
    console.log("User, isAuthenticated", user, isAuthenticated);
    if (isAuthenticated && user?.image) {
      router.replace("/(tabs)/");
    }
    else if (isAuthenticated && !user?.image) {
      router.replace("/onboardprofile/");
    }
  }, [isAuthenticated, user?.image]);

  if (loading) {
    return <LoadingForAuthenticationScreen />;
  }
  return (
    <View style={[styles.container]}>
      <Animated.FlatList
        ref={flatListRef}
        onScroll={onScroll}
        data={data}
        renderItem={({ item, index }) => {
          return <RenderItem item={item} index={index} x={x} />;
        }}
        keyExtractor={(item) => item.id.toString()}
        scrollEventThrottle={16}
        horizontal={true}
        bounces={false}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          minimumViewTime: 300,
          viewAreaCoveragePercentThreshold: 10,
        }}
      />
      <View style={styles.bottomContainer}>
        <Pagination data={data} x={x} />
        <CustomButton
          flatListRef={flatListRef}
          flatListIndex={flatListIndex}
          dataLength={data.length}
          x={x}
        />
      </View>

      {/* Lottie animations in the bottom corners */}
      {playAnimation && (
        <>
          <LottieView
            source={require("../assets/animation/winning.json")} // Add your Lottie file
            autoPlay
            loop={false}
            style={styles.lottieLeft}
          />
          <LottieView
            source={require("../assets/animation/winning.json")} // Add your Lottie file
            autoPlay
            loop={false}
            style={styles.lottieRight}
          />
        </>
      )}
    </View>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 30,
    paddingVertical: 30,
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
  },
  lottieLeft: {
    position: "absolute",
    bottom: 120,
    left: 10,
    width: 200,
    height: 200,
  },
  lottieRight: {
    position: "absolute",
    bottom: 120,
    right: 10,
    width: 200,
    height: 200,
  },
});




