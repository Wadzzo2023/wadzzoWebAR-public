import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
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
  Paragraph,
  Title,
} from "react-native-paper";
import { FaRegTrashAlt } from "react-icons/fa";
import { MdOutlineViewInAr } from "react-icons/md";
import { IoEye } from "react-icons/io5";

import { useCollection } from "@/components/hooks/useCollection";
import { useModal } from "@/components/hooks/useModal";
import { useNearByPin } from "@/components/hooks/useNearbyPin";
import { ConsumedLocation } from "@app/types/CollectionTypes";
import { BASE_URL } from "@app/utils/Common";
import { Color } from "app/utils/all-colors";
import { useRouter } from "next/router";

import MainLayout from "../layout";
import { useAuth } from "@/components/provider/AuthProvider";

export default function MyCollectionScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const { onOpen } = useModal();
  const { setData } = useCollection();
  const { setData: setNearByPinData } = useNearByPin();
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
      console.log("Data", data);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await response.refetch();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated]);

  if (response.isLoading) {
    return (
      <MainLayout>
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
      </MainLayout>
    );
  }

  if (response.isError) {
    return (
      <MainLayout>
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
      </MainLayout>
    );
  }

  const locations = response.data?.locations ?? [];

  const onARPress = (item: ConsumedLocation) => {
    setNearByPinData({
      nearbyPins: item ? [item] : [],
      singleAR: true,
    });
    router.push("/ARScreen");
  };

  const renderCollectionItem = ({ item }: { item: ConsumedLocation }) => (
    <Card style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image_url }} style={styles.image} alt="" />
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
              <MdOutlineViewInAr name="cube-scan" size={15} color={"white"} />
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
              <FaRegTrashAlt name="trash-can" size={15} />
            </Text>
          </Button>
          <Button
            onPress={() => {
              setData({
                collections: item,
              });
              router.push(`/(tabs)/collection/${item.id}`);
            }}
            style={styles.smallButton}
            mode="outlined"
          >
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: 2,
              }}
            >
              <IoEye name="eye" size={15} />
              <Text
                style={{
                  fontSize: 12,
                }}
              >
                View
              </Text>
            </View>
          </Button>
        </View>
      </Card.Actions>
    </Card>
  );

  return (
    <MainLayout>
      <View style={styles.container}>
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
          {/* <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <Appbar.Action
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
              setSortBy("category");
              setSortMenuVisible(false);
            }}
            title="Sort by Category"
          />
        </Menu> */}
        </Appbar.Header>

        <FlatList
          data={locations}
          showsVerticalScrollIndicator={false}
          renderItem={renderCollectionItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={[styles.list, { paddingBottom: 80 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />

        {locations.length === 0 && (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text>No collections found</Text>
          </View>
        )}
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Dimensions.get("window").height,
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: 2,
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
    marginRight: 4,
  },
});
