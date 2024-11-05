import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
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
import { IoIosInformationCircle } from "react-icons/io";
import { FaMapPin } from "react-icons/fa";
import { CiGift } from "react-icons/ci";

import { Color } from "app/utils/Colors";

interface LocationData {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  brand_name: string;
  image_url: string;
  collection_limit_remaining: number;
  brand_image_url: string;
}

const LocationInformationModal = () => {
  console.log("LocationInformationModal");
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "LocationInformation";

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
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
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
                  <IoIosInformationCircle
                    name="information-outline"
                    size={24}
                    color="#666"
                  />
                  <Paragraph style={styles.description}>
                    {locationData.description}
                  </Paragraph>
                </View>
                <View style={styles.infoContainer}>
                  <FaMapPin name="map-marker" size={24} color="#666" />
                  <Paragraph>
                    Latitude: {locationData.lat.toFixed(6)}, Longitude:{" "}
                    {locationData.lng.toFixed(6)}
                  </Paragraph>
                </View>
                <View style={styles.infoContainer}>
                  <FaMapPin name="tag-multiple" size={24} color="#666" />
                  <Paragraph>ID: {locationData.id}</Paragraph>
                </View>
                <View style={styles.infoContainer}>
                  <CiGift name="gift-outline" size={24} color="#666" />
                  <Paragraph>
                    Remaining: {locationData.collection_limit_remaining}
                  </Paragraph>
                </View>
              </ScrollView>
            </Card.Content>
            <Card.Actions>
              <Button
                mode="outlined"
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
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: Color.offWhite,

    padding: 8,

    alignSelf: "center",
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
});

export default LocationInformationModal;
