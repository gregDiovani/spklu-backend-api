// domain/services/MerchantSecretService.ts
import crypto from "crypto";
import { decryptAES, encryptAES } from "../../infrastructure/security/aes";
import { MerchantSecretRepository } from "./merchantSecretRepository";
import { MerchantService } from "../merchant/merchant.service";

export class MerchantSecretService {
    constructor(
        private readonly repo: MerchantSecretRepository,
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
        const secret = await this.repo.findActiveKeyByMerchantId(
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
        // 1️⃣ ambil merchant

        // 4️⃣ revoke semua key lama
        await this.repo.revokeAllByMerchantId(merchantId);

        // 5️⃣ buat key baru
        return this.create(merchantId);
    }


    // buat token baru
    async generateNewToken(merchantId: string): Promise<string> {
        const merchant = await this.repo.findActiveMerchant(merchantId);

        if (!merchant) throw new Error("Merchant not found");

        if (merchant.deleted_at) throw new Error("Merchant has been deleted");

        await this.repo.revokeAllByMerchantId(merchantId);

        const rawSecret = "mk_" + crypto.randomBytes(32).toString("hex");

        const encrypted = encryptAES(rawSecret);

        await this.repo.save({
            merchant_id: merchantId,
            secret_enc: encrypted.enc,
            secret_iv: encrypted.iv,
            secret_tag: encrypted.tag,
            is_active: true,
            deleted_at: null,
        });

        return rawSecret;
    }
}
