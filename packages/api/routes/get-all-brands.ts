import { BASE_URL } from "@/constants/Common";


export const getAllBrands = async () => {
    try {
        const response = await fetch(
            new URL("api/game/brands", BASE_URL).toString(),
            {
                method: "GET",
                credentials: "include",
            }
        );

        console.log("Response", response.headers);


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
