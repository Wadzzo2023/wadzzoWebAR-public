import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  findNodeHandle,
  LayoutChangeEvent,
  Linking,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Appbar,
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
import { useRouter } from "expo-router";
import * as MailComposer from "expo-mail-composer";
import { Walkthrough } from "@/components/walkthrough/WalkthroughProvider";
import AsyncStorage from "@react-native-async-storage/async-storage"; // import AsyncStorage
import { useWalkThrough } from "@/components/hooks/useWalkThrough";
import { getUser } from "@api/routes/get-user";

type ButtonLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function SettingScreen() {
  const theme = useTheme();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [buttonLayouts, setButtonLayouts] = useState<ButtonLayout[]>([]);
  const scrollViewRef = useRef(null);
  const { data: walkthroughData, setData: setWalkThroughData } =
    useWalkThrough();
  const { data: pinMode, setData } = useAccountAction();
  const { data, isLoading, error } = useQuery({
    queryKey: ["currentUserInfo"],
    queryFn: getUser,
  });

  const copyPublicKey = async () => {
    await Clipboard.setStringAsync(data?.id ?? "");
    ToastAndroid.show("Public key copied to clipboard", ToastAndroid.SHORT);
  };
  const onButtonLayout = useCallback(
    (event: LayoutChangeEvent, index: number) => {
      if (scrollViewRef.current) {
        const scrollViewHandle = findNodeHandle(scrollViewRef.current);
        if (scrollViewHandle) {
          event.target.measureLayout(
            scrollViewHandle,
            (x, y, width, height) => {
              setButtonLayouts((prevLayouts) => {
                const newLayouts = [...prevLayouts];
                newLayouts[index] = { x, y, width, height };
                return newLayouts;
              });
            },
            () => console.error("Failed to measure layout")
          );
        }
      }
    },
    []
  );

  const steps = [
    {
      target: buttonLayouts[0],
      title: "Sign Out",
      content: "Click here to log out of your account.",
    },
    {
      target: buttonLayouts[1],
      title: "Visit Wadzzo.com",
      content: "Click here to visit our website and explore our services.",
    },
    {
      target: buttonLayouts[2],
      title: "Auto Collection",
      content:
        "Enable Auto Collection to automatically collect pins. Disable it to stop auto collection of pins.",
    },
    {
      target: buttonLayouts[3],
      title: "Reset Tutorial",
      content: "Click here to restart the tutorial and view it again.",
    },
    {
      target: buttonLayouts[4],
      title: "Delete Data",
      content:
        "Confirm to delete your account. A request will be sent to our support team to manually process the deletion.",
    },
  ];

  const resetTutorial = async () => {
    console.log("Resetting tutorial");
    await AsyncStorage.setItem("isFirstSignIn", "true");
    setShowWalkthrough(true);
    setWalkThroughData({
      showWalkThrough: true,
    });
  };

  const deleteData = async () => {
    console.log("Deleting data");
    setShowDeleteDialog(false);
    const userInfo = `
User ID: ${data?.id}
Name: ${data?.name}
Email: ${data?.email}
  `;

    const options = {
      recipients: ["support@wadzzo.com"],
      subject: "User Data Deletion Request",
      body: `Hello Support,\n\nThe following user has requested data deletion:\n\n${userInfo}\n\nBest regards,\nYour App Team`,
    };

    try {
      const result = await MailComposer.composeAsync(options);
      if (result.status === "sent") {
        console.log("Support email sent successfully");
      } else {
        console.log("Support email not sent");
      }
    } catch (error) {
      console.error("Failed to send email", error);
    }
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
  const checkFirstTimeSignIn = async () => {
    console.log(showWalkthrough);
    if (walkthroughData.showWalkThrough) {
      setShowWalkthrough(true);
    } else {
      setShowWalkthrough(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/Login");
    } else {
      checkFirstTimeSignIn();
    }
  }, [isAuthenticated, walkthroughData]);

  if (isLoading) return <LoadingScreen />;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View style={styles.container} ref={scrollViewRef}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          titleStyle={{
            color: "white",
          }}
          title="Profile"
          style={styles.title}
        />
        <View
          onLayout={(event) => onButtonLayout(event, 0)}
          style={{
            flexDirection: "column",
            alignItems: "center",
            padding: 10,
            justifyContent: "flex-start",
          }}
        >
          <TouchableOpacity onPress={signOut}>
            <Feather name="log-out" size={20} color="white" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 10,
              padding: 0,
              margin: 0,
              color: "white",
            }}
          >
            Signout
          </Text>
        </View>
      </Appbar.Header>
      <Card style={styles.profileCard}>
        <View style={styles.profileContent}>
          <Avatar.Image
            size={80}
            source={{
              uri:
                data?.image ??
                "https://app.wadzzo.com/images/icons/avatar-icon.png",
            }}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{data?.name}</Text>
            <Text style={styles.email}>{data?.email}</Text>

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
            onLayout={(event) => onButtonLayout(event, 1)}
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

          <View
            style={styles.pinCollectionContainer}
            onLayout={(event) => onButtonLayout(event, 2)}
          >
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
            onLayout={(event) => onButtonLayout(event, 3)}
            mode="outlined"
            onPress={resetTutorial}
            style={styles.button}
            icon="refresh"
          >
            Reset Tutorial
          </Button>

          <Button
            mode="outlined"
            onLayout={(event) => onButtonLayout(event, 4)}
            onPress={() => setShowDeleteDialog(true)}
            style={styles.button}
            icon="delete"
            textColor={theme.colors.error}
          >
            <Text> Delete Data</Text>
          </Button>

          {/* <Button
            mode="contained"
            onLayout={(event) => onButtonLayout(event, 4)}
            onPress={signOut}
            style={[styles.button, { backgroundColor: Color.wadzzo }]}
            icon="logout"
          >
            Sign Out
          </Button> */}
        </Card.Content>
      </Card>

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

      {showWalkthrough && (
        <Walkthrough steps={steps} onFinish={() => setShowWalkthrough(false)} />
      )}
    </View>
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
  header: {
    backgroundColor: Color.wadzzo,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  title: {
    alignItems: "center",
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
