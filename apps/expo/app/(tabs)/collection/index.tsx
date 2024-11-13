import { useQuery } from "@tanstack/react-query";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  findNodeHandle,
  FlatList,
  Image,
  LayoutChangeEvent,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Appbar,
  Badge,
  Button,
  Card,
  Menu,
  Paragraph,
  Title,
} from "react-native-paper";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useCollection } from "@/components/hooks/useCollection";
import { useModal } from "@/components/hooks/useModal";
import { useNearByPin } from "@/components/hooks/useNearbyPin";
import { ConsumedLocation } from "@app/types/CollectionTypes";
import { BASE_URL } from "@app/utils/Common";
import { Color } from "app/utils/all-colors";
import { useRouter } from "expo-router";
import { Walkthrough } from "@/components/walkthrough/WalkthroughProvider";
import { useWalkThrough } from "@/components/hooks/useWalkThrough";
import { useAuth } from "@auth/Provider";
type ButtonLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export default function MyCollectionScreen() {
  const [sortBy, setSortBy] = useState("title");
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const [buttonLayouts, setButtonLayouts] = useState<ButtonLayout[]>([]);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const { onOpen } = useModal();
  const { data: walkthroughData } = useWalkThrough();
  const { user, isAuthenticated } = useAuth();

  const { setData } = useCollection();
  const { setData: setNearByPinData } = useNearByPin();
  const steps = [
    {
      target: buttonLayouts[0],
      title: "Filter Collection",
      content: "User can filter Collection between Title and Remaining Limit",
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
  const getCollections = async () => {
    try {
      const response = await fetch(
        new URL(
          "api/game/locations/get_consumed_location",
          BASE_URL
        ).toString(),
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch collections");
      }

      const data = await response.json();

      return data; // Make sure this matches the actual response structure
    } catch (error) {
      console.error("Error fetching collections:", error);
      throw error;
    }
  };

  const response = useQuery({
    queryKey: ["collection"],
    queryFn: getCollections,
  });
  const onARPress = (item: ConsumedLocation) => {
    setNearByPinData({
      nearbyPins: item ? [item] : [],
      singleAR: true,
    });
    router.push("/ARScreen");
  };
  const checkFirstTimeSignIn = async () => {
    console.log(showWalkthrough);
    if (walkthroughData.showWalkThrough) {
      setShowWalkthrough(true);
    } else {
      setShowWalkthrough(false);
    }
  };
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/Login");
    } else {
      checkFirstTimeSignIn(); // Check if it's the first sign-in
    }
  }, [isAuthenticated, walkthroughData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await response.refetch();
    setRefreshing(false);
  };
  const sortLocations = (locations: ConsumedLocation[]) => {
    return [...locations].sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "remaining") {
        return b.collection_limit_remaining - a.collection_limit_remaining;
      }
      return 0;
    });
  };
  const sortedLocations = useMemo(
    () => sortLocations(response.data?.locations ?? []),
    [response.data?.locations, sortBy]
  );
  if (response.isLoading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="My Collection" />
        </Appbar.Header>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" />
          <Text>Loading collections...</Text>
        </View>
      </View>
    );
  }

  if (response.isError) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="My Collection" />
        </Appbar.Header>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Error fetching collections</Text>
        </View>
      </View>
    );
  }

  const renderCollectionItem = ({ item }: { item: ConsumedLocation }) => (
    <Card style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image_url }} style={styles.image} />
        <Badge style={styles.badge}>{item.collection_limit_remaining}</Badge>
      </View>
      <Card.Content>
        <Title>{item.title}</Title>
        <Paragraph numberOfLines={2} ellipsizeMode="tail">
          {item.description}
        </Paragraph>
        <Paragraph style={styles.coordinates}>
          Lat: {item.lat.toFixed(4)}, Lng: {item.lng.toFixed(4)}
        </Paragraph>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <View style={styles.leftButtons}>
          <Button
            onPress={() => onARPress(item)}
            style={[
              styles.smallButton,
              {
                backgroundColor: Color.wadzzo,
              },
            ]}
            mode="outlined"
          >
            <Text>
              <MaterialCommunityIcons
                name="cube-scan"
                size={15}
                color={"white"}
              />
            </Text>
          </Button>
          <Button
            onPress={() =>
              onOpen("Delete", {
                collectionId: item.id,
                collectionName: item.title,
              })
            }
            style={styles.deleteButton}
            mode="outlined"
          >
            <Text>
              <MaterialCommunityIcons name="trash-can" size={15} />
            </Text>
          </Button>
        </View>
        <Button
          onPress={() => {
            setData({
              collections: item,
            });
            router.push("/collection/:id");
          }}
          style={styles.smallButton}
          mode="outlined"
        >
          <Text>
            <MaterialCommunityIcons name="eye" size={15} /> View
          </Text>
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container} ref={scrollViewRef}>
      <Appbar.Header
        style={{
          backgroundColor: Color.wadzzo,
          borderBottomRightRadius: 8,
          borderBottomLeftRadius: 8,
        }}
      >
        <Appbar.Content
          title="My Collection"
          titleStyle={{
            fontSize: 20,
            color: "white",
            fontWeight: "bold",
            textAlign: "center",
          }}
        />
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <Appbar.Action
              onLayout={(event) => onButtonLayout(event, 0)}
              icon="sort"
              iconColor="white"
              onPress={() => setSortMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setSortBy("title");
              setSortMenuVisible(false);
            }}
            title="Sort by Title"
          />
          <Menu.Item
            onPress={() => {
              setSortBy("remaining");
              setSortMenuVisible(false);
            }}
            title="Sort by Limit Remaining"
          />
        </Menu>
      </Appbar.Header>

      <FlatList
        data={sortedLocations}
        showsVerticalScrollIndicator={false}
        renderItem={renderCollectionItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={[styles.list, { paddingBottom: 80 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {sortedLocations.length === 0 && (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>No collections found</Text>
        </View>
      )}
      {showWalkthrough && (
        <Walkthrough steps={steps} onFinish={() => setShowWalkthrough(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 8,
  },
  list: {},
  card: {
    margin: 6,
    elevation: 4,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: Color.wadzzo,
  },
  coordinates: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  actions: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
  },
  leftButtons: {
    flexDirection: "row",
    flex: 1,
    borderRadius: 0,
    marginRight: 8,
  },
  smallButton: {
    flex: 1,
    marginRight: 4,
    borderRadius: 8,
  },
  deleteButton: {
    flex: 1,
    borderRadius: 8,
  },
});
