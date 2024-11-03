import { AlbedoWebViewAuth } from "@auth/wallet/albedo";
import { useLocalSearchParams } from "expo-router";

export default function AlbedoLogin() {
  const { xdr, brandId } = useLocalSearchParams();

  return <AlbedoWebViewAuth xdr={xdr as string} brandId={brandId as string} />;
}
