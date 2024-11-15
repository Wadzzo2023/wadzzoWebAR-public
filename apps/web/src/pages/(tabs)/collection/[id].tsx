import React, { useEffect } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
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
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { LuExternalLink } from "react-icons/lu";
import { FaMapPin, FaHashtag } from "react-icons/fa";

import { useCollection } from "@/components/hooks/useCollection";
import { useNearByPin } from "@/components/hooks/useNearbyPin";

import { Color } from "app/utils/all-colors";
import { BASE_URL } from "app/utils/Common";

import { useModal } from "@/components/hooks/useModal";
import { MdOutlineViewInAr } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";
import { useRouter } from "next/router";
import MainLayout from "../layout";
import { useAuth } from "@/components/provider/AuthProvider";

const SingleCollectionItem = () => {
  const { data } = useCollection();
  const { setData } = useNearByPin();
  const { onOpen } = useModal();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated]);
  if (!data.collections) return null;

  return (
    <MainLayout>
      <View style={styles.container}>
        <Appbar.Header style={styles.appbar}>
          <Button onPress={() => router.back()}>
            <IoArrowBack color="white" size={25} />
          </Button>
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
                <Chip style={styles.chip}>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      gap: 2,
                    }}
                  >
                    <FaMapPin size={20} />
                    {data.collections.lat.toFixed(4)},
                    {data.collections.lng.toFixed(4)}
                  </View>
                </Chip>
                <Chip style={styles.chip}>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      gap: 2,
                    }}
                  >
                    <FaHashtag size={20} />
                    ID: {data.collections.id}
                  </View>
                </Chip>
              </View>
              <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}>
                <Map
                  minZoom={4}
                  defaultZoom={10}
                  onZoomChanged={(zoom) => console.log("Zoom changed", zoom)}
                  defaultCenter={{
                    lat: data.collections.lat,
                    lng: data.collections.lng,
                  }}
                  mapId={"bf51eea910020fa25a"}
                  gestureHandling={"greedy"}
                  style={styles.map}
                  zoomControl={false}
                >
                  {/* <MyPins location={data.collections} /> */}

                  <Marker
                    onClick={() =>
                      onOpen("LocationInformation", {
                        Collection: data.collections,
                      })
                    }
                    icon={{
                      url: data.collections.image_url,
                      scaledSize: {
                        width: 20,
                        height: 20,
                        equals: () => true,
                      },
                    }}
                    position={{
                      lat: data.collections.lat,
                      lng: data.collections.lng,
                    }}
                  />
                </Map>
              </APIProvider>

              <View style={styles.linkContainer}>
                <Button
                  style={styles.button}
                  mode="outlined"
                  onPress={() =>
                    Linking.openURL(
                      data?.collections?.url ?? "www.app.wadzoo.com"
                    )
                  }
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      justifyContent: "center",
                    }}
                  >
                    <LuExternalLink size={20} />
                    Visit Website
                  </View>
                </Button>

                <Button
                  style={styles.button}
                  mode="outlined"
                  onPress={() => {
                    setData({
                      nearbyPins: data.collections ? [data.collections] : [],
                      singleAR: true,
                    });
                    //   router.push("/ARScreen");
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      justifyContent: "center",
                    }}
                  >
                    <MdOutlineViewInAr size={20} />
                    View in AR
                  </View>
                </Button>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>

        <FAB
          style={styles.fab}
          icon="hand-coin"
          color="white"
          onPress={() =>
            Linking.openURL(new URL("maps/pins/my", BASE_URL).href)
          }
          label={"Claim"}
        />
      </View>
    </MainLayout>
  );
};

export default SingleCollectionItem;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
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
    justifyContent: "space-between",
    marginBottom: 50,
  },
  button: {
    borderRadius: 8,
  },
  fab: {
    position: "absolute",
    right: 8,
    bottom: 120,
    backgroundColor: Color.wadzzo,
  },
});
