import React from "react";
import { View, StyleSheet, ScrollView, Text, Linking } from "react-native";
import { useModal } from "../hooks/useModal";
import {
  Portal,
  Modal,
  Button,
  Card,
  Title,
  Paragraph,
  Avatar,
  Divider,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Color } from "../utils/all-colors";
import { router } from "expo-router";
import { DirectionDataType, useDirectionStore } from "../store/direction-store";
import { LocationAddressDisplay } from "../LocationAddressDisplay";

interface LocationData {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  brand_name: string;
  image_url: string;
  url: string;
  collection_limit_remaining: number;
  brand_image_url: string;
}

const LocationInformationModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "LocationInformation";
  const { setData: setDirectionData } = useDirectionStore();
  const handleClose = () => {
    onClose();
  };


  const locationData = data.Collection as LocationData;



  if (!isModalOpen || !locationData) {
    return null;
  }

  return (
    <Portal>
      <Modal
        visible={isModalOpen}
        onDismiss={handleClose}
        contentContainerStyle={styles.modalContainer}
      >
        <Card>
          <Card.Cover source={{ uri: locationData.image_url }} />
          <Card.Content>
            <View style={styles.headerContainer}>
              <Avatar.Image
                size={50}
                source={{ uri: locationData.brand_image_url }}
              />
              <View style={styles.headerText}>
                <Title>{locationData.title}</Title>
                <Paragraph>{locationData.brand_name}</Paragraph>
              </View>
            </View>
            <Divider style={styles.divider} />
            <ScrollView style={styles.scrollView}>
              <View style={styles.infoContainer}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={24}
                  color="#666"
                />
                <Paragraph style={styles.description}>
                  {locationData.description}
                </Paragraph>
              </View>
              <View style={styles.infoContainer}>
                <MaterialCommunityIcons
                  name="tag-multiple"
                  size={24}
                  color="#666"
                />
                <Paragraph style={styles.urlText} onPress={() =>
                  Linking.openURL(
                    locationData.url
                  )
                }>{locationData.url.length > 40 ? `${locationData.url.substring(0, 40)}...` : locationData.url}
                </Paragraph>

              </View>
              <View style={styles.infoContainer}>
                <MaterialCommunityIcons
                  name="pin"
                  size={24}
                  color="#666"
                />
                <Paragraph style={styles.description}>
                  {locationData.lat.toFixed(3)} (Lat), {locationData.lng.toFixed(3)} (Lng)
                </Paragraph>

              </View>
              <View style={styles.infoContainer}>
                <MaterialCommunityIcons
                  name="map"
                  size={24}
                  color="#666"
                />
                <LocationAddressDisplay
                  latitude={locationData.lat}
                  longitude={locationData.lng}
                />


              </View>
              <View style={styles.infoContainer}>
                <MaterialCommunityIcons
                  name="gift-outline"
                  size={24}
                  color="#666"
                />
                <Paragraph>
                  Remaining: {locationData.collection_limit_remaining}
                </Paragraph>
              </View>
            </ScrollView>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="elevated"
              onPress={
                () => {
                  setDirectionData((prevData?: DirectionDataType) => ({
                    currentLocation: prevData?.currentLocation, // Preserve current location
                    destinationLocation: {
                      latitude: locationData.lat,
                      longitude: locationData.lng,
                    },
                  }));
                  onClose();
                  router.push("/direction")
                }
              }
              style={{
                flex: 1,
                backgroundColor: "red",

                borderRadius: 8,

              }}
            >
              <Text style={{
                color: "white",
                fontSize: 16,
                fontWeight: "bold"
              }}>
                Get Directions</Text>
            </Button>
            <Button
              mode="elevated"
              onPress={handleClose}
              style={{
                flex: 1,
                backgroundColor: "#f5f5f5",
                borderRadius: 8,
              }}
            >
              Close
            </Button>
            {/* <Button
              mode="contained"
              onPress={() => console.log("Claim pressed")}
            >
              Claim
            </Button> */}
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: Color.offWhite,
    padding: 8,
    margin: 8,
    borderRadius: 10,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  divider: {
    marginVertical: 10,
  },
  scrollView: {
    maxHeight: 200,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  description: {
    flex: 1,
    marginLeft: 10,
  },
  urlText: {
    flex: 1,
    marginLeft: 4,
    color: "#007AFF", // iOS blue link color
    textDecorationLine: "underline",
    fontSize: 14,
  },
});

export default LocationInformationModal;
