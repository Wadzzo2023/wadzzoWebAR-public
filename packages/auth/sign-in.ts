import { AuthCredentialType } from "./types";
import { BASE_URL, CALLBACK_URL } from "@app/utils/Common";

export async function SignIn({ options }: { options: AuthCredentialType }) {
  const _signInUrl = new URL(
    "api/auth/callback/credentials",
    BASE_URL
  ).toString();

  console.log(options);
  const res = await fetch(_signInUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    // credentials: "include",

    body: new URLSearchParams({
      ...options,
      csrfToken: await getCsrfToken(),
      callbackUrl: CALLBACK_URL,
      json: "true",
    }).toString(),
  });

  return res;
}
export async function getCsrfToken() {
  const csrTokenRequest = await fetch(
    new URL("api/auth/csrf", BASE_URL).toString()
    // {
    //   credentials: "include",
    // }
  );
  const csrTokenResponse = (await csrTokenRequest.json()) as {
    csrfToken: string;
  };
  const csrfToken = csrTokenResponse.csrfToken;
  console.log("csrf", csrfToken);
  return csrfToken;
}
