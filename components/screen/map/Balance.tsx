import { getUserPlatformAsset } from "@/app/api/routes/get-user-platformAsset";
import { useQuery } from "@tanstack/react-query";

import { Text } from "react-native-paper";

export function Balance() {
  const balanceRes = useQuery({
    queryKey: ["balance"],
    queryFn: getUserPlatformAsset,
  });

  return (
    <Text
      style={{
        color: "white",
      }}
    >
      {Number(balanceRes.data) >= 0 ? Number(balanceRes.data).toFixed(2) : 0}
    </Text>
  );
}
