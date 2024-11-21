import { User } from "@/components/lib/auth/Provider";
import { BASE_URL } from "@/components/utils/Common";

export const getUser = async () => {
  try {
    const response = await fetch(
      new URL("api/game/user", BASE_URL).toString(),
      {
        method: "GET",
        credentials: "include",
      }
    );
    if (!response.ok) {
      // console.log("Failed to fetch user");
    }

    const data = (await response.json()) as User;

    return data;
  } catch (error) {
    console.error("Error fetching user:", error);
  }
};
