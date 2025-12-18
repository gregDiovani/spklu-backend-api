// infra/security/aes.ts
import crypto from "crypto";
import { env } from "../../config/env";

const ALGO = "aes-256-gcm";
const KEY = Buffer.from(env.MASTER_KEY as string, "hex");

export function encryptAES(plain: string) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);

    let enc = cipher.update(plain, "utf8", "hex");
    enc += cipher.final("hex");

    return {
        enc,
        iv: iv.toString("hex"),
        tag: cipher.getAuthTag().toString("hex"),
    };
}

export function decryptAES(
    enc: string,
    iv: string,
    tag: string
) {
    const decipher = crypto.createDecipheriv(
        ALGO,
        KEY,
        Buffer.from(iv, "hex")
    );

    decipher.setAuthTag(Buffer.from(tag, "hex"));

    let dec = decipher.update(enc, "hex", "utf8");
    dec += decipher.final("utf8");

    return dec;
}
