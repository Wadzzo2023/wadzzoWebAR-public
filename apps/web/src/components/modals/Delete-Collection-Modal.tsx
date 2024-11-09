import { Button, Card, Modal, Portal, Text } from "react-native-paper";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { BASE_URL } from "app/utils/Common";
import { useModal } from "../hooks/useModal";
import { Color } from "@app/utils/Colors";

const DeleteCollectionModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "Delete";
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const handleClose = () => {
    onClose();
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      setIsDeleting(true);
      const response = await fetch(
        new URL("api/game/locations/hide_billboard", BASE_URL).toString(),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ location_id: data?.collectionId?.toString() }),
        }
      );

      if (!response.ok) {
        setIsDeleting(false);
        throw new Error("Failed to delete collection");
      }

      const result = await response.json();

      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["collection"],
      });
      setIsDeleting(false);
      onClose();
    },
    onError: (error) => {
      setIsDeleting(false);
      console.error("Error deleting collection:", error);
    },
  });

  const handleDelete = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  if (!data.collectionId) {
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
            <Card.Title title="Join Bounty?" />
            <Card.Content>
              <Text variant="bodyMedium" style={styles.message}>
                Do you want to delete this collection? This action cannot be
                undone.
              </Text>
              <View style={styles.collectionInfo}>
                <Text style={styles.collectionName}>{data.bounty?.title}</Text>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button
                onPress={handleClose}
                mode="outlined"
                style={styles.button}
                textColor="#757575"
              >
                Cancel
              </Button>

              <Button
                onPress={() => handleDelete()}
                mode="contained"
                style={styles.button}
                buttonColor="#d32f2f"
                loading={false}
                disabled={deleteMutation.isPending || isDeleting}
              >
                Delete
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
    padding: 8,
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

export default DeleteCollectionModal;
