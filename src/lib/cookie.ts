// lib/cookie.ts
import { FastifyReply } from "fastify";

export function setAuthCookies(
    reply: FastifyReply,
    accessToken: string,
    refreshToken: string
) {
    reply
        .setCookie("sb_access_token", accessToken, {
            httpOnly: true,
            sameSite: "strict",
            path: "/",
        })
        .setCookie("sb_refresh_token", refreshToken, {
            httpOnly: true,
            sameSite: "strict",
            path: "/",
        });
}

export function clearAuthCookies(reply: FastifyReply) {
    reply
        .clearCookie("sb_access_token", { path: "/" })
        .clearCookie("sb_refresh_token", { path: "/" });
}
