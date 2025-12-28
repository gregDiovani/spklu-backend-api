// modules/payment/payment.service.ts
import { redis } from "../../config/redis";
import { logger } from "../../lib/log";
import { mapProviderToInternalStatus } from "./helper.transcation";
import { PaymentProvider } from "./transaction.provider";
import { TransactionRepository } from "./transaction.repository";
import { CreatePaymentInput } from "./transaction.type";

export class PaymentService {
  constructor(
    private repo: TransactionRepository,
    private provider: PaymentProvider
  ) { }

  async createPaymentQRIS(
    input: CreatePaymentInput,
  ) {
    const transactionId =
      input.external_id ??
      `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    logger.info(
      { transactionId, input },
      "Creating QRIS payment"
    );

    const created = await this.repo.createTransaction({
      transaction_id: transactionId,
      merchant_id: input.merchant_id,
      amount: input.amount,
      provider: this.provider.provider,
      currency: this.provider.currency,
      payment_method: this.provider.payment_method,
      status: "CREATED",
      metadata: input.metadata ?? {},
    });

    if (!created?.success) {
      logger.error({ transactionId }, "DB createTransaction failed");
      throw new Error("DB create failed");
    }

    let invoice;

    //
    // -------- PROVIDER CALL --------
    //
    try {

      invoice = await this.provider.createQr(
        transactionId,
        input.amount,
        input.callback_url
      );

      logger.info(
        { transactionId, provider_status: invoice?.status },
        "Provider QR created successfully"
      );

    } catch (err: any) {

      logger.error(
        { transactionId, err: err?.response?.data ?? err?.message ?? err },
        "Provider createQr failed"
      );

      //
      // -------- AUDIT (BEST-EFFORT) --------
      //
      try {
        await this.repo.insertToAuditTransaction({
          transaction_id: transactionId,
          action: "PROVIDER_CREATE_FAILED",
          old_status: "CREATED",
          new_status: "CREATED",
          payload: { error: err?.response?.data ?? err?.message ?? err },
          note: "Failed to create QR at provider",
          performed_by: "system",
        });
      } catch (auditErr) {
        logger.error(
          { transactionId, auditErr },
          "Audit insert failed — ignored"
        );
      }

      throw new Error("Provider QR creation failed");
    }

    //
    // -------- VALIDASI RESPONSE --------
    //
    if (!invoice?.status) {
      logger.error(
        { transactionId, invoice },
        "Invalid provider invoice — missing status"
      );

      throw new Error("Invalid provider invoice");
    }

    //
    // -------- UPDATE TRANSACTION (BEST-EFFORT) --------
    //
    try {

      await this.repo.updateTransaction( {
        external_id: transactionId,
        status: mapProviderToInternalStatus(invoice.status),
        provider_status: invoice.status,
        provider_ref: invoice.id,
        provider_response: invoice,
        qr_string: invoice.qr_string,
      });

      logger.info(
        { transactionId, status: invoice.status },
        "Transaction updated successfully"
      );

    } catch (updateErr) {

      logger.error(
        { transactionId, updateErr },
        "updateTransaction failed — ignored"
      );
    }

    return { transaction_id: transactionId, invoice };
  }


  async handleWebhook(params: {
    externalId: string | null;
    providerRef: string | null;
    providerStatus: string;
    payload: unknown;
    providerEventId: string | null;
  }) {

    const key = `xendit:event:${params.providerEventId}`;
    const ok = await redis.set(
      key,
      "1",
      "EX",
      86400,
      "NX"
    );

    if (!ok) {
      return; // duplicate webhook
    }

    return this.repo.processWebhookUpdate(params);
  }

  getPayment(id: string) {
    return this.repo.getTransactionById(id);
  }


}
