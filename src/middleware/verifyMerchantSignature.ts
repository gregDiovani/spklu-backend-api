import { FastifyRequest, FastifyReply } from "fastify";
import crypto from "crypto";
import { db } from "../config/db";
import { decryptAES } from "../infrastructure/security/aes";

const MAX_DRIFT_SECONDS = 300; // 5 menit

export async function verifyMerchantSignature(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const merchantId = request.headers["x-merchant-id"] as string;
    const signature = request.headers["x-signature"] as string;
    const timestamp = Number(request.headers["x-timestamp"]);

    // 1️⃣ header wajib
    if (!merchantId || !signature || !timestamp) {
        return reply.code(401).send({
            message: "Missing merchant authentication headers",
        });
    }

    // 2️⃣ cek timestamp (anti replay)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > MAX_DRIFT_SECONDS) {
        return reply.code(401).send({
            message: "Request expired",
        });
    }

    // 3️⃣ cek merchant & ambil secret aktif
    const { rows } = await db.query(
        `SELECT ms.secret_enc, ms.secret_iv, ms.secret_tag
     FROM merchant_secrets ms
     JOIN merchants m ON m.merchant_id = ms.merchant_id
     WHERE ms.merchant_id = $1
       AND ms.is_active = true
       AND ms.deleted_at IS NULL
       AND m.deleted_at IS NULL
     LIMIT 1`,
        [merchantId]
    );

    if (!rows.length) {
        return reply.code(401).send({
            message: "Invalid merchant",
        });
    }

    // 4️⃣ decrypt merchant secret
    const merchantSecret = decryptAES(
        rows[0].secret_enc,
        rows[0].secret_iv,
        rows[0].secret_tag
    );

    // 5️⃣ hitung ulang signature
    const payload = request.body ?? {};
    const dataToSign = JSON.stringify(payload) + timestamp;

    const expectedSignature = crypto
        .createHmac("sha256", merchantSecret)
        .update(dataToSign)
        .digest("hex");

    // 6️⃣ bandingkan signature
    if (expectedSignature !== signature) {
        return reply.code(403).send({
            message: "Invalid signature",
        });
    }

    // 7️⃣ attach merchant ke request (optional)
    (request as any).merchant = {
        merchant_id: merchantId,
    };
}
