import { Button, Text, Portal, Dialog, Modal, Card } from "react-native-paper";
import { useModal } from "../hooks/useModal";
import { StyleSheet, ToastAndroid, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { JoinBounty } from "@api/routes/join-bounty";
import { useRouter } from "next/router";
import { Color } from "@app/utils/Colors";

const JoinBountyModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "JoinBounty";
  const router = useRouter();

  const queryClient = useQueryClient();
  const handleClose = () => {
    onClose();
  };

  const JoinMutation = useMutation({
    mutationFn: async ({ bountyId }: { bountyId: string }) => {
      return await JoinBounty({ bountyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bounties"],
      });

      router.push(`/bounty/${data.bounty?.id}`);
    },
    onError: () => {
      ToastAndroid.show("Failed to join bounty", ToastAndroid.SHORT);
    },
  });

  const handleJoin = (bountyId: string) => {
    JoinMutation.mutate({ bountyId });
  };
  const { bounty, balance } = data;
  if (!balance || !bounty) {
    return (
      <Portal>
        <Modal visible={isModalOpen} onDismiss={handleClose}>
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
        </Modal>
      </Portal>
    );
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
                Do you want to join this bounty? This action cannot be undone.
              </Text>
              <View style={styles.collectionInfo}>
                <Text style={styles.collectionName}>{bounty?.title}</Text>
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
export default JoinBountyModal;
