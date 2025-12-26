// src/worker.ts
import pino from "pino";
import { redis } from "./config/redis";
import { paymentService } from "./container";

const logger = pino({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    transport:
        process.env.NODE_ENV !== "production"
            ? {
                target: "pino-pretty",
                options: { colorize: true },
            }
            : undefined,
});

async function startWorker() {
    logger.info("🚀 Payment worker started");

    while (true) {
        const result = await redis.brpop("xendit:webhook", 0);
        if (!result) continue;

        const raw = result[1];

        let payload: any;
        try {
            payload = JSON.parse(raw);
        } catch (err) {
            logger.error({ raw }, "Invalid webhook JSON");
            continue;
        }

        const ctx = {
            event: payload.event,
            external_id: payload.data?.external_id,
            payment_id: payload.data?.id,
        };

        logger.info(ctx, "Webhook job received");

        try {
            await paymentService.handleWebhook(payload);
            logger.info(ctx, "Webhook job completed");
        } catch (err) {
            logger.error(
                { ...ctx, err },
                "Webhook job failed,   to retry"
            );

            await redis.lpush("xendit:webhook:retry", raw);
        }
    }
}

startWorker();
