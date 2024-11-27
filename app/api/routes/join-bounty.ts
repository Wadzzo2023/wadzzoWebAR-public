import { BASE_URL } from "@/components/utils/Common";


export const JoinBounty = async ({ bountyId }: { bountyId: string }) => {
    try {
        const response = await fetch(
            new URL("api/game/bounty/join_bounty", BASE_URL).toString(),
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ bountyId: bountyId.toString() }),
            }
        );

        if (!response.ok) {
            console.log("Failed to Join Bounty ", response);
            throw new Error("Failed to Join Bounty ");
        }
        console.log("Join Bounty Response:", response);

        const data = await response.json();
        console.log("Join Bounty Response:", data);
        return data;
    } catch (error) {
        console.log("Error failed to Join Bounty:", error);

    }
};
