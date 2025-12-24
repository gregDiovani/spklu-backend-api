export interface XenditQrPaymentWebhook {
    event: "qr.payment"
    id: string                    // qrpy_xxx (provider payment id)
    status: "COMPLETED" | "PENDING" | "FAILED"
    amount: number
    created: string

    qr_code: {
        external_id: string         // externalId kamu
        id: string                  // qr_xxx
        type: "DYNAMIC" | "STATIC"
        qr_string: string
        metadata: Record<string, any> | null
    }

    payment_details?: {
        receipt_id: string | null
        source: string
    }
}