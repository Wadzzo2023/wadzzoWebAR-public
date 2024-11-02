import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../config";

import base64 from "react-native-base64";

export async function GoogleOuthToFirebaseToken(
  idToken: string,
  accessToken: string
) {
  try {
    const credential = GoogleAuthProvider.credential(idToken, accessToken);

    const decodedToken = base64.decode(idToken.split(".")[1]);

    const email = extractEmailFromToken(decodedToken);

    // const email = data.email;
    console.log(email);

    const firebaseResult = await signInWithCredential(auth, credential);

    if (!email) throw new Error("Email is must");
    const firebaseToken = await firebaseResult.user.getIdToken();

    return { firebaseToken, email };
  } catch (e) {
    console.log(e);
    throw e;
  }
}

function extractEmailFromToken(decodedToken: string): string | null {
  try {
    // Remove any whitespace
    const cleanToken = decodedToken.trim();

    // Find the start and end of the email field
    const emailStartIndex = cleanToken.indexOf('"email":"');
    if (emailStartIndex === -1) return null;

    // Calculate the actual start of the email value
    const emailValueStart = emailStartIndex + '"email":"'.length;

    // Find the end of the email value (look for next ")
    const emailEndIndex = cleanToken.indexOf('"', emailValueStart);
    if (emailEndIndex === -1) return null;

    // Extract the email
    const email = cleanToken.substring(emailValueStart, emailEndIndex);

    return email;
  } catch (error) {
    console.error("Error extracting email:", error);
    return null;
  }
}
