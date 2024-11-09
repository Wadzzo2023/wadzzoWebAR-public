import { OAuthProvider, signInWithPopup } from "firebase/auth";

import axios from "axios";
import toast from "react-hot-toast";
import { appleAuthSchema, getPublicKeyAPISchema, WalletType } from "@auth/types";
import { SignIn } from "@auth/sign-in";
import { z } from "zod";
import { submitActiveAcountXdr } from "@app/utils/AddrShort";
import { auth } from "@auth/web/webfirebaseconfig";

export const ACTION_STELLAR_ACCOUNT_URL = "https://accounts.action-tokens.com/";

export const USER_ACCOUNT_URL = ACTION_STELLAR_ACCOUNT_URL + "api/account";

export async function appleLogin() {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  console.log(provider);
  try {
    const user = (await signInWithPopup(auth, provider)).user;
    const email = user.email;
    // const { email, uid } = user.providerData[0]!;
    // const email = user.email;
    if (email) {
      const idToken = await user.getIdToken();

      const loginRes = await toast.promise(
        ProviderAppleLogin({
          email,
          token: idToken,
          walletType: WalletType.apple,
        }),
        { error: "Login error", loading: "Please Wait", success: null },
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
          },
        );

        const { extra } = await getPublicKeyAPISchema.parseAsync(res.data);

        await submitActiveAcountXdr(extra);
      }
    } else {
      toast.error("Please share you email with us. without we can't proceed");
    }

    // await NextLogin(publicKey, publicKey);
    // toast.success("Public Key : " + addrShort(publicKey, 10));
  } catch (error) {
    console.error(error);
    // toast.error(error.message)
  }
}
export async function ProviderAppleLogin({
  appleToken,
  token,
  walletType,
  email,
}: z.infer<typeof appleAuthSchema>) {
  const response = await SignIn({
    options: {
      token,
      email,
      appleToken,
      walletType,
    }

  });
  return response;
}