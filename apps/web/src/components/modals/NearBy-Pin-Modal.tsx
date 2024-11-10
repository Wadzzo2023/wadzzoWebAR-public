import { Button, Text, Portal, Modal, Card } from "react-native-paper";
import { useModal } from "../hooks/useModal";
import { StyleSheet, View } from "react-native";
import { Color } from "app/utils/all-colors";

const NearbyPinModal = () => {
  const { isOpen, onClose, type } = useModal();
  const isModalOpen = isOpen && type === "NearbyPin";

  const handleClose = () => {
    onClose();
  };

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
            <Card.Content>
              <Text
                style={{
                  color: "black",
                }}
              >
                No Nearby Pins Available!
              </Text>
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
  message: {
    marginBottom: 10,
    fontSize: 16,
  },
  collectionInfo: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  collectionName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
  button: {
    flex: 1,
    borderRadius: 8,
    marginRight: 10,
  },
});
export default NearbyPinModal;
