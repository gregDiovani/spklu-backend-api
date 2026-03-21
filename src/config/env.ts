
// config/env.ts
import dotenv from "dotenv";

dotenv.config({
  path:
    process.env.NODE_ENV === "production"
      ? ".env.prod"
      : ".env.dev",
});

if (!process.env.REDIS_HOST) {
  throw new Error("REDIS_HOST is missing");
}



export const env = {
  NODE_ENV: process.env.NODE_ENV,
  BASE_URL: process.env.BASE_URL ?? "http://localhost:5000",
  PORT: Number(process.env.PORT ?? 3000),
  DB_URL: process.env.DB_URL ?? "",
  DB_URL_DEFAULT: process.env.DB_URL_DEFAULT ?? "",
  COOKIE_SECRET: process.env.COOKIE_SECRET ?? "dev-secret",
  XENDIT_WEBHOOK_SECRET: process.env.XENDIT_WEBHOOK_SECRET ?? "dev-webhook",
  ACCESS_SECRET: process.env.ACCESS_SECRET,
  REFRESH_SECRET: process.env.REFRESH_SECRET,
  INTERNAL_SECRET: process.env.INTERNAL_SECRET,
  XENDIT_API_KEY: process.env.XENDIT_API_KEY,
  MASTER_KEY: process.env.MASTER_KEY,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_PORT: Number(process.env.REDIS_PORT ?? 6379),
  REDIS_URL: process.env.REDIS_URL,





};


