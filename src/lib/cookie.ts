import { FastifyReply } from "fastify";

/* =========================
   COOKIE CONSTANTS
========================= */
export const ACCESS_COOKIE = "sb_access_token";
export const REFRESH_COOKIE = "sb_refresh_token";

const BASE_COOKIE_OPTIONS = {
    httpOnly: true as const,
    sameSite: "strict" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
};

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
        .clearCookie(ACCESS_COOKIE, { path: "/" })
        .clearCookie(REFRESH_COOKIE, { path: "/" });
}
