import { BASE_URL } from "@/components/utils/Common";

export const updateProfile = async (payload: { name: string; image: string }) => {
    try {
        const response = await fetch(
            new URL("api/game/user/update-profile", BASE_URL).toString(),
            {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            throw new Error("Failed to update profile");
        }

        return await response.json();
    } catch (error) {
        console.error("updateProfile error:", error);
        throw error;
    }
};
