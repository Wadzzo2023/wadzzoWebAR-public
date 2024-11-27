import { z } from "zod";
import { extraSchema } from "./AddrShort";
import { toast, ToastPosition } from "@backpackapp-io/react-native-toast";
import { submitSignedXDRToServer4User } from "./submitSignedXDRtoServer4User";
import { Color } from "./all-colors";

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
                toast("Account Activated", {

                    duration: 4000,
                    position: ToastPosition.TOP,
                    styles: {
                        view: { backgroundColor: Color.wadzzo },
                    },
                });
            } else {
                toast("Account Activation Failed", {

                    duration: 4000,
                    position: ToastPosition.TOP,
                    styles: {
                        view: { backgroundColor: Color.light.error },
                        text: { color: 'white' }
                    },
                });
            }
        }
    }
}
