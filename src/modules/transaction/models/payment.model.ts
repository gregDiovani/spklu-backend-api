import { PaymentStatus, PaymentTransaction } from '@prisma/client';

export class PaymentModel {
  constructor(private readonly row: PaymentTransaction) {}

  get id(): string {
    return this.row.transaction_id;
  }

  get status(): PaymentStatus {
    return this.row.status;
  }

  get isFinal(): boolean {
    return ['PAID', 'EXPIRED', 'FAILED', 'CANCELED'].includes(this.row.status);
  }

  toJSON() {
    return {
      transaction_id: this.row.transaction_id,
      merchant_id: this.row.merchant_id,
      amount: this.row.amount.toString(),
      currency: this.row.currency,
      status: this.row.status,
      provider: this.row.provider,
      provider_ref: this.row.provider_ref,
      provider_status: this.row.provider_status,
      qr_string: this.row.qr_string,
      created_at: this.row.created_at,
      updated_at: this.row.updated_at,
      paid_at: this.row.paid_at,
    };
  }
}
