import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
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
import parse from "html-react-parser";

import { UploadSubmission } from "@api/routes/upload-submission";
import { SubmissionMediaInfoType } from "@app/types/SubmissionTypes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useBounty } from "@/components/hooks/useBounty";
import { storage } from "@auth/web/webfirebaseconfig";
import ProgressBar from "@/components/ProgressBar";
import { Bounty } from "@app/types/BountyTypes";
import { addrShort } from "@app/utils/AddrShort";
import { Color } from "app/utils/all-colors";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import MainLayout from "../layout";

import { IoArrowBack } from "react-icons/io5";

interface UploadProgress {
  [fileName: string]: number;
}
type FileItem =
  | File
  | { name: string; size: number; type: string; downloadableURL?: string };

const SingleBountyItem = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("information");
  const [solution, setSolution] = useState("");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [media, setMedia] = useState<SubmissionMediaInfoType[]>([]);
  const [uploadFiles, setUploadFiles] = useState<FileItem[]>([]);
  const queryClient = useQueryClient();
  const { data } = useBounty();

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
      toast.success("Solution submitted successfully");
      setMedia([]);
      setSolution("");
      setUploadFiles([]);
      setUploadProgress({});
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
    },
    onError: (error) => {
      console.error("Error following bounty:", error);
    },
  });
  if (!bounty) return null;

  const handleSubmitSolution = () => {
    createBountyAttachmentMutation.mutate({
      content: solution,
      bountyId: bounty.id ?? 0,
      media: media,
    });
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setUploadFiles((prevFiles) => [...prevFiles, ...fileArray]);
      await uploadDocuments(fileArray);
    }
  };

  const uploadDocuments = async (files: File[]) => {
    try {
      files.forEach(async (file) => {
        const response = await fetch(URL.createObjectURL(file));
        const blob = await response.blob();
        const fileName = file.name;

        // Check if the file already exists to avoid re-uploading
        if (
          uploadFiles.some((existingFile) => existingFile.name === fileName)
        ) {
          return;
        }

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
          },
          (error) => {
            console.error("Upload error:", error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            setUploadFiles((prevFiles) => {
              return prevFiles.map((prevFile) =>
                prevFile.name === fileName
                  ? {
                      name: fileName,
                      size: file.size,
                      type: file.type,
                      downloadableURL: downloadURL,
                    }
                  : {
                      name: prevFile.name,
                      size: prevFile.size,
                      type: prevFile.type,
                    }
              );
            });

            // Add file info to media state
            addMediaItem(downloadURL, file.name, file.size, file.type);
          }
        );
      });
    } catch (error) {
      console.log("error", error);
    }
  };
  console.log("uploadFiles", uploadFiles);
  return (
    <MainLayout>
      <View style={styles.container}>
        <Appbar.Header style={styles.appbar}>
          <Button onPress={() => router.back()}>
            <IoArrowBack color="white" size={25} />
          </Button>
          <Appbar.Content
            titleStyle={{
              color: "white",
              textAlign: "center",
              fontWeight: "bold",
            }}
            title={bounty.title}
          />
        </Appbar.Header>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Card.Cover
            source={{
              uri:
                bounty.imageUrls[0] ??
                "https://app.wadzzo.com/images/loading.png",
            }}
            style={styles.image}
          />
          <View style={styles.content}>
            <Card style={styles.card}>
              <Card.Content style={{}}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: "black",
                  }}
                >
                  Bounty Information *
                </Text>
              </Card.Content>
            </Card>
            {uploadFiles.length > 0 && (
              <Card style={styles.card}>
                <Card.Content>
                  <Title style={styles.uploadedFilesTitle}>
                    Uploaded Files
                  </Title>
                  {uploadFiles.map((file, index) => {
                    console.log("file", file);
                    console.log("xdUploadedfile", uploadFiles);
                    return (
                      <View key={index} style={styles.fileItem}>
                        <Text style={styles.fileName}>{file.name}</Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <ProgressBar
                            progress={uploadProgress[file.name] ?? 0}
                          />
                          <Text>{uploadProgress[file.name]?.toFixed(1)}%</Text>
                        </View>
                      </View>
                    );
                  })}
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

            {activeTab === "submission" && bounty.winnerId === null ? (
              <>
                <Card style={styles.card}>
                  <Card.Content>
                    <TextInput
                      label="Your Solution (**Required**)"
                      value={solution}
                      onChangeText={setSolution}
                      multiline
                      numberOfLines={6}
                      style={styles.solutionInput}
                    />
                    <View style={{ alignItems: "flex-start" }}>
                      <input type="file" multiple onChange={handleFileChange} />
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
              </>
            ) : activeTab === "submission" && bounty.winnerId ? (
              <Card style={styles.card}>
                <Card.Content>
                  {bounty.winnerId && (
                    <Text style={styles.winnerText}>
                      Winner: {addrShort(bounty.winnerId, 15)}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            ) : (
              <>
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.detailsContainer}>
                      <Chip
                        style={[
                          styles.statusChip,
                          { backgroundColor: getStatusColor(bounty.status) },
                        ]}
                      >
                        {bounty.status}
                      </Chip>
                      <Text style={styles.prizeText}>
                        Prize: {bounty.priceInUSD.toFixed(2)}$
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
                <Card style={styles.card}>
                  <Card.Title title="Description" />
                  <Card.Content>
                    <Text
                      style={{
                        color: "black",
                      }}
                    >
                      {
                        parse(bounty.description) // Parse HTML content
                      }
                    </Text>
                  </Card.Content>
                </Card>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </MainLayout>
  );
};

// Styles and helper functions remain unchanged

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
  detailsContainer: {
    flex: 1,
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 8,
  },
  image: {
    height: 200,
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
    color: "black",
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: "column",
    color: "black",
    paddingVertical: 8,
    borderBottomColor: "#e0e0e0",
  },
  fileName: {
    flex: 1,
    color: "black",
    fontSize: 14,
  },
});
export default SingleBountyItem;
