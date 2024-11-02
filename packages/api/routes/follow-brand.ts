import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from "app/utils/Common";

export const FollowBrand = async ({ brand_id }: { brand_id: string }) => {
    try {

        const response = await fetch(
            new URL("api/game/follow", BASE_URL).toString(),
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ brand_id: brand_id?.toString() }),
            }
        );

        if (!response.ok) {
            throw new Error("Failed to follow brand");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error failed to follow brand:", error);

    }
};
