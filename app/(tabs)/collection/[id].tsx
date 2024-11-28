import React from "react";
import { Image, Linking, Platform, ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Avatar,
  Button,
  Card,
  Chip,
  FAB,
  Paragraph,
  Title,
} from "react-native-paper";

import Mapbox, { Camera, MapView, MarkerView } from "@rnmapbox/maps";

import { useRouter } from "expo-router";
import { useCollection } from "@/components/hooks/useCollection";
import { useNearByPin } from "@/components/hooks/useNearbyPin";
import { BASE_URL } from "@/components/utils/Common";
import { Color } from "@/components/utils/all-colors";
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API!);

const SingleCollectionItem = () => {
  const { data } = useCollection();
  const { setData } = useNearByPin();
  const router = useRouter();
  if (!data.collections) return null;

  return (
    <View style={styles.container} >
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction color="white" onPress={() => router.back()} />
        <Appbar.Content
          title={data.collections.title}
          titleStyle={styles.appbarTitle}
        />
      </Appbar.Header>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <Card elevation={5} style={styles.card}>
          <Card.Cover
            source={{ uri: data.collections.image_url }}
            style={styles.image}
          />
          <View style={styles.brandContainer}>
            <Avatar.Image
              size={50}
              source={{ uri: data.collections.brand_image_url }}
            />
            <Title style={styles.brandName}>
              {data.collections.brand_name}
            </Title>
          </View>
          <Card.Content>
            <Title style={styles.title}>{data.collections.title}</Title>
            <Paragraph style={styles.description}>
              {data.collections.description}
            </Paragraph>

            <View style={styles.chipContainer}>
              <Chip icon="map-marker" style={styles.chip}>
                {data.collections.lat.toFixed(4)},{" "}
                {data.collections.lng.toFixed(4)}
              </Chip>
              <Chip icon="tag" style={styles.chip}>
                ID: {data.collections.id}
              </Chip>
            </View>

            <MapView
              logoEnabled={false}
              attributionEnabled={false}
              style={styles.map}
            >
              <Camera
                zoomLevel={15}
                animationMode="none"
                centerCoordinate={[data.collections.lng, data.collections.lat]}
              />
              <MarkerView
                coordinate={[data.collections.lng, data.collections.lat]}
              >
                <Image
                  source={{ uri: data.collections.image_url }}
                  style={{ width: 30, height: 30 }}
                />
              </MarkerView>
            </MapView>

            <View style={styles.linkContainer}>
              <Button
                style={styles.button}
                icon="link"
                mode="outlined"
                onPress={() =>
                  Linking.openURL(
                    data?.collections?.url ?? "www.app.wadzoo.com"
                  )
                }
              >
                Visit
              </Button>
              <Button
                style={styles.button}
                icon="hand-coin"
                mode="outlined"
                onPress={() => Linking.openURL(new URL("maps/pins/my", BASE_URL).href)}
              >
                Claim
              </Button>
              <Button
                style={styles.button}
                icon="cube-scan"
                mode="outlined"
                onPress={() => {
                  setData({
                    nearbyPins: data.collections ? [data.collections] : [],
                    singleAR: true,
                  });
                  router.push("/ARScreen");
                }}
              >
                AR
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* <FAB
        style={styles.fab}
        icon="hand-coin"
        color="white"
        onPress={() => Linking.openURL(new URL("maps/pins/my", BASE_URL).href)}
        label={"Claim"}
      /> */}
    </View>
  );
};

export default SingleCollectionItem;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingBottom: Platform.OS === "ios" ? 35 : 25,
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
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 6,
    backgroundColor: "#ffffff",
  },
  image: {
    height: 300,
  },
  brandContainer: {
    margin: 1,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  brandName: {
    marginLeft: 16,
    fontSize: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
  },
  description: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  map: {
    height: 200,
    marginBottom: 16,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 50,
  },
  button: {
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  fab: {
    position: "absolute",
    right: 8,
    bottom: 120,
    backgroundColor: Color.wadzzo,
  },
});
