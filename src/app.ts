import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env";
import compress from "@fastify/compress";

import authRoutes from "./modules/auth/auth.route";
import merchantRoutes from "./modules/merchant/merchant.route";
import transactionRoutes from "./modules/transaction/transaction.route";
import paymentRoutes from "./modules/transaction/transaction.route";
import userRoutes from "./modules/user/user.route";
import { db } from "./config/db";
import { redis } from "./config/redis";
import portfolioRoutes from "./modules/gregorio/portofolio.route";


export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",

      transport:
        env.NODE_ENV !== "production"
          ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname",
            },
          }
          : undefined,
    },
  });



  app.addHook("onSend", async (req, reply) => {
    if (req.url.startsWith("/portfolio/files")) {
      reply.header("Cross-Origin-Resource-Policy", "cross-origin");
    }
  });

  // CORS untuk API
  app.register(cors, {
    origin: [
      "https://gregdiovani.my.id",
      "https://dashboard.qunangqunang.com",
    ],
    credentials: true,
  });


  app.register(cookie, { secret: env.COOKIE_SECRET });
  app.register(helmet, { contentSecurityPolicy: false });
  app.register(rateLimit, {
    redis,                 // 🔥 INI KUNCI
    max: 100,
    timeWindow: "1 minute",
  });
  app.setErrorHandler((error, _req, reply) => {
    app.log.error(error);
    reply.code((error as any).statusCode ?? 500).send({
      success: false,
      message: env.NODE_ENV === "production" ? "Internal Server Error" : error.message,
    });
  });



  app.register(authRoutes, { prefix: "/auth" });
  app.register(merchantRoutes, { prefix: "/merchant" });
  app.register(transactionRoutes, { prefix: "/transaction" });
  app.register(paymentRoutes, { prefix: "/payment" });
  app.register(userRoutes, { prefix: "/user" });

  app.register(portfolioRoutes, { prefix: "/portfolio" });



  app.get("/health", async () => {
    const start = Date.now();

    // DB check
    let dbStatus = "ok";
    try {
      await db.query("SELECT 1");
    } catch (e) {
      dbStatus = "error";
    }

    // Redis check
    let redisStatus = "ok";
    try {
      const pong = await redis.ping();
      if (pong !== "PONG") redisStatus = "error";
    } catch (e) {
      redisStatus = "error";
    }

    return {
      status: dbStatus === "ok" && redisStatus === "ok" ? "ok" : "degraded",
      uptime: process.uptime(),
      responseTimeMs: Date.now() - start,
      services: {
        api: "ok",
        db: dbStatus,
        redis: redisStatus,
      },
    };
  });


  app.setErrorHandler((error, request, reply) => {
    request.log.error(
      {
        err: error,
        url: request.url,
        method: request.method,
        body: request.body,
        params: request.params,
        query: request.query,
      },
      'Unhandled error'
    );

    reply.code(500).send({
      success: false,
      message: 'Internal Server Error',
    });
  });
  return app;
}
