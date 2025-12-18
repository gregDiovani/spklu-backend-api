// infra/repositories/PostgresMerchantSecretRepository.ts

import { MerchantSecret } from "./merchant.type";
import { MerchantSecretRepository } from "./merchantSecretRepository";

export class PostgresMerchantSecretRepository
    implements MerchantSecretRepository {
    constructor(private db: any) { }

    async findActiveByMerchantId(merchantId: string) {
        const { rows } = await this.db.query(
            `SELECT *
       FROM merchant_secrets
       WHERE merchant_id = $1
         AND is_active = true
         AND deleted_at IS NULL
       LIMIT 1`,
            [merchantId]
        );

        return rows[0] ?? null;
    }

    async save(secret: MerchantSecret) {
        await this.db.query(
            `INSERT INTO merchant_secrets
       (merchant_id, secret_enc, secret_iv, secret_tag, is_active, deleted_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                secret.merchant_id,
                secret.secret_enc,
                secret.secret_iv,
                secret.secret_tag,
                secret.is_active,
                secret.deleted_at,
            ]
        );
    }

    async revokeAllByMerchantId(merchantId: string) {
        await this.db.query(
            `UPDATE merchant_secrets
       SET is_active = false,
           deleted_at = now()
       WHERE merchant_id = $1
         AND is_active = true
         AND deleted_at IS NULL`,
            [merchantId]
        );
    }
}
