// src/worker.ts

import { redis } from "./config/redis";
import { paymentService } from "./container";

async function startWorker() {
    console.log("🚀 Payment worker started");

    while (true) {
        const result = await redis.brpop("xendit:webhook", 0);
        if (!result) continue;

        const input = JSON.parse(result[1]);

        try {
            await paymentService.handleWebhook(input);
        } catch (err) {
            console.error("Webhook job failed", err);

            await redis.lpush(
                "xendit:webhook:retry",
                JSON.stringify(input)
            );
        }
    }
}

startWorker();
