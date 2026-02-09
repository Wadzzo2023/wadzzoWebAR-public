import { BASE_URL } from "@/components/utils/Common";

export const updateProfileDetails = async (payload: { name?: string; bio?: string; pronouns?: string }) => {
    try {
        const response = await fetch(
            new URL("api/game/user/update-profile-details", BASE_URL).toString(),
            {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            throw new Error("Failed to update profile details");
        }

        return await response.json();
    } catch (error) {
        console.error("updateProfileDetails error:", error);
        throw error;
    }
};
