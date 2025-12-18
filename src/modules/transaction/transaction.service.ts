// modules/payment/payment.service.ts
import { redis } from "../../config/redis";
import { PaymentProvider } from "./transaction.provider";
import { TransactionRepository } from "./transaction.repository";
import { CreatePaymentInput } from "./transaction.type";

export class PaymentService {
  constructor(
    private repo: TransactionRepository,
    private provider: PaymentProvider
  ) { }

  async createPayment(
    input: CreatePaymentInput,
    internalSecret: string

  ) {
    const transactionId =
      input.external_id ??
      `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const created = await this.repo.createTransaction({
      transaction_id: transactionId,
      merchant_id: input.merchant_id,
      amount: input.amount,
      status: "CREATED",
      metadata: input.metadata ?? {},
    });

    if (!created?.success) {
      throw new Error("DB create failed");
    }

    let invoice;
    try {
      invoice = await this.provider.createQr(
        transactionId,
        input.amount,
        input.callback_url
      );
    } catch (err: any) {
      await this.repo.updateTransaction(internalSecret, {
        external_id: transactionId,
        status: "ERROR",
        provider_status: "ERROR",
        last_error: JSON.stringify(err?.response?.data ?? err.message),
      });
      throw err;
    }

    await this.repo.updateTransaction(internalSecret, {
      external_id: transactionId,
      status: invoice.status === "ACTIVE" ? "ACTIVE" : "PENDING",
      provider_status: invoice.status,
      provider_ref: invoice.id,
      provider_response: invoice,
      qr_string: invoice.qr_string,
    });

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
