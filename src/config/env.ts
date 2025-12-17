
// config/env.ts
import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3000),
  DB_URL: process.env.DB_URL ?? "",
  COOKIE_SECRET: process.env.COOKIE_SECRET ?? "dev-secret",
  XENDIT_WEBHOOK_SECRET: process.env.XENDIT_WEBHOOK_SECRET ?? "dev-webhook",
  JWT_SECRET: process.env.JWT_SECRET,
  INTERNAL_SECRET: process.env.INTERNAL_SECRET,
  XENDIT_API_KEY: process.env.XENDIT_API_KEY,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER

};
