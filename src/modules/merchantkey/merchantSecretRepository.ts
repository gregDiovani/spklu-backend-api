// domain/repositories/MerchantSecretRepository.ts

import { Merchant } from "../merchant/merchant.type";
import { MerchantSecret } from "./merchant.type";

export interface MerchantSecretRepository {

    findActiveMerchant(merchantId: string): Promise<Merchant | null>;
    findActiveKeyByMerchantId(
        merchantId: string
    ): Promise<MerchantSecret | null>;

    save(secret: MerchantSecret): Promise<void>;

    revokeAllByMerchantId(merchantId: string): Promise<void>;



}
