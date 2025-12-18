// src/middleware/requireAuth.ts
import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { UserRole } from "../shared/constants/role";

interface JwtPayload {
    uid: string;
    username: string;
    role: UserRole;
}

/**
 * requireAuth
 * - support COOKIE (web)
 * - support Authorization Bearer (mobile/postman)
 * - attach user to req.user
 */
export async function requireAuth(
    req: FastifyRequest,
    reply: FastifyReply
) {
    try {
        // 1️⃣ TOKEN DARI COOKIE (WEB)
        let token = req.cookies?.sb_access_token as string | undefined;

        // 2️⃣ FALLBACK KE AUTH HEADER (MOBILE / POSTMAN)
        if (!token) {
            const auth = req.headers.authorization;
            if (auth?.startsWith("Bearer ")) {
                token = auth.slice(7);
            }
        }

        // 3️⃣ TOKEN TIDAK ADA
        if (!token) {
            return reply.code(401).send({
                error: "Unauthorized",
                message: "Missing access token",
            });
        }

        // 4️⃣ VERIFY JWT
        const decoded: JwtPayload = jwt.verify(
            token,
            env.ACCESS_SECRET as string
        ) as JwtPayload;

        // 5️⃣ ATTACH USER KE REQUEST
        req.user = {
            id: decoded.uid,
            username: decoded.username,
            role: decoded.role,
        };

        // 🚫 TIDAK PAKAI next()
        // return void → Fastify lanjut ke handler
    } catch (err: any) {
        req.log.error(err);

        return reply.code(401).send({
            error: "Unauthorized",
            message:
                env.NODE_ENV === "production"
                    ? "Invalid or expired token"
                    : err.message,
        });
    }
}
