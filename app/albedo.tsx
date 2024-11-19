import { useLocalSearchParams } from "expo-router";
import { AlbedoWebViewAuth } from "../components/lib/auth/wallet/albedo";

export default function AlbedoLogin() {
  const { xdr, brandId } = useLocalSearchParams();

  return <AlbedoWebViewAuth xdr={xdr as string} brandId={brandId as string} />;
}
