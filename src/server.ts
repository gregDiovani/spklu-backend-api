import { buildApp } from "./app";
import { env } from "./config/env";

async function start() {
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: "0.0.0.0" });

  const shutdown = async () => {
    app.log.info("Shutting down...");
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start();
