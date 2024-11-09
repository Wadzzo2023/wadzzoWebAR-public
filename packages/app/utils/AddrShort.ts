import { extraSchema, WalletType } from "../../auth/types";

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

import { z } from "zod";
import toast from "react-hot-toast";
import { submitSignedXDRToServer4User } from "./submitSignedXDRtoServer4User";


export async function submitActiveAcountXdr(
    extra: z.infer<typeof extraSchema>,
) {
    if (!extra.isAccActive) {
        if (extra.xdr) {
            const res = await toast.promise(
                submitSignedXDRToServer4User(extra.xdr),
                {
                    loading: "Activating account...",
                    success: "Request completed successfully",
                    error: "While activating account error happened, Try again later",
                },
            );

            if (res) {
                toast.success("Account activated");
            } else {
                toast.error("Account activation failed");
            }
        }
    }
}
