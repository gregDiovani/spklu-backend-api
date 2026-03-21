import { redis } from '../../config/redis';
import { logger } from '../../lib/log';
import { mapProviderToInternalStatus } from './helper.transcation';
import { PaymentProvider } from './transaction.provider';
import { TransactionRepository } from './transaction.repository';
import { CreatePaymentDTO } from './dto/create-payment.dto';
import { PaymentModel } from './models/payment.model';

export class PaymentService {
  constructor(
    private repo: TransactionRepository,
    private provider: PaymentProvider
  ) { }

  async createPaymentQRIS(input: CreatePaymentDTO) {
    const existing = await this.repo.findByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      logger.info({ transactionId: existing.transaction_id }, 'Returning existing payment by idempotency key');
      return { data: new PaymentModel(existing), invoice: null, reused: true };
    }

    const transactionId =
      input.transactionId ?? `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const created = await this.repo.createTransaction(input, transactionId);

    try {
      const invoice = await this.provider.createQr(transactionId, input.amount, input.callbackUrl);

      const updated = await this.repo.updateAfterProvider({
        transactionId,
        providerRef: invoice.id,
        providerStatus: invoice.status,
        internalStatus: mapProviderToInternalStatus(invoice.status),
        qrString: invoice.qr_string,
        providerResponse: invoice,
      });

      return { data: new PaymentModel(updated), invoice, reused: false };
    } catch (err: any) {
      await this.repo.markProviderCreateFailed(transactionId, err?.response?.data ?? err?.message ?? err);
      throw err;
    }
  }

  async receiveWebhook(params: {
    transactionId: string | null;
    providerRef: string | null;
    providerStatus: string;
    payload: unknown;
    providerEventId: string | null;
  }) {
    await this.repo.saveWebhookEvent({
      providerName: 'xendit',
      providerEventId: params.providerEventId,
      transactionId: params.transactionId,
      providerStatus: params.providerStatus,
      payload: params.payload,
    });

    try {
      await redis.lpush('xendit:webhook', JSON.stringify(params));
    } catch (err) {
      logger.error({ err }, 'Redis down, webhook stored in DB only');
    }

    return { success: true };
  }

  async handleWebhook(params: {
    transactionId: string | null;
    providerRef: string | null;
    providerStatus: string;
    payload: unknown;
    providerEventId: string | null;
  }) {
    const internalStatus = mapProviderToInternalStatus(params.providerStatus);

    return this.repo.processWebhookUpdate({
      ...params,
      internalStatus,
    });
  }

  async reconcilePending(limit = 20) {
    const rows = await this.repo.findPendingForReconcile(limit);

    for (const row of rows) {
      await this.repo.touchLastChecked(row.transaction_id);
      try {
        if (!row.provider_ref) continue;
        const providerStatus = await this.provider.getQrStatus(row.provider_ref);
        await this.repo.processWebhookUpdate({
          transactionId: row.transaction_id,
          providerRef: row.provider_ref,
          providerStatus,
          payload: { source: 'reconciler' },
          providerEventId: `reconcile:${row.transaction_id}:${Date.now()}`,
          internalStatus: mapProviderToInternalStatus(providerStatus),
        });
      } catch (err: any) {
        await this.repo.createRetryJob(row.transaction_id, err?.message ?? 'reconcile failed');
      }
    }
  }

  getPayment(id: string) {
    return this.repo.getTransactionById(id);
  }
}
