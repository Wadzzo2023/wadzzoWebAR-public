import React, { useEffect, useState } from "react";
import { Alert, Image, Keyboard, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ActivityIndicator, Button, Dialog, Portal, Text, TextInput } from "react-native-paper";
import { BASE_URL } from "@/components/utils/Common";
import { Color } from "@/components/utils/all-colors";
import { useAuth } from "@/components/lib/auth/Provider";
import { toast, ToastPosition } from "@backpackapp-io/react-native-toast";
import Svg, { Circle } from 'react-native-svg';
import { MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";
import * as ImageManipulator from 'expo-image-manipulator';

const size = 150;
const strokeWidth = 2;
const center = size / 2;
const radius = size / 2 - strokeWidth / 2;
const circumference = 2 * Math.PI * radius;

const OnBoarding = () => {
    const { user, isAuthenticated } = useAuth();
    const [username, setUsername] = useState(user?.name);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [error, setError] = useState({ username: "", avatar: "" });
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showImageOptions, setShowImageOptions] = useState(false);

    const router = useRouter();

    const validateForm = () => {
        let isValid = true;
        const newError = { username: "", avatar: "" };

        if (!username?.trim()) {
            newError.username = "Username cannot be empty.";
            isValid = false;
        }

        if (!avatarUrl) {
            newError.avatar = "You must upload an avatar.";
            isValid = false;
        }

        if (avatarUrl && !avatarUrl.startsWith("https://wadzzo.s3.amazonaws.com")) {
            newError.avatar = "You must upload an avatar.";
            isValid = false;
        }

        setError(newError);
        return isValid;
    };


    const handleImagePick = async (source: 'camera' | 'gallery') => {
        try {
            setShowImageOptions(false);
            const permissions = await Promise.all([
                ImagePicker.requestCameraPermissionsAsync(),
                ImagePicker.requestMediaLibraryPermissionsAsync()
            ]);

            const [cameraPermission, libraryPermission] = permissions;

            if (source === 'camera' && !cameraPermission.granted) {
                Alert.alert(
                    "Camera Permission Required",
                    "You need to grant camera permission to take a photo.",
                    [{ text: "OK" }]
                );
                return;
            }

            if (source === 'gallery' && !libraryPermission.granted) {
                Alert.alert(
                    "Gallery Permission Required",
                    "You need to grant photo library permission to select a photo.",
                    [{ text: "OK" }]
                );
                return;
            }

            const result = await (source === 'camera'
                ? ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 1, // Set to 1 as we'll compress later
                })
                : ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 1, // Set to 1 as we'll compress later
                })
            );

            if (result.canceled || !result.assets?.[0]) return;

            setLoading(true);

            // Show preview immediately
            setAvatarUrl(result.assets[0].uri);
            const imageUri = result.assets[0].uri;

            const fileExtension = imageUri.split(".").pop()?.toLowerCase();

            if (!["jpg", "jpeg", "png", "webp", "gif"].includes(fileExtension || "")) {
                Alert.alert("Invalid File Type", "Please select a JPG, JPEG, PNG, WebP, or GIF image.");
                return;
            }
            // Compress and resize image
            const compressedImage = await ImageManipulator.manipulateAsync(
                result.assets[0].uri,
                [
                    { resize: { width: 200, height: 200 } } // Resize to max width of 800px
                ],
                {
                    compress: 0.5, // 50% quality
                    format: ImageManipulator.SaveFormat.JPEG
                }
            );


            const contentType = `image/${fileExtension}`; // Get file name

            // Get file name
            const extractedFileName = `${Date.now()}.${fileExtension}`;

            // Create blob from compressed image
            const response = await fetch(compressedImage.uri);
            const imageBlob = await response.blob();


            const signedUrlResponse = await fetch(
                new URL("/api/game/get-signed-url", BASE_URL).toString(),
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contentType, fileName: extractedFileName }),
                }
            );

            if (!signedUrlResponse.ok) throw new Error("Failed to get signed URL");

            const { fileUrl, uploadUrl } = await signedUrlResponse.json();

            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: imageBlob,
                headers: { "Content-Type": contentType }
            });

            if (!uploadResponse.ok) throw new Error("Upload failed");

            // Update with server URL after successful upload
            setAvatarUrl(fileUrl);
            setError((prev) => ({ ...prev, avatar: "" }));

        } catch (error) {
            console.error("Error during image pick/upload:", error);
            toast.error("Failed to upload image. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!validateForm()) return;
        setSaveLoading(true);
        console.log("Username:", username);
        console.log("Avatar URL:", avatarUrl);
        const response = await fetch(
            new URL("api/game/user/update-profile", BASE_URL).toString(),
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: username,
                    image: avatarUrl,
                }),
            }
        );
        if (response.ok) {
            queryClient.refetchQueries({
                queryKey: ["currentUserInfo"],
            });
            toast("Profile updated successfully.", {
                duration: 3000,
                position: ToastPosition.TOP,
                styles: {
                    view: { backgroundColor: Color.wadzzo, borderRadius: 8 },
                },
            });
            router.replace("/(tabs)/");
            setSaveLoading(false);
        } else {
            Alert.alert("Error", "Failed to save profile. Please try again.");
            setSaveLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user?.image) {
            router.replace("/(tabs)/");
        }
    }, [isAuthenticated, user?.image]);




    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <LinearGradient
                colors={['#f0f4f8', '#38C02B']}
                style={styles.container}
            >
                <View style={styles.card}>
                    <Text style={styles.title}>Complete Your Profile</Text>

                    <View style={styles.avatarContainer}>
                        <TouchableOpacity onPress={() => setShowImageOptions(true)}>
                            <Image
                                source={
                                    avatarUrl
                                        ? { uri: avatarUrl }
                                        : require("../../assets/images/avatar-icon.png")
                                }
                                style={styles.avatar}
                            />
                            {
                                loading && (
                                    <ActivityIndicator
                                        size="large"
                                        color={Color.wadzzo}
                                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                                    />
                                )
                            }
                            {/* {progress > 0 && progress < 100 && (
                                <View style={styles.progressOverlay}>
                                    <Svg width={size} height={size}>
                                        <Circle
                                            stroke="rgb(56, 192, 43)"
                                            fill="none"
                                            cx={center}
                                            cy={center}
                                            r={radius}
                                            strokeWidth={strokeWidth}
                                            strokeDasharray={circumference}
                                            strokeDashoffset={circumference - (progress / 100) * circumference}
                                        />
                                    </Svg>
                                    <Text style={styles.progressText}>{`${Math.round(progress)}%`}</Text>
                                </View>
                            )} */}
                        </TouchableOpacity>
                        {avatarUrl ? (
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => setAvatarUrl("")}
                            >
                                <MaterialCommunityIcons name="delete" size={24} color="white" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => setShowImageOptions(true)}
                            >
                                <AntDesign name="camera" size={24} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                    {error.avatar && <Text style={styles.errorText}>{error.avatar}</Text>}

                    <View style={styles.inputContainer}>
                        <TextInput
                            defaultValue={user?.name ?? ""}
                            style={styles.input}
                            placeholder="Enter username"
                            value={username ?? ""}
                            onChangeText={(text) => {
                                setUsername(text);
                                if (text.trim()) setError((prev) => ({ ...prev, username: "" }));
                            }}
                        />
                        {error.username && <Text style={styles.errorText}>{error.username}</Text>}
                    </View>

                    <TouchableOpacity
                        disabled={saveLoading}
                        style={styles.saveButton}
                        onPress={handleSaveProfile}
                    >
                        {saveLoading ? (
                            <ActivityIndicator color="white" size={24} />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Profile</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Portal>
                    <Dialog visible={showImageOptions} onDismiss={() => setShowImageOptions(false)}>
                        <Dialog.Title>Choose an option</Dialog.Title>
                        <Dialog.Content>
                            <Button
                                icon="camera"
                                mode="outlined"
                                onPress={() => handleImagePick('camera')}
                                style={styles.dialogButton}
                            >
                                Take Photo
                            </Button>
                            <Button
                                icon="image"
                                mode="outlined"
                                onPress={() => handleImagePick('gallery')}
                                style={styles.dialogButton}
                            >
                                Choose from Gallery
                            </Button>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setShowImageOptions(false)}>Cancel</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </LinearGradient>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#2d3748',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 30,
    },
    avatar: {
        width: 150,
        height: 150,
        borderRadius: 75,
    },
    progressOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        position: 'absolute',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    iconButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4CAF50',
        borderRadius: 20,
        padding: 8,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 30,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#e2e8f0',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: '#f7fafc',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        width: '100%',
    },
    saveButtonText: {
        textAlign: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    errorText: {
        color: '#e53e3e',
        fontSize: 14,
        marginTop: 5,
    },
    dialogButton: {
        marginBottom: 10,
    },
});

export default OnBoarding;

