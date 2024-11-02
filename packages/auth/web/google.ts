import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../config";
import { SignIn } from "../sign-in";
import { WalletType } from "../types";

export async function GoogleLogin() {
  const provider = new GoogleAuthProvider();

  provider.addScope("https://www.googleapis.com/auth/userinfo.email");

  try {
    const user = (await signInWithPopup(auth, provider)).user;
    const { email } = user.providerData[0]!;
    if (email) {
      const idToken = await user.getIdToken();

      const res = await SignIn({
        options: {
          email: email,
          token: idToken,
          walletType: WalletType.google,
        },
      });

      return res;
    }
  } catch (e) {
    console.error(e);
  }
}
