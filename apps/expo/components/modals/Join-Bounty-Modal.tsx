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
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useState } from "react";
import { JoinBounty } from "@api/routes/join-bounty";
import { useRouter } from "expo-router";

const JoinBountyModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "JoinBounty";
  const router = useRouter();
  const [joinBountyId, setJoinBountyId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const handleClose = () => {
    onClose();
  };

  const JoinMutation = useMutation({
    mutationFn: async ({ bountyId }: { bountyId: string }) => {
      setJoinBountyId(bountyId);
      return await JoinBounty({ bountyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bounties"],
      });
      setJoinBountyId(null);
      router.push(`/bounty/${data.bounty?.id}`);
    },
    onError: (error) => {
      ToastAndroid.show("Failed to join bounty", ToastAndroid.SHORT);
      setJoinBountyId(null);
    },
  });

  const handleJoin = (bountyId: string) => {
    setJoinBountyId(bountyId);
    JoinMutation.mutate({ bountyId });
  };
  const { bounty, balance } = data;
  if (!balance || !bounty) {
    return (
      <Portal>
        <Dialog visible={isModalOpen} onDismiss={handleClose}>
          <Dialog.Title>Join Bounty?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.message}>
              Do you want to join this bounty? This action cannot be undone.
            </Text>
            <View style={styles.collectionInfo}>
              <Text style={styles.collectionName}>{bounty?.title}</Text>
            </View>
          </Dialog.Content>

          <Text style={{ color: "red", textAlign: "center", padding: 2 }}>
            You do not have enough balance to join this bounty.
          </Text>

          <Dialog.Actions>
            <Button
              onPress={handleClose}
              mode="outlined"
              style={styles.button}
              textColor="#757575"
            >
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }
  return (
    <Portal>
      <Dialog visible={isModalOpen} onDismiss={handleClose}>
        <Dialog.Title>Join Bounty?</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.message}>
            Do you want to join this bounty? This action cannot be undone.
          </Text>
          <View style={styles.collectionInfo}>
            <Text style={styles.collectionName}>{bounty?.title}</Text>
          </View>
        </Dialog.Content>
        {bounty.requiredBalance > balance && (
          <Text style={{ color: "red", textAlign: "center", padding: 2 }}>
            You do not have enough balance to join this bounty.
          </Text>
        )}
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
            onPress={() => handleJoin(bounty.id)}
            mode="contained"
            style={styles.button}
            buttonColor="#d32f2f"
            loading={false}
            disabled={
              bounty.requiredBalance > balance || JoinMutation.isPending
            }
          >
            Join
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
export default JoinBountyModal;
