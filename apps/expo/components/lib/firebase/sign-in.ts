export const BASE_URL = "http://192.168.0.115:3000/"
export const CALLBACK_URL = "http://192.168.0.115:3000/"        

type EmailPassOptions = {
  walletType: "emailPass";
  email: string;
  password: string;
  token?: string;
};

type GoogleOptions = {
  walletType: "google";
  email: string;
  token: string;
};

type SignInOptions = EmailPassOptions | GoogleOptions;

export async function SignIn({ options }: { options: SignInOptions }) {

  const _signInUrl = new URL(
    "api/auth/callback/credentials",
    BASE_URL
  ).toString();

  const csrfToken = await getCsrfToken();

  // Flatten the options into a key-value pair object for URLSearchParams
  const params = {
    ...options,
    csrfToken,
    callbackUrl: CALLBACK_URL,
    json: "true",
  };

  const xd = new URLSearchParams(params);

  const res = await fetch(_signInUrl, {
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },

    body: xd.toString(),
  });

  return res;
}
export async function getCsrfToken() {
  const csrTokenRequest = await fetch(
    new URL("api/auth/csrf", BASE_URL).toString(),
    {
      credentials: "include",
    }
  );
  const csrTokenResponse = (await csrTokenRequest.json()) as {
    csrfToken: string;
  };
  const csrfToken = csrTokenResponse.csrfToken;
  return csrfToken;
}
