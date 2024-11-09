import { getCurrentUser } from "@api/routes/get-current-user";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
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

import { useAccountAction } from "@/components/hooks/useAccountAction";
import LoadingScreen from "@/components/Loading";
import { useAuth } from "@auth/Provider";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Color } from "app/utils/all-colors";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingScreen() {
  const theme = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { logout } = useAuth();

  const { data: pinMode, setData } = useAccountAction();
  const { data, isLoading, error } = useQuery({
    queryKey: ["currentUserInfo"],
    queryFn: getCurrentUser,
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <Text>Error: {error.message}</Text>;

  const copyPublicKey = async () => {
    await Clipboard.setStringAsync(data?.id);
    ToastAndroid.show("Public key copied to clipboard", ToastAndroid.SHORT);
  };

  const resetTutorial = () => {
    console.log("Resetting tutorial");
  };

  const deleteData = () => {
    console.log("Deleting data");
    setShowDeleteDialog(false);
  };

  const signOut = async () => {
    logout();
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

  return (
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
              <TouchableOpacity
                onPress={copyPublicKey}
                style={styles.copyIdButton}
              >
                <Feather name="copy" size={14} color={theme.colors.primary} />
                <Text style={styles.copyIdText}>Copy ID</Text>
              </TouchableOpacity>
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
                <MaterialCommunityIcons name="web" size={size} color={color} />
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
                <Text style={styles.pinCollectionTitle}>Auto Collection</Text>
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

            <Button
              mode="outlined"
              onPress={resetTutorial}
              style={styles.button}
              icon="refresh"
            >
              Reset Tutorial
            </Button>
            <Button
              mode="outlined"
              onPress={() => setShowDeleteDialog(true)}
              style={styles.button}
              icon="delete"
              textColor={theme.colors.error}
            >
              Delete Data
            </Button>
            <Button
              mode="contained"
              onPress={signOut}
              style={[styles.button, { backgroundColor: Color.wadzzo }]}
              icon="logout"
            >
              Sign Out
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
              Are you sure you want to delete all your data? This action cannot
              be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={deleteData} textColor={theme.colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
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
