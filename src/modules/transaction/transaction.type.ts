// modules/payment/payment.types.ts
export interface CreatePaymentInput {
    merchant_id: string;
    amount: number;
    callback_url?: string;
    metadata?: Record<string, unknown>;
    external_id?: string;
}

export interface CreatePaymentResult {
    transaction_id: string;
    invoice: unknown;
}


export interface WebhookInput {
    externalId: string | null;
    providerRef: string | null;
    providerStatus: string;
    payload: unknown;
    providerEventId: string | null;
}