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
    const signature = (request.headers["x-signature"] as string)?.trim();
    const timestamp = Number(request.headers["x-timestamp"]);

    if (!merchantId || !signature || !timestamp) {
        return reply.code(401).send({ message: "Missing merchant authentication headers" });
    }

    // anti replay
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > MAX_DRIFT_SECONDS) {
        return reply.code(401).send({ message: "Request expired" });
    }

    // ambil secret aktif
    const { rows } = await db.query(
        `
    SELECT secret_enc, secret_iv, secret_tag
    FROM spklu.merchant_secrets
    WHERE merchant_id = $1
      AND is_active = true
      AND deleted_at IS NULL
    LIMIT 1
    `,
        [merchantId]
    );

    if (!rows.length) {
        return reply.code(401).send({ message: "Invalid merchant" });
    }

    // decrypt secret
    const merchantSecret = decryptAES(
        rows[0].secret_enc,
        rows[0].secret_iv,
        rows[0].secret_tag
    );

    // ⚠️ stringify HARUS sama dengan client
    const body = request.body as {
        type: string;
        currency: string;
        amount: number;
    };
    // ✅ FORMAT FINAL
    const dataToSign = `${merchantId}.${timestamp}.${body.type}.${body.currency}.${body.amount}`;

    // console.log("SERVER SECRET LENGTH:", merchantSecret.length);
    // console.log(
    //     "SERVER SECRET HEX:",
    //     Buffer.from(merchantSecret).toString("hex")
    // );

    const expectedSignature = crypto
        .createHmac("sha256", merchantSecret)
        .update(dataToSign)
        .digest("hex");


    console.log({
        body,
        dataToSign,
        expectedSignature,
        receivedSignature: signature,
    });

    // ✅ SAFE COMPARE
    if (
        !crypto.timingSafeEqual(
            Buffer.from(expectedSignature, "hex"),
            Buffer.from(signature, "hex")
        )
    ) {
        return reply.code(403).send({ message: "Invalid signature" });
    }

    (request as any).merchant = { merchant_id: merchantId };
}