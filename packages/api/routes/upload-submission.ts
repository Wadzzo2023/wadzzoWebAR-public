
import { BASE_URL } from "@/constants/Common";
import { SubmissionMediaInfoType } from "../(tabs)/bounty/[id]";

export const UploadSubmission = async ({ bountyId, content, media }: { bountyId: string, content: string, media?: SubmissionMediaInfoType[] }) => {
    try {
        console.log("Media", media)
        console.log("DD", JSON.stringify({
            bountyId: bountyId.toString(),
            content: content,
            media: media,
        }))
        const response = await fetch(
            new URL("api/game/bounty/submission/create-submission", BASE_URL).toString(),
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    bountyId: bountyId.toString(),
                    content: content,
                    media: media,
                }),
            }
        );

        if (!response.ok) {
            throw new Error("Failed to submit this submission ");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error failed to submit this submission:", error);
        throw error;
    }
};
