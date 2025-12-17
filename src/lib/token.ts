// src/lib/token.ts
import jwt from "jsonwebtoken";
import { env } from "../config/env";

const ACCESS_SECRET = env.JWT_SECRET;
const REFRESH_SECRET = env.JWT_SECRET;

/* ======================
   TYPES
====================== */
export interface AccessTokenPayload {
    uid: string;
    username: string;
    role: string;
}

export interface RefreshTokenPayload {
    uid: string;
    type: "refresh";
}

/* ======================
   CREATE ACCESS TOKEN
====================== */
export function createAccessToken(payload: AccessTokenPayload) {
    return jwt.sign(payload, ACCESS_SECRET as string, {
        expiresIn: "15m", // 🔥 pendek
    });
}

/* ======================
   CREATE REFRESH TOKEN
====================== */
export function createRefreshToken(payload: RefreshTokenPayload) {
    return jwt.sign(payload, REFRESH_SECRET as string, {
        expiresIn: "7d", // 🔥 panjang
    });
}

/* ======================
   VERIFY REFRESH TOKEN
====================== */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, REFRESH_SECRET as string) as RefreshTokenPayload;
}
