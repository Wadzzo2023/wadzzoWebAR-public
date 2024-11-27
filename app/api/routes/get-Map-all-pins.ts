import { ConsumedLocation } from "@/components/types/CollectionTypes";
import { BASE_URL } from "@/components/utils/Common";

export const getMapAllPins = async ({ filterID }: { filterID: string }) => {
    // console.log("filterID", filterID);
    try {
        const url = new URL(`api/game/locations`, BASE_URL);
        url.searchParams.append("filterId", filterID); // Append filterID as a query parameter

        const response = await fetch(url.toString(), {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch pins");
        }

        const data = await response.json() as { locations: ConsumedLocation[] };
        return data;

    } catch (error) {
        // console.log("Error fetching pins:", error);

    }
};
