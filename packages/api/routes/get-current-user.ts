import { BASE_URL } from "app/utils/Common";

export const getCurrentUser = async () => {
    try {
        const response = await fetch(
            new URL("api/game/user", BASE_URL).toString(),
            {
                method: "GET",
                credentials: "include",
            }
        );




        if (!response.ok) {
            throw new Error("Failed to fetch collections");
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error("Error fetching collections:", error);
        throw error;
    }
};
