import { BASE_URL } from "@/components/utils/Common";

export const getQRItem = async ({ id }: { id: string }) => {
    try {
        const response = await fetch(
            new URL("api/game/qr/get-qr-by-id", BASE_URL).toString(),
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    qrId: id?.toString(),
                }),
            }
        );

        if (!response.ok) {
            throw new Error("Failed to follow brand");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.log("Error failed to follow brand:", error);
    }
};
