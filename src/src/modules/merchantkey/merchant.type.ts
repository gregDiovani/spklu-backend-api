// domain/entities/MerchantSecret.ts
export interface MerchantSecret {
    id?: number;
    merchant_id: string;
    secret_enc: string;
    secret_iv: string;
    secret_tag: string;
    is_active: boolean;
    deleted_at: Date | null;
    created_at?: Date;
}
