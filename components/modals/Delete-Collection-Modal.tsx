import {
  Button,
  Dialog,
  Portal,
  Text,
  ActivityIndicator,
} from "react-native-paper";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useModal } from "../hooks/useModal";
import { BASE_URL } from "../utils/Common";

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

  return (
    <Portal>
      <Dialog visible={isModalOpen} onDismiss={handleClose}>
        <Dialog.Title>Delete Collection?</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.message}>
            Are you sure you want to delete this collection? This action cannot
            be undone.
          </Text>
          <View style={styles.collectionInfo}>
            <Text style={styles.collectionName}>
              {data?.collectionName || "Unnamed Collection"}
            </Text>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={handleClose}
            mode="outlined"
            style={styles.button}
            textColor="#757575"
          >
            Cancel
          </Button>
          <Button
            onPress={handleDelete}
            mode="contained"
            style={styles.button}
            buttonColor="#d32f2f"
            loading={isDeleting}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
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
    borderRadius: 8,
    marginRight: 10,
  },
});

export default DeleteCollectionModal;
