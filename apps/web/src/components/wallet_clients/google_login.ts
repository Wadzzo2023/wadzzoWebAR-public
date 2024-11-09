import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { submitActiveAcountXdr } from "@app/utils/AddrShort";
import { SignIn } from "@auth/sign-in";
import {
  getPublicKeyAPISchema,
  providerAuthShema,
  WalletType,
} from "@auth/types";
import { auth } from "@auth/web/webfirebaseconfig";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import { getTokenUser } from "@api/routes/get-token-user";

export const ACTION_STELLAR_ACCOUNT_URL = "https://accounts.action-tokens.com/";

export const USER_ACCOUNT_URL = ACTION_STELLAR_ACCOUNT_URL + "api/account";

export async function googleLogin() {
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/userinfo.email");

  try {
    const user = (await signInWithPopup(auth, provider)).user;
    const { email } = user.providerData[0]!;
    // const email = user.email;
    if (email) {
      const idToken = await user.getIdToken();

      const loginRes = await toast.promise(
        ProviderNextLogin({
          email,
          token: idToken,
          walletType: WalletType.google,
        }),
        { error: "Login error", loading: "Please Wait", success: null }
      );

      // console.log(loginRes);

      // await auth.signOut();
      if (loginRes?.ok) {
        if (loginRes?.ok) toast.success("Login Successfull");

        const res = await toast.promise(
          axios.get(USER_ACCOUNT_URL, {
            params: {
              uid: user.uid,
              email,
            },
          }),
          {
            loading: "Getting public key...",
            success: "Received public key",
            error: "Unable to get public key",
          }
        );

        const { extra } = await getPublicKeyAPISchema.parseAsync(res.data);

        await submitActiveAcountXdr(extra);
      }
    } else {
      toast.error("Email dont exist");
    }
  } catch (error) {
    console.error(error);
    // toast.error(error.message)
  }
}
export async function ProviderNextLogin({
  token,
  walletType,
  email,
}: z.infer<typeof providerAuthShema>) {
  const response = await SignIn({
    options: {
      email,
      token,
      walletType,
    },
  });
  return response;
}
