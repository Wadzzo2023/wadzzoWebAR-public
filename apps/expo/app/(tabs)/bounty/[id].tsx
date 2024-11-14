import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Card,
  Chip,
  SegmentedButtons,
  Text,
  TextInput,
  Title,
} from "react-native-paper";

import { UploadSubmission } from "@api/routes/upload-submission";
import { SubmissionMediaInfoType } from "@app/types/SubmissionTypes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

import { useRouter } from "expo-router";

import { useBounty } from "@/components/hooks/useBounty";
import { storage } from "@/components/lib/firebase/config";
import ProgressBar from "@/components/ProgressBar";
import { Bounty } from "@app/types/BountyTypes";
import { addrShort } from "@app/utils/AddrShort";
import { Color } from "app/utils/all-colors";
import RenderHTML from "react-native-render-html";

interface DocumentPickerAsset extends DocumentPicker.DocumentPickerAsset {
  downloadableURI?: string;
}

interface UploadProgress {
  [fileName: string]: number;
}
const SingleBountyItem = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("information");
  const [solution, setSolution] = useState("");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({}); // Use the defined type
  const [media, setMedia] = useState<SubmissionMediaInfoType[]>([]);
  const [uploadFiles, setUploadFiles] = useState<DocumentPickerAsset[]>([]);
  const queryClient = useQueryClient();
  const { data } = useBounty();
  if (!data.item) return null;
  const { item: bounty } = data;
  const addMediaItem = (
    url: string,
    name: string,
    size?: number,
    type?: string
  ) => {
    if (size && type) {
      setMedia((prevMedia) => [...prevMedia, { url, name, size, type }]);
    }
  };

  const createBountyAttachmentMutation = useMutation({
    mutationFn: async ({
      bountyId,
      content,
      media,
    }: {
      bountyId: string;
      content: string;
      media?: SubmissionMediaInfoType[];
    }) => {
      return await UploadSubmission({ bountyId, content, media });
    },
    onSuccess: () => {
      ToastAndroid.show("Submission created successfully", ToastAndroid.SHORT);
      setMedia([]);
      setSolution("");
      setUploadFiles([]);
      setUploadProgress({});
      queryClient.invalidateQueries({
        queryKey: ["bounties"],
      });
    },
    onError: (error) => {
      console.error("Error following bounty:", error);
    },
  });

  const handleSubmitSolution = () => {
    createBountyAttachmentMutation.mutate({
      content: solution,
      bountyId: bounty.id ?? 0,
      media: media,
    });
  };
  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: [
        "image/*",
        "video/*",
        "audio/*", // All audio types
        "application/vnd.google-apps.document", // Google Docs
        "application/vnd.google-apps.spreadsheet", // Google Sheets
        "text/plain", // Plain text
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
        "application/vnd.ms-excel", // XLS (old Excel format)
        "text/csv", // CSV
        "text/tab-separated-values", // TSV
        "application/pdf", // PDF
        "application/vnd.oasis.opendocument.spreadsheet", // ODS (OpenDocument Spreadsheet)
      ],
      multiple: true,
    });

    if (!result.canceled) {
      setUploadFiles((prevFiles) => [...prevFiles, ...result.assets]);
      await uploadDocuments(result.assets);
    }
  };

  const uploadDocuments = async (files: DocumentPickerAsset[]) => {
    try {
      files.forEach(async (file) => {
        const { uri, name } = file;
        const response = await fetch(uri);
        const blob = await response.blob();

        const fileName = file.name.substring(file.name.lastIndexOf("/") + 1);

        if (
          uploadFiles.some((existingFile) => existingFile.name === file.name)
        ) {
          return; // Skip this file
        }
        console.log("uploading file", fileName);
        const storageRef = ref(
          storage,
          `wadzzo/bounty/${bounty.id}/${fileName}/${new Date().getTime()}`
        );
        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

            setUploadProgress((prevProgress) => ({
              ...prevProgress,
              [fileName]: progress,
            }));
            switch (snapshot.state) {
              case "paused":
                console.log("Upload is paused");
                break;
              case "running":
                console.log("Upload is running");
                break;
            }
          },
          (error) => {
            console.log("error", error.message);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              console.log("downlaodblelink", downloadURL);
              setUploadFiles((prevFiles) =>
                prevFiles.map((f) =>
                  f.name === file.name
                    ? { ...f, downloadableURI: downloadURL }
                    : f
                )
              );
              addMediaItem(downloadURL, fileName, file.size, file.mimeType);
            });
          }
        );
      }, []);
    } catch (error) {
      console.log("error", error);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction iconColor="white" onPress={() => router.back()} />
        <Appbar.Content
          titleStyle={{
            color: "white",
            textAlign: "center",
            fontWeight: "bold",
          }}
          title={
            bounty.title.length > 30
              ? bounty.title.slice(0, 30) + "..."
              : bounty.title
          }
        />
      </Appbar.Header>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{
            uri:
              bounty.imageUrls[0] ??
              "https://app.wadzzo.com/images/loading.png",
          }}
          style={styles.image}
        />
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.headerContainer}>
                <Title style={styles.title}>{bounty.title}</Title>
                <Chip
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor(bounty.status) },
                  ]}
                >
                  {bounty.status}
                </Chip>
              </View>
              <View style={styles.prizeContainer}>
                <Text style={styles.prizeText}>
                  Prize : {bounty.priceInUSD.toFixed(2)}$
                </Text>
                <Text style={styles.prizeText}>
                  Prize : {bounty.priceInBand.toFixed(2)} Wadzzo
                </Text>
              </View>
              <Text style={styles.participantsText}>
                Participants: {bounty._count.participants}
              </Text>
            </Card.Content>
          </Card>
          {uploadFiles.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.uploadedFilesTitle}>Uploaded Files</Title>
                {uploadFiles.map((file, index) => (
                  <View key={index} style={styles.fileItem}>
                    <Text style={styles.fileName}>{file.name}</Text>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <ProgressBar progress={uploadProgress[file.name] || 0} />
                      <Text>
                        {(uploadProgress[file.name] || 0).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}
          <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            buttons={[
              { value: "information", label: "Information" },
              { value: "submission", label: "Submission" },
            ]}
            style={styles.segmentedButtons}
          />

          {activeTab === "information" ? (
            <Card style={styles.card}>
              <Card.Content>
                <Title>Description</Title>
                <RenderHTML
                  contentWidth={Dimensions.get("window").width}
                  source={{
                    html: bounty.description,
                  }}
                />
              </Card.Content>
            </Card>
          ) : bounty.winnerId === null ? (
            <Card style={styles.card}>
              <Card.Content>
                <Title>Submit Your Solution</Title>
                <TextInput
                  label="Your Solution (**Required**)"
                  value={solution}
                  onChangeText={setSolution}
                  multiline
                  numberOfLines={6}
                  style={styles.solutionInput}
                />
                <View
                  style={{
                    alignContent: "center",
                    backgroundColor: Color.wadzzo,
                    borderRadius: 16,
                  }}
                >
                  <View>
                    <TouchableOpacity>
                      <Button textColor="black" onPress={pickDocument}>
                        Upload Files
                      </Button>
                    </TouchableOpacity>
                  </View>
                </View>
                <Button
                  mode="contained"
                  onPress={handleSubmitSolution}
                  disabled={
                    solution.length === 0 ||
                    createBountyAttachmentMutation.isPending
                  }
                  style={styles.submitButton}
                >
                  Submit Solution
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.winnerText}>
                  Winner: {addrShort(bounty.winnerId, 15)}
                </Title>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
const getStatusColor = (status: Bounty["status"]) => {
  switch (status) {
    case "APPROVED":
      return "#4CAF50";
    case "PENDING":
      return "#FFC107";
    case "REJECTED":
      return "#F44336";
    default:
      return "#9E9E9E";
  }
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingBottom: 80,
  },
  appbar: {
    elevation: 8,
    backgroundColor: Color.wadzzo,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  image: {
    width: Dimensions.get("window").width,
    height: 200,
    resizeMode: "cover",
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginRight: 8,
    fontWeight: "bold",
  },
  statusChip: {
    alignSelf: "flex-start",
  },
  prizeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  winnerText: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    color: "#4CAF50",
  },
  prizeText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  participantsText: {
    fontSize: 14,
    marginBottom: 4,
  },
  deadlineText: {
    fontSize: 14,
    color: "red",
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  requirementsTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bulletPoint: {
    marginRight: 8,
    fontSize: 16,
  },
  requirementText: {
    flex: 1,
  },
  solutionInput: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  uploadedFilesTitle: {
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: "column",
    paddingVertical: 8,
    borderBottomColor: "#e0e0e0",
  },
  fileName: {
    flex: 1,
    fontSize: 14,
  },
});
export default SingleBountyItem;
