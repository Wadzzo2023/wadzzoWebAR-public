import {
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  FAB,
  Text,
  useTheme,
  Portal,
  Dialog,
  Appbar,
  Menu,
} from "react-native-paper";
import { useModal } from "../hooks/useModal";
import { StyleSheet, ToastAndroid, View } from "react-native";

const NearbyPinModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "NearbyPin";

  const handleClose = () => {
    onClose();
  };

  return (
    <Portal>
      <Dialog visible={isModalOpen} onDismiss={handleClose}>
        <Dialog.Title>NearBy</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.message}>
            No Pin Available
          </Text>
        </Dialog.Content>

        <Dialog.Actions>
          <Button
            onPress={() => handleClose()}
            mode="contained"
            style={styles.button}
            buttonColor="#d32f2f"
            loading={false}
          >
            OK
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};
const styles = StyleSheet.create({
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
