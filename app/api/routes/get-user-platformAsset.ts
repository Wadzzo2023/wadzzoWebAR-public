import { BASE_URL } from "@/components/utils/Common";


export const getUserPlatformAsset = async () => {
    try {
        const response = await fetch(
            new URL("api/game/user/userBalance", BASE_URL).toString(),
            {
                method: "GET",
                credentials: "include",
            }
        );
        if (response.ok) {
            const data = await response.json();
            return data;
        }


    } catch (error) {
        // console.log("Failed to fetch User Balance:", error);

    }
};
