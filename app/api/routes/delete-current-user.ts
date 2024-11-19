import { BASE_URL } from "@/components/utils/Common";

export const deleteCurrentUser = async () => {
    try {
        const response = await fetch(
            new URL("api/game/user/delete-user", BASE_URL).toString(),
            {
                method: "GET",
                credentials: "include",
            }
        );

        if (!response.ok) {
            throw new Error("Error deleting");
        }
        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};
