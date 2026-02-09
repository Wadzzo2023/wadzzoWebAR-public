import { BASE_URL } from "@/components/utils/Common";

export const updateCover = async (payload: { image: string }) => {
    try {
        const response = await fetch(
            new URL("api/game/user/update-cover", BASE_URL).toString(),
            {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            throw new Error("Failed to update cover image");
        }

        return await response.json();
    } catch (error) {
        console.error("updateCover error:", error);
        throw error;
    }
};
