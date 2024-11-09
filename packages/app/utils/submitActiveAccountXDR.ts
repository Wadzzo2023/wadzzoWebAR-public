import { z } from "zod";
import toast from "react-hot-toast";
import { extraSchema } from "../../auth/types";
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
