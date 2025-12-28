// modules/payment/payment.provider.ts
import xendit from "../../config/xendit";
import { logger } from "../../lib/log";
import { retry } from "../../lib/retry";


export class PaymentProvider {

  payment_method = "QRIS";
  provider = "XENDIT";
  currency = "IDR";

  async createQr(
    transactionId: string,
    amount: number,
    callbackUrl?: string
  ) {
    logger.info(
      {
        provider: this.provider,
        method: "CREATE_QR",
        transactionId,
        amount,
        callbackUrl,
      },
      "Sending QR create request"
    );

    try {
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
            const status = err?.response?.status;
            logger.warn(
              { status, message: err?.message },
              "QR create failed — checking retry condition"
            );
            return !status || status >= 500;
          },
        }
      );

      logger.info(
        {
          provider: this.provider,
          method: "CREATE_QR_SUCCESS",
          transactionId,
          providerRef: resp.data?.id,
          status: resp.data?.status,
        },
        "QR created successfully"
      );

      return resp.data;
    } catch (err: any) {
      logger.error(
        {
          provider: this.provider,
          method: "CREATE_QR_FAILED",
          transactionId,
          status: err?.response?.status,
          providerError: err?.response?.data,
        },
        "QR create request failed"
      );

      throw new Error("Provider QR creation failed");
    }
  }

  async getQrStatus(providerRef: string) {
    logger.info(
      {
        provider: this.provider,
        method: "GET_QR_STATUS",
        providerRef,
      },
      "Fetching QR status"
    );

    try {
      const resp = await xendit.get(`/qr_codes/${providerRef}`);

      logger.info(
        {
          provider: this.provider,
          method: "GET_QR_STATUS_SUCCESS",
          providerRef,
          status: resp.data?.status,
        },
        "QR status fetched"
      );

      return resp.data.status;
    } catch (err: any) {
      logger.error(
        {
          provider: this.provider,
          method: "GET_QR_STATUS_FAILED",
          providerRef,
          status: err?.response?.status,
          providerError: err?.response?.data,
        },
        "QR status fetch failed"
      );

      throw err;
    }
  }
}