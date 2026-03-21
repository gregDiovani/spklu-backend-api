import pino from 'pino';
import { redis } from './config/redis';
import { paymentService } from './container';
import { prisma } from './lib/prisma';

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: { colorize: true },
        }
      : undefined,
});

async function processRedisQueue() {
  while (true) {
    const result = await redis.brpop('xendit:webhook', 1);
    if (!result) break;

    const raw = result[1];
    try {
      const payload = JSON.parse(raw);
      await paymentService.handleWebhook(payload);
    } catch (err) {
      logger.error({ err }, 'Webhook job failed from Redis queue');
    }
  }
}

async function processDbFallback() {
  const events = await prisma.webhookEvent.findMany({
    where: { processed_at: null },
    orderBy: { created_at: 'asc' },
    take: 20,
  });

  for (const event of events) {
    try {
      const payload: any = event.payload;
      await paymentService.handleWebhook({
        transactionId: event.transaction_id,
        providerRef: payload?.qr_code?.id ?? null,
        providerStatus: payload?.status ?? 'PENDING',
        providerEventId: event.provider_event_id,
        payload,
      });
    } catch (err: any) {
      logger.error({ err, eventId: event.id }, 'DB fallback webhook failed');
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: { process_error: err?.message ?? 'failed' },
      });
    }
  }
}

async function loop() {
  logger.info('🚀 Prisma payment worker started');
  while (true) {
    await processRedisQueue();
    await processDbFallback();
    await paymentService.reconcilePending(20);
    await new Promise((r) => setTimeout(r, 60_000));
  }
}

loop();
