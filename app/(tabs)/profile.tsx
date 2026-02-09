'use client';

import { useMutation, useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  findNodeHandle,
  Image,
  LayoutChangeEvent,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Keyboard,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Dialog,
  Portal,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";

import { Feather, MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import BottomSheet, { BottomSheetView, BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";

import { useRouter } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/components/lib/auth/Provider";
import { useWalkThrough } from "@/components/hooks/useWalkThrough";
import { useAccountAction } from "@/components/hooks/useAccountAction";
import { getUser } from "../api/routes/get-user";
import LoadingScreen from "@/components/Loading";
import { Color } from "@/components/utils/all-colors";
import { Walkthrough } from "@/components/walkthrough/WalkthroughProvider";
import { toast, ToastPosition } from "@backpackapp-io/react-native-toast";
import { deleteCurrentUser } from "../api/routes/delete-current-user";
import { updateProfileDetails } from "../api/routes/update-profile-details";
import { updateProfile } from "../api/routes/update-profile";
import { updateCover } from "../api/routes/update-cover";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BASE_URL } from "@/components/utils/Common";

type ButtonLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const COVER_HEIGHT = 250;
const PROFILE_SIZE = 100;

export default function SettingScreen() {
  const theme = useTheme();
  const inset = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { logout, isAuthenticated, setIsAuthenticated, setUser } = useAuth();
  const router = useRouter();
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [buttonLayouts, setButtonLayouts] = useState<ButtonLayout[]>([]);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPronouns, setEditPronouns] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [bioError, setBioError] = useState("");
  const scrollViewRef = useRef(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { data: walkthroughData, setData: setWalkThroughData } =
    useWalkThrough();
  const { data: pinMode, setData } = useAccountAction();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["currentUserInfo"],
    queryFn: getUser,
  });
  const [profileUploading, setProfileUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [imageTarget, setImageTarget] = useState<"profile" | "cover" | null>(null);

  const copyPublicKey = async () => {
    await Clipboard.setStringAsync(data?.id ?? "");
    toast("Public key copied!", {
      duration: 3000,
      position: ToastPosition.BOTTOM,
      styles: {
        view: { backgroundColor: Color.wadzzo, borderRadius: 8 },
      },
    });
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
      content: "Click here to log out of your wadzzo account.",
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
        "Enable Auto Collection to automatically collect eligible pins. All pins set for auto collection will be gathered when you're within collecting distance, but all manual pins must still be collected through AR mode.",
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
        "Press this button to delete your account. Your account will be permanently deleted.",
    },
  ];

  const pronounOptions = [
    "He/Him",
    "She/Her",
    "They/Them",
    "Prefer not to say",
    "Other",
  ];

  const resetTutorial = async () => {
    await AsyncStorage.setItem("isFirstSignIn", "true");
    setShowWalkthrough(true);
    setWalkThroughData({
      showWalkThrough: true,
    });
  };

  const DeleteMutation = useMutation({
    mutationFn: deleteCurrentUser,
  });

  const deleteData = async () => {
    try {
      await DeleteMutation.mutateAsync();
      setIsAuthenticated(false);
      setUser(null);
      await logout();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast("Failed to delete account. Please try again.", {
        duration: 3000,
        position: ToastPosition.TOP,
        styles: {
          view: { backgroundColor: "red", borderRadius: 8 },
        },
      });
    }
  };

  const signOut = async () => {
    setLoading(true);
    setUser(null);
    setIsAuthenticated(false);
    await logout();
    setLoading(false);
  };

  const togglePinCollectionMode = () => {
    setData({
      mode: !pinMode.mode,
    });
    console.log(
      `Pin Collection Mode set to: ${!pinMode.mode ? "Auto Collect" : "Manual Collect"
      }`
    );
  };

  const checkFirstTimeSignIn = async () => {
    if (walkthroughData.showWalkThrough) {
      setShowWalkthrough(true);
    } else {
      setShowWalkthrough(false);
    }
  };

  const handleChangeCoverImage = useCallback(() => {
    console.log("[v0] Opening image picker for cover");
    setImageTarget("cover");
    setTimeout(() => {
      setShowImageOptions(true);
    }, 100);
  }, []);

  const handleChangeProfileImage = useCallback(() => {
    console.log("[v0] Opening image picker for profile");
    setImageTarget("profile");
    setTimeout(() => {
      setShowImageOptions(true);
    }, 100);
  }, []);

  const handleImagePick = async (target: "profile" | "cover", source: "camera" | "gallery" = "gallery") => {
    try {
      // request permissions
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      const libraryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (source === "camera" && !cameraPerm.granted) {
        Alert.alert("Camera Permission Required", "You need to grant camera permission to take a photo.");
        return;
      }

      if (source === "gallery" && !libraryPerm.granted) {
        Alert.alert("Gallery Permission Required", "You need to grant photo library permission to select a photo.");
        return;
      }

      const result = await (source === "camera"
        ? ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: target === "profile" ? [1, 1] : [16, 9],
          quality: 1,
        })
        : ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: target === "profile" ? [1, 1] : [16, 9],
          quality: 1,
        })
      );

      if (result.canceled || !result.assets?.[0]) return;

      if (target === "profile") setProfileUploading(true);
      else setCoverUploading(true);

      const picked = result.assets[0];
      const imageUri = picked.uri;
      let fileExtension = imageUri.split(".").pop()?.toLowerCase();
      if (!fileExtension) fileExtension = "jpg";
      if (!["jpg", "jpeg", "png", "webp", "gif"].includes(fileExtension)) {
        Alert.alert("Invalid File Type", "Please select a JPG, PNG, WebP, or GIF image.");
        return;
      }

      // resize/compress
      const resizeOptions = target === "profile" ? { width: 400, height: 400 } : { width: 1200, height: 675 };
      const compressed = await ImageManipulator.manipulateAsync(imageUri, [{ resize: resizeOptions }], {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const contentType = `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`;
      const extractedFileName = `${Date.now()}.${fileExtension}`;
      const resp = await fetch(compressed.uri);
      const blob = await resp.blob();

      const signedUrlResp = await fetch(new URL("/api/game/get-signed-url", BASE_URL).toString(), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, fileName: extractedFileName }),
      });

      if (!signedUrlResp.ok) throw new Error("Failed to get signed URL");
      const { fileUrl, uploadUrl } = await signedUrlResp.json();

      const uploadResp = await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": contentType } });
      if (!uploadResp.ok) throw new Error("Upload failed");

      // auto-submit to server
      if (target === "profile") {
        await updateProfile({ name: data?.name ?? "", image: fileUrl });
        toast("Profile image uploaded.", { duration: 2500, position: ToastPosition.BOTTOM, styles: { view: { backgroundColor: Color.wadzzo, borderRadius: 8 } } });
      } else {
        await updateCover({ image: fileUrl });
        toast("Cover image uploaded.", { duration: 2500, position: ToastPosition.BOTTOM, styles: { view: { backgroundColor: Color.wadzzo, borderRadius: 8 } } });
      }

      refetch();
    } catch (e) {
      console.error("Image upload error:", e);
      toast("Failed to upload image. Please try again.", { duration: 3000, position: ToastPosition.TOP });
    } finally {
      setTimeout(() => {
        setProfileUploading(false);
        setCoverUploading(false);
        setShowImageOptions(false);
        setImageTarget(null);
        console.log("[v0] Image picker dialog closed and state reset");
      }, 300);
    }
  };

  const openEditSheet = () => {
    setEditName(data?.name || "");
    setEditBio(data?.bio || "");
    setEditPronouns(data?.pronouns || "");
    setNameError("");
    setBioError("");
    bottomSheetRef.current?.expand();
  };

  const closeEditSheet = () => {
    bottomSheetRef.current?.close();
  };

  const validateInputs = () => {
    let isValid = true;

    if (editName.trim().length < 3 || editName.trim().length > 99) {
      setNameError("Name must be between 3-99 characters");
      isValid = false;
    } else {
      setNameError("");
    }

    if (editBio.trim().length > 0 && (editBio.trim().length < 4 || editBio.trim().length > 200)) {
      setBioError("Bio must be between 4-200 characters or left empty");
      isValid = false;
    } else {
      setBioError("");
    }

    return isValid;
  };

  const handleSaveProfile = () => {
    if (!validateInputs()) return;
    setSaveLoading(true);
    updateProfileDetails({ name: editName, bio: editBio, pronouns: editPronouns })
      .then(() => {
        toast("Profile updated.", {
          duration: 2000,
          position: ToastPosition.BOTTOM,
          styles: { view: { backgroundColor: Color.wadzzo, borderRadius: 8 } },
        });
        refetch();
        closeEditSheet();
      })
      .catch((e) => {
        console.error("Failed to update profile details:", e);
        toast("Failed to save profile. Please try again.", { duration: 3000, position: ToastPosition.TOP });
      })
      .finally(() => setSaveLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/Login");
    } else {
      checkFirstTimeSignIn();
    }
  }, [isAuthenticated, walkthroughData]);

  useEffect(() => {
    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
      bottomSheetRef.current?.snapToIndex(0);
    });

    return () => {
      keyboardDidHide.remove();
    };
  }, []);

  if (isLoading) return <LoadingScreen />;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View style={styles.container} ref={scrollViewRef}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image Section */}
        <View style={styles.coverContainer} >
          <Image
            source={{
              uri: data?.coverImage ?? "https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
            }}
            style={styles.coverImage}
          />

          {/* Top Right Buttons - Sign Out and Edit */}
          <View style={[styles.topRightButtons, { top: inset.top }]} >
            <View onLayout={(event) => onButtonLayout(event, 0)}>
              <TouchableOpacity
                onPress={signOut}
                disabled={loading}
                style={styles.topButton}
              >
                <Feather name="log-out" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={openEditSheet}
              style={styles.topButton}
            >
              <Feather name="edit-2" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.topButton}
              onPress={handleChangeCoverImage}
            >
              <AntDesign name="camera" color="white" size={20} />
            </TouchableOpacity>


          </View>
        </View>

        {/* Profile Info Section */}
        <View style={styles.profileSection} >
          <View style={styles.profileRow}>
            {/* Profile Picture with Camera Icon */}
            <View style={styles.profilePicContainer}>
              <Image
                style={styles.profilePic}
                source={{
                  uri:
                    data?.image ??
                    "https://app.wadzzo.com/images/icons/avatar-icon.png",
                }}
              />
              <TouchableOpacity
                style={styles.profileCameraButton}
                onPress={handleChangeProfileImage}
              >
                <AntDesign name="camera" color="white" size={16} />
              </TouchableOpacity>
            </View>

            {/* Profile Details */}
            <View style={styles.profileDetails}>
              <View style={styles.nameRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.name}>{data?.name}</Text>
                    <View style={styles.verifiedBadge}>
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={14}
                        color={Color.wadzzo}
                      />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  </View>
                  {data?.email && (
                    <Text style={styles.emailText}>{data?.email}</Text>
                  )}
                </View>



              </View>



              <View style={styles.profileActionsRow}>
                <TouchableOpacity
                  onPress={copyPublicKey}
                  style={styles.copyButton}
                >
                  <Feather name="copy" size={14} color="white" />
                  <Text style={styles.copyButtonText}>Copy ID</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onLayout={(event) => onButtonLayout(event, 1)}
                  onPress={() => Linking.openURL("https://wadzzo.com")}
                  style={styles.wadzzoButton}
                >
                  <MaterialCommunityIcons name="link" size={14} color={Color.wadzzo} />
                  <Text style={styles.wadzzoButtonText}>Wadzzo</Text>
                </TouchableOpacity>

                <View style={styles.pinsCollectedBadge}>
                  <MaterialCommunityIcons
                    name="map-marker-multiple"
                    size={14}
                    color={Color.wadzzo}
                  />
                  <Text style={styles.pinsCollectedText}>
                    {data?.pinsCollected ?? 0}
                  </Text>
                </View>
              </View>

              {data?.bio && (
                <View style={styles.bioSection}>
                  <Text style={styles.bioText}>{data?.bio}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.accountActionsSection}>
          <Text style={styles.accountActionsTitle}>Account Settings</Text>

          {/* Auto Collection */}
          <View
            style={styles.actionCard}
            onLayout={(event) => onButtonLayout(event, 2)}
          >
            <View style={styles.actionCardLeft}>
              <View style={styles.actionIconContainer}>
                <MaterialCommunityIcons
                  name="robot-excited"
                  size={24}
                  color={Color.wadzzo}
                />
              </View>
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>Auto Collection</Text>
                <Text style={styles.actionCardDescription}>
                  Automatically collect nearby pins
                </Text>
              </View>
            </View>
            <View style={styles.actionCardRight}>
              <View style={styles.toggleSwitch}>
                <Switch
                  value={pinMode.mode}
                  onValueChange={togglePinCollectionMode}
                  color={Color.wadzzo}
                  style={styles.switchStyle}
                />
              </View>
            </View>
          </View>

          {/* Reset Tutorial */}
          <Button
            onLayout={(event) => onButtonLayout(event, 3)}
            mode="outlined"
            onPress={resetTutorial}
            style={styles.actionButton}
            icon={() => (
              <MaterialCommunityIcons
                name="refresh"
                size={20}
                color={Color.wadzzo}
              />
            )}
            labelStyle={styles.actionButtonLabel}
            contentStyle={styles.actionButtonContent}
          >
            Reset Tutorial
          </Button>

          {/* Delete Data */}
          <Button
            mode="outlined"
            onLayout={(event) => onButtonLayout(event, 4)}
            onPress={() => setShowDeleteDialog(true)}
            style={[styles.actionButton, styles.deleteButton]}
            icon={() => (
              <MaterialCommunityIcons
                name="delete-outline"
                size={20}
                color={theme.colors.error}
              />
            )}
            labelStyle={[styles.actionButtonLabel, { color: theme.colors.error }]}
            contentStyle={styles.actionButtonContent}
            disabled={loading || isLoading}
          >
            Delete Data
          </Button>
        </View>
      </ScrollView>

      <Portal >
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
          style={styles.dialogContainer}
        >
          <View style={styles.dialogHeader}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={28}
              color={theme.colors.error}
            />
            <Dialog.Title style={styles.dialogTitle}>Delete Account</Dialog.Title>
          </View>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Are you sure you want to delete all your data? This action is permanent and cannot be undone.
            </Text>
            <View style={styles.warningBox}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={Color.wadzzo}
              />
              <Text style={styles.warningText}>
                All your profile data, pins, and collections will be permanently deleted.
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            {!DeleteMutation.isPending && (
              <Button
                mode="outlined"
                onPress={() => setShowDeleteDialog(false)}
                style={styles.cancelButton}
                labelStyle={styles.cancelButtonLabel}
              >
                Cancel
              </Button>
            )}
            <Button
              mode="contained"
              disabled={loading || DeleteMutation.isPending}
              onPress={deleteData}
              buttonColor={theme.colors.error}
              style={styles.deleteActionButton}
              contentStyle={styles.deleteActionButtonContent}
            >
              {DeleteMutation.isPending ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator size={16} color="white" />
                  <Text style={styles.loadingText}>Deleting...</Text>
                </View>
              ) : (
                "Delete"
              )}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={showImageOptions}
          onDismiss={() => setShowImageOptions(false)}
          style={styles.dialogContainer}
        >
          <View style={styles.dialogHeader}>
            <MaterialCommunityIcons
              name="image-multiple"
              size={28}
              color={Color.wadzzo}
            />
            <Dialog.Title style={styles.dialogTitle}>
              {imageTarget === "profile" ? "Change Profile Picture" : "Change Cover Photo"}
            </Dialog.Title>
          </View>
          <Dialog.Content style={styles.imageDialogContent}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (imageTarget) {
                  setShowImageOptions(false);
                  handleImagePick(imageTarget, "camera");
                }
              }}
              style={styles.imageOptionButton}
            >
              <View style={styles.imageOptionIcon}>
                <MaterialCommunityIcons
                  name="camera"
                  size={24}
                  color="white"
                />
              </View>
              <View style={styles.imageOptionContent}>
                <Text style={styles.imageOptionTitle}>Take Photo</Text>
                <Text style={styles.imageOptionSubtitle}>
                  Use your camera to capture a new image
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#ccc"
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (imageTarget) {
                  setShowImageOptions(false);
                  handleImagePick(imageTarget, "gallery");
                }
              }}
              style={styles.imageOptionButton}
            >
              <View style={styles.imageOptionIcon}>
                <MaterialCommunityIcons
                  name="image"
                  size={24}
                  color="white"
                />
              </View>
              <View style={styles.imageOptionContent}>
                <Text style={styles.imageOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.imageOptionSubtitle}>
                  Select an image from your device
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#ccc"
              />
            </TouchableOpacity>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button
              mode="outlined"
              onPress={() => setShowImageOptions(false)}
              style={styles.cancelButton}
              labelStyle={styles.cancelButtonLabel}
            >
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["63%"]}
        enablePanDownToClose
        backgroundStyle={[styles.bottomSheet]}


      >
        <BottomSheetView style={[styles.bottomSheetContent]}>


          <BottomSheetScrollView
            style={styles.editForm}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Edit Profile</Text>
              <View style={styles.headerActions}>
                <Button
                  mode="contained"
                  onPress={handleSaveProfile}

                >
                  Save
                </Button>

              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name *</Text>
              <View style={[
                styles.textInputContainer,
                nameError ? styles.textInputError : null
              ]}>
                <BottomSheetTextInput

                  style={styles.textInput}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                  value={editName}
                  onChangeText={(text) => {
                    setEditName(text);
                    if (text.trim().length >= 3 && text.trim().length <= 99) {
                      setNameError("");
                    }
                  }}
                  maxLength={99}
                />
              </View>
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : (
                <Text style={styles.helperText}>3-99 characters required</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Pronouns</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {pronounOptions.map((p) => {
                  const selected = editPronouns === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setEditPronouns(p)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: selected ? Color.wadzzo : '#fff',
                        borderWidth: 1,
                        borderColor: selected ? Color.wadzzo : '#e8e8e8',
                        marginRight: 8,
                      }}
                    >
                      <Text style={{ color: selected ? '#fff' : '#333', fontWeight: '600' }}>{p}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Bio (Optional)</Text>
              <View style={[
                styles.textInputContainer,
                bioError ? styles.textInputError : null
              ]}>
                <BottomSheetTextInput
                  style={[styles.textInput, styles.bioInput]}
                  placeholder="Tell us about yourself"
                  placeholderTextColor="#999"
                  value={editBio}
                  onChangeText={(text) => {
                    setEditBio(text);
                    if (text.trim().length === 0 || (text.trim().length >= 4 && text.trim().length <= 200)) {
                      setBioError("");
                    }
                  }}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={200}
                />
              </View>
              {bioError ? (
                <Text style={styles.errorText}>{bioError}</Text>
              ) : (
                <Text style={styles.characterCount}>
                  {editBio.length}/200 characters {editBio.length > 0 && editBio.length < 4 ? "(min 4)" : ""}
                </Text>
              )}
            </View>

            {/* Extra padding for keyboard */}
            <View style={{ height: 100 }} />
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheet>

      {showWalkthrough && (
        <Walkthrough
          steps={steps}
          onFinish={() => setShowWalkthrough(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  coverContainer: {
    position: "relative",
    height: COVER_HEIGHT,
    width: "100%",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Color.wadzzo,
  },
  coverCameraButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "white",


  },
  topRightButtons: {
    position: "absolute",

    right: 12,
    flexDirection: "row",
    gap: 8,
  },
  topButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "white",
  },
  profileSection: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: "row",
    marginTop: -50,
    alignItems: "flex-start",
  },
  profilePicContainer: {
    position: "relative",
  },
  profilePic: {
    width: PROFILE_SIZE,
    height: PROFILE_SIZE,
    borderRadius: PROFILE_SIZE / 2,
    borderWidth: 4,
    borderColor: "white",
    backgroundColor: "#e0e0e0",
  },
  profileCameraButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 15,
    padding: 6,
    borderWidth: 2,
    borderColor: "white",
  },
  profileDetails: {
    flex: 1,
    marginLeft: 12,
    paddingTop: 8,
    marginTop: 54,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff9f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "600",
    color: Color.wadzzo,
  },
  profileActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Color.wadzzo,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: Color.wadzzo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  copyButtonText: {
    fontSize: 12,
    color: "white",
    fontWeight: "700",
  },
  wadzzoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff9f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Color.wadzzo,
    gap: 6,
  },
  wadzzoButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: Color.wadzzo,
  },
  pinsCollectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff9f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Color.wadzzo,
    gap: 6,
  },
  pinsCollectedText: {
    fontSize: 13,
    fontWeight: "700",
    color: Color.wadzzo,
  },
  bioSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  bioText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 6,
  },
  emailText: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  accountActionsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    marginBottom: 16,
  },
  accountActionsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  actionCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff9f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#ffe6d5",
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  actionCardDescription: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  actionCardRight: {
    marginLeft: 8,
  },
  toggleSwitch: {
    justifyContent: "center",
  },
  switchStyle: {
    marginVertical: 0,
  },
  actionButton: {
    borderRadius: 10,
    borderColor: "#e8e8e8",
    marginBottom: 10,
    borderWidth: 1.5,
    backgroundColor: "white",
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Color.wadzzo,
  },
  actionButtonContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  deleteButton: {
    borderColor: "#ffebee",
    backgroundColor: "#fff5f5",
  },
  bottomSheet: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 24,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  bottomSheetContent: {
    flex: 1,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",


    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  bottomSheetTitle: {

    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 0.3,
  },
  editForm: {
    flex: 1,
    paddingHorizontal: 20,


  },
  formGroup: {
    marginTop: 8,
    marginBottom: 24,
  },
  formLabel: {

    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  textInputContainer: {
    borderWidth: 2,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    backgroundColor: "white",
    overflow: "hidden",
  },
  textInputError: {
    borderColor: "#ff4444",
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
    fontWeight: "500",
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 12,
    color: "#ff4444",
    marginTop: 6,
    fontWeight: "600",
  },
  saveButton: {
    borderRadius: 12,
    backgroundColor: Color.wadzzo,
    marginTop: 8,
  },
  saveButtonContent: {
    paddingVertical: 12,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compactSaveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  compactSaveButtonContent: {

  },
  compactSaveButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  closeButton: {
    marginLeft: 8,
    padding: 6,
  },
  dialogContainer: {
    borderRadius: 24,
    marginHorizontal: 16,
    elevation: 16,
    shadowColor: "rgb(0, 0, 0)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(56, 192, 43, 0.08)",
  },
  dialogHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "rgb(26, 28, 26)",
    flex: 1,
    letterSpacing: -0.3,
  },
  dialogText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 21,
    marginBottom: 12,
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "#fff9f0",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: "#ffe6d5",
  },
  warningText: {
    fontSize: 13,
    color: Color.wadzzo,
    lineHeight: 19,
    flex: 1,
    fontWeight: "500",
  },
  dialogActions: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(56, 192, 43, 0.1)",
  },
  cancelButton: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgb(223, 228, 218)",
    backgroundColor: "rgb(252, 253, 246)",
    flex: 1,
    elevation: 2,
    shadowColor: "rgb(0, 0, 0)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cancelButtonLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgb(67, 72, 65)",
    letterSpacing: 0.3,
  },
  deleteActionButton: {
    borderRadius: 10,
    flex: 1,
  },
  deleteActionButtonContent: {
    paddingVertical: 6,
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  loadingText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  imageDialogContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
  },
  imageOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(56, 192, 43, 0.04)",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginBottom: 0,
    gap: 16,
    borderWidth: 2,
    borderColor: "rgba(56, 192, 43, 0.15)",
    overflow: "hidden",
    justifyContent: "space-between",
  },
  imageOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Color.wadzzo,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: Color.wadzzo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  imageOptionContent: {
    flex: 1,
    paddingLeft: 8,
  },
  imageOptionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgb(26, 28, 26)",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  imageOptionSubtitle: {
    fontSize: 13,
    color: "rgb(115, 121, 112)",
    lineHeight: 18,
    fontWeight: "400",
  },
  dialogButton: {
    marginBottom: 8,
    borderRadius: 10,
  },
});
