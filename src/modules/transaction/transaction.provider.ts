// modules/payment/payment.provider.ts
import xendit from "../../config/xendit";
import { retry } from "../../lib/retry";

export class PaymentProvider {
    async createQr(
        transactionId: string,
        amount: number,
        callbackUrl?: string
    ) {
        const resp = await retry(

            () =>
                xendit.post("/qr_codes", {
                    external_id: transactionId,
                    type: "DYNAMIC",
                    currency: "IDR",
                    amount,
                    callback_url: callbackUrl,
                }),
            {
                attempts: 3,
                delayMs: 500,
                shouldRetry: (err) => {
                    const status = err.response?.status;
                    return !status || status >= 500;
                },
            }



        );

        return resp.data;
    }

    async getQrStatus(providerRef: string) {
        const resp = await xendit.get(`/qr_codes/${providerRef}`);
        return resp.data.status;
    }
}
