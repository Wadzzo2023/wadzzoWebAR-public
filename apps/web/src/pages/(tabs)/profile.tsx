import { useState } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import {
  Avatar,
  Button,
  Card,
  Dialog,
  Divider,
  Portal,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";

import { useQuery } from "@tanstack/react-query";

import { SafeAreaView } from "react-native-safe-area-context";

import { useAccountAction } from "@/components/hooks/useAccountAction";
import LoadingScreen from "@/components/Loading";
import { Color } from "app/utils/all-colors";

import { useAuth } from "@/components/provider/AuthProvider";
import { getTokenUser } from "@api/routes/get-token-user";
import { addrShort } from "@app/utils/AddrShort";
import { Copy, GlobeLock, LogOut, Trash } from "lucide-react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import toast from "react-hot-toast";
import { BASE_URL } from "@app/utils/Common";
import MainLayout from "./layout";

export default function SettingScreen() {
  const theme = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { logout } = useAuth();

  const { data: pinMode, setData } = useAccountAction();
  const { data, isLoading, error } = useQuery({
    queryKey: ["currentUserInfo"],
    queryFn: getTokenUser,
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <Text>Error: {error.message}</Text>;

  const deleteData = async () => {
    try {
      const response = await fetch(
        new URL("api/game/user/delete-user", BASE_URL).toString(),
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        toast.error("Error deleting");
      }
      await response.json();
      toast.success("Data deleted successfully");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
    setShowDeleteDialog(false);
  };

  const togglePinCollectionMode = () => {
    setData({
      mode: !pinMode.mode,
    });
    console.log(
      `Pin Collection Mode set to: ${
        !pinMode.mode ? "Auto Collect" : "Manual Collect"
      }`
    );
  };

  if (data)
    return (
      <MainLayout>
        <SafeAreaView style={styles.container}>
          <ScrollView>
            <Card style={styles.profileCard}>
              <View style={styles.profileContent}>
                <Avatar.Image
                  size={80}
                  source={{
                    uri:
                      data.image ??
                      "https://app.wadzzo.com/images/icons/avatar-icon.png",
                  }}
                />
                <View style={styles.profileInfo}>
                  <Text style={styles.name}>{data.name}</Text>
                  <Text style={styles.email}>{data.email}</Text>
                  <CopyToClipboard
                    text={data.id}
                    onCopy={() => toast.success("Copied to clipboard")}
                  >
                    <View
                      style={{
                        flex: 1,
                        gap: 4,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text>{addrShort(data.id, 5)}</Text>
                      <Copy size={18} color={"black"} />
                    </View>
                  </CopyToClipboard>
                </View>
              </View>
            </Card>

            <Card style={styles.section}>
              <Card.Content>
                <Button
                  mode="contained"
                  style={[styles.button, { backgroundColor: Color.wadzzo }]}
                  onPress={() => Linking.openURL("https://wadzzo.com")}
                  icon={({ size, color }) => (
                    <GlobeLock name="web" size={size} color={color} />
                  )}
                >
                  Visit Wadzzo.com
                </Button>
              </Card.Content>
            </Card>

            <Card style={styles.section}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Account Actions</Text>

                <View style={styles.pinCollectionContainer}>
                  <View style={styles.pinCollectionTextContainer}>
                    <Text style={styles.pinCollectionTitle}>
                      Auto Collection
                    </Text>
                  </View>
                  <View style={styles.switchWrapper}>
                    <Text
                      style={[
                        styles.switchLabel,
                        !pinMode.mode && styles.activeSwitchLabel,
                      ]}
                    >
                      Off
                    </Text>
                    <Switch
                      value={pinMode.mode}
                      onValueChange={togglePinCollectionMode}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.switchLabel,
                        pinMode.mode && styles.activeSwitchLabel,
                      ]}
                    >
                      On
                    </Text>
                  </View>
                </View>

                <Divider style={styles.divider} />

                {/* <Button
                  mode="outlined"
                  onPress={resetTutorial}
                  style={styles.button}
                >
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      gap: 4,
                    }}
                  >
                    <Text>
                      <RefreshCcw size={18} />
                    </Text>
                    <Text>Reset Tutorial</Text>
                  </View>
                </Button> */}
                <Button
                  mode="outlined"
                  onPress={() => setShowDeleteDialog(true)}
                  style={styles.button}
                  textColor={theme.colors.error}
                >
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      gap: 4,
                    }}
                  >
                    <Text>
                      <Trash size={18} />
                    </Text>
                    <Text>Delete Data</Text>
                  </View>
                </Button>
                <Button
                  mode="contained"
                  onPress={async () => await logout()}
                  style={[styles.button, { backgroundColor: Color.wadzzo }]}
                >
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      gap: 4,
                    }}
                  >
                    <Text>
                      <LogOut size={18} />
                    </Text>
                    <Text>Logout</Text>
                  </View>
                </Button>
              </Card.Content>
            </Card>
          </ScrollView>

          <Portal>
            <Dialog
              visible={showDeleteDialog}
              onDismiss={() => setShowDeleteDialog(false)}
            >
              <Dialog.Title>Delete Data</Dialog.Title>
              <Dialog.Content>
                <Text>
                  Are you sure you want to delete all your data? This action
                  cannot be undone.
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button onPress={deleteData} textColor={theme.colors.error}>
                  Delete
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </SafeAreaView>
      </MainLayout>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    elevation: 4,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  copyIdButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  copyIdText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  section: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  pinCollectionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pinCollectionTextContainer: {
    flex: 1,
  },
  pinCollectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  pinCollectionDescription: {
    fontSize: 12,
    color: "#666",
  },
  switchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Color.white,
    borderRadius: 20,
    padding: 4,
  },
  switchLabel: {
    marginHorizontal: 8,
    fontSize: 12,
    color: "#666",
  },
  activeSwitchLabel: {
    fontWeight: "bold",
    color: "#000",
  },
  divider: {
    marginVertical: 16,
  },
  button: {
    marginBottom: 12,
  },
});
