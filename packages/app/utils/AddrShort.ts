import { z } from "zod";
import toast from "react-hot-toast";
import { submitSignedXDRToServer4User } from "./submitSignedXDRtoServer4User";

enum WalletType {
    none = "none",
    albedo = "albedo",
    walletConnect = "walletConnect",
    frieghter = "frieghter",
    xBull = "xBull",
    rabet = "rabet",
    facebook = "facebook",
    google = "google",
    emailPass = "emailPass",
    isAdmin = "isAdmin",
    apple = "apple",
}
export const extraSchema = z.object({
    isAccActive: z.boolean(),
    xdr: z.string().optional(),
});
export function addrShort(addr: string, size?: number) {
    if (!addr) return "No address";
    const cropSize = size ?? 3;
    return `${addr.substring(0, cropSize)}...${addr.substring(addr.length - cropSize, addr.length)}`;
}

export function checkPubkey(pubkey: string): boolean {
    return !pubkey || pubkey.trim() === "" || !(pubkey.length === 56);
}


export function needSign(walletType: WalletType) {
    if (
        walletType == WalletType.emailPass ||
        walletType == WalletType.facebook ||
        walletType == WalletType.google
    )
        return true;
    return false;
}



export async function submitActiveAcountXdr(
    extra: z.infer<typeof extraSchema>,
) {
    if (!extra.isAccActive) {
        if (extra.xdr) {

            const res = await submitSignedXDRToServer4User(extra.xdr)



        }
    }
}
