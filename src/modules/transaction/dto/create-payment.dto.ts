export interface CreatePaymentDTO {
  merchantId: string;
  amount: number;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  transactionId?: string;
  idempotencyKey: string;
}
