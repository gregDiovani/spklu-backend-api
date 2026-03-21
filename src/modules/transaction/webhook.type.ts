export interface XenditQrPaymentWebhook {
    event: 'qr.payment' | string;
    created: string;
    business_id: string;
    data: {
        id: string;
        business_id: string;
        currency: string;
        amount: number;
        status: 'SUCCEEDED' | 'PENDING' | 'FAILED' | string;
        created: string;
        qr_id: string;
        qr_string: string;
        reference_id: string;
        type: 'DYNAMIC' | 'STATIC' | string;
        channel_code: string;
        expires_at: string;
        metadata?: Record<string, unknown>;
        payment_detail?: {
            receipt_id?: string;
            source?: string;
        };
    };
}