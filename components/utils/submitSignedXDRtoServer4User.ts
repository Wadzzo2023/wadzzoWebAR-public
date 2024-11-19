export const STELLAR_URL = "https://horizon.stellar.org";

export const submitSignedXDRToServer4User = async (signed_xdr: string) => {

    try {
        const response = await fetch(`${STELLAR_URL}/transactions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ tx: signed_xdr, null: "" }).toString(),
        });

        if (response.ok) {
            const result = await response.json();
            console.info("Transaction successful:", result);
            return result.successful;
        } else {
            const errorData = await response.json();

            if (errorData.extras && errorData.extras.envelope_xdr) {
                console.log("Envelope XDR:", errorData.extras.envelope_xdr);
                console.log("Result XDR:", errorData.extras.result_codes);
            }
            return false;
        }
    } catch (e) {
        console.log("Other error:", e);
        return false;
    }
};
