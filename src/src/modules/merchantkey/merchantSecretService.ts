// domain/services/MerchantSecretService.ts
import crypto from "crypto";
import { decryptAES, encryptAES } from "../../infrastructure/security/aes";
import { MerchantSecretRepository } from "./merchantSecretRepository";

export class MerchantSecretService {
    constructor(
        private readonly repo: MerchantSecretRepository
    ) { }

    // CREATE
    async create(merchantId: string): Promise<string> {
        const rawSecret =
            "mk_" + crypto.randomBytes(32).toString("hex");

        const encrypted = encryptAES(rawSecret);

        await this.repo.save({
            merchant_id: merchantId,
            secret_enc: encrypted.enc,
            secret_iv: encrypted.iv,
            secret_tag: encrypted.tag,
            is_active: true,
            deleted_at: null,
        });

        return rawSecret; // RETURN RAW (1x)
    }

    // REVEAL
    async reveal(merchantId: string): Promise<string> {
        const secret = await this.repo.findActiveByMerchantId(
            merchantId
        );

        if (!secret) {
            throw new Error("Active secret not found");
        }

        return decryptAES(
            secret.secret_enc,
            secret.secret_iv,
            secret.secret_tag
        );
    }

    // ROTATE
    async rotate(merchantId: string): Promise<string> {
        await this.repo.revokeAllByMerchantId(merchantId);

        return this.create(merchantId);
    }


    // buat token baru
    async generateNewToken(merchantId: string): Promise<string> {
        // 1. revoke semua secret lama
        await this.repo.revokeAllByMerchantId(merchantId);

        // 2. generate token baru
        const rawSecret =
            "mk_" + crypto.randomBytes(32).toString("hex");

        // 3. encrypt
        const encrypted = encryptAES(rawSecret);

        // 4. simpan
        await this.repo.save({
            merchant_id: merchantId,
            secret_enc: encrypted.enc,
            secret_iv: encrypted.iv,
            secret_tag: encrypted.tag,
            is_active: true,
            deleted_at: null,
        });

        // 5. return RAW token (1x)
        return rawSecret;
    }

}
