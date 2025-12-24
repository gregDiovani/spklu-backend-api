import { FastifyReply } from "fastify";
import { env } from "../config/env";

/* =========================
   COOKIE CONSTANTS
========================= */
export const ACCESS_COOKIE = "sb_access_token";
export const REFRESH_COOKIE = "sb_refresh_token";

const IS_PROD = env.NODE_ENV === "production";

export const BASE_COOKIE_OPTIONS = {
    httpOnly: true as const,
    path: "/",
    sameSite: IS_PROD ? "none" as const : "lax" as const,
    secure: IS_PROD,
};

/* ========
/* =========================
   SET AUTH COOKIES
========================= */
export function setAuthCookies(
    reply: FastifyReply,
    accessToken: string,
    refreshToken: string
) {
    reply
        .setCookie(ACCESS_COOKIE, accessToken, BASE_COOKIE_OPTIONS)
        .setCookie(REFRESH_COOKIE, refreshToken, {
            ...BASE_COOKIE_OPTIONS,
            // signed: true, // 👉 aktifkan kalau pakai cookie secret
        });
}

/* =========================
   CLEAR AUTH COOKIES
========================= */
export function clearAuthCookies(reply: FastifyReply) {
    reply
        .clearCookie(ACCESS_COOKIE, {
            ...BASE_COOKIE_OPTIONS,
        })
        .clearCookie(REFRESH_COOKIE, {
            ...BASE_COOKIE_OPTIONS,
        });
}
