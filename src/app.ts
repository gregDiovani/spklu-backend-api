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

  await app.register(compress, { global: true });
  app.register(cors, { origin: true, credentials: true });
  app.register(cookie, { secret: env.COOKIE_SECRET });
  app.register(helmet, { contentSecurityPolicy: false });
  app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

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


  app.get("/health", async () => ({ status: "ok", uptime: process.uptime() }));

  return app;
}
