// domain/repositories/MerchantSecretRepository.ts

import { MerchantSecret } from "./merchant.type";

export interface MerchantSecretRepository {
    findActiveByMerchantId(
        merchantId: string
    ): Promise<MerchantSecret | null>;

    save(secret: MerchantSecret): Promise<void>;

    revokeAllByMerchantId(merchantId: string): Promise<void>;



}
