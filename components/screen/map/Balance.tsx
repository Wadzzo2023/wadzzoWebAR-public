import { getUserPlatformAsset } from "@/app/api/routes/get-user-platformAsset";
import { Color } from "@/components/utils/all-colors";
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
        color: Color.wadzzo,
        fontWeight: "600",
        fontSize: 16,
      }}
    >
      {Number(balanceRes.data) >= 0 ? Number(balanceRes.data).toFixed(2) : 0}
    </Text>
  );
}
