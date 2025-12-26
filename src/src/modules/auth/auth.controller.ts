// modules/auth/auth.controller.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { authService } from "../../container";

import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../../lib/token";
import {
  setAuthCookies,
  clearAuthCookies,
} from "../../lib/cookie";

/* ======================
   LOGIN
====================== */
export async function loginController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { username, password, client_type } = req.body as any;

  if (!username || !password) {
    return reply.code(400).send({ ok: false });
  }

  const user = await authService.findActiveUserByUsername(username);
  if (!user) {
    return reply.code(401).send({
      ok: false,
      message: "Invalid credentials",
    });
  }

  const isValid = await authService.verifyPassword(password, user.password);
  if (!isValid) {
    return reply.code(401).send({
      ok: false,
      message: "Invalid credentials",
    });
  }

  await authService.updateLastLoginAt(user.user_id);

  const accessToken = createAccessToken({
    uid: user.user_id,
    username: user.username,
    role: user.role_name,
  });

  const refreshToken = createRefreshToken({
    uid: user.user_id,
    type: "refresh",
  });

  await authService.saveRefreshToken(user.user_id, refreshToken);

  // 🌐 WEB (COOKIE)
  if (client_type === "web") {
    setAuthCookies(reply, accessToken, refreshToken);
    return reply.send({
      ok: true,
      user: {
        id: user.user_id,
        username: user.username,
        role: user.role_name,
      },
    });
  }

  // 📱 MOBILE / POSTMAN
  return reply.send({
    ok: true,
    tokens: { accessToken, refreshToken },
  });
}

/* ======================
   REFRESH TOKEN
====================== */
export async function refreshController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const refreshToken =
    req.cookies?.sb_refresh_token ||
    (req.body as any)?.refresh_token;

  if (!refreshToken) {
    return reply.code(401).send({
      ok: false,
      error: "No refresh token",
    });
  }

  try {
    verifyRefreshToken(refreshToken);
  } catch {
    return reply.code(401).send({
      ok: false,
      error: "Invalid refresh token",
    });
  }

  const tokenRow = await authService.findValidRefreshToken(refreshToken);
  if (!tokenRow) {
    return reply.code(401).send({
      ok: false,
      error: "Refresh revoked",
    });
  }

  const user = await authService.findUserById(tokenRow.user_id);
  if (!user) {
    return reply.code(401).send({
      ok: false,
      error: "User not found",
    });
  }

  const newAccessToken = createAccessToken({
    uid: user.user_id,
    username: user.username,
    role: user.role_name,
  });

  const newRefreshToken = createRefreshToken({
    uid: user.user_id,
    type: "refresh",
  });

  await authService.revokeRefreshToken(refreshToken);
  await authService.saveRefreshToken(user.user_id, newRefreshToken);

  // 🌐 COOKIE MODE
  if (req.cookies?.sb_refresh_token) {
    setAuthCookies(reply, newAccessToken, newRefreshToken);
    return reply.send({ ok: true });
  }

  // 📱 MOBILE
  return reply.send({
    ok: true,
    tokens: {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    },
  });
}

/* ======================
   LOGOUT
====================== */
export async function logoutController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const token = req.cookies?.sb_refresh_token;
  if (token) {
    await authService.revokeRefreshToken(token);
  }

  clearAuthCookies(reply);
  return reply.send({ ok: true });
}

/* ======================
   ME
====================== */
export async function meController(
  req: FastifyRequest & { user?: any },
  reply: FastifyReply
) {
  const user = req.user!;
  return reply.send({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
}

