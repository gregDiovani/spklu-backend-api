
// config/env.ts
import dotenv from "dotenv";

dotenv.config({
  path:
    process.env.NODE_ENV === "production"
      ? ".env.prod"
      : ".env.dev",
});


export const env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: Number(process.env.PORT ?? 3000),
  DB_URL: process.env.DB_URL ?? "",
  COOKIE_SECRET: process.env.COOKIE_SECRET ?? "dev-secret",
  XENDIT_WEBHOOK_SECRET: process.env.XENDIT_WEBHOOK_SECRET ?? "dev-webhook",
  ACCESS_SECRET: process.env.ACCESS_SECRET,
  REFRESH_SECRET: process.env.REFRESH_SECRET,
  INTERNAL_SECRET: process.env.INTERNAL_SECRET,
  XENDIT_API_KEY: process.env.XENDIT_API_KEY,
  MASTER_KEY: process.env.MASTER_KEY


};


