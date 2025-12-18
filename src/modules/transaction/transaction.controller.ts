// modules/payment/payment.controller.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { paymentService } from "../../container";
import { env } from "../../config/env";
import { CreatePaymentInput, WebhookInput } from "./transaction.type";
import { redis } from "../../config/redis";

export async function createPayment(
  req: FastifyRequest<{ Body: CreatePaymentInput }>,
  reply: FastifyReply


) {
  const result = await paymentService.createPayment(
    req.body,
    env.INTERNAL_SECRET as string
  );
  return reply.send({ success: true, ...result });
}

export async function getPayment(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { rows } = await paymentService.getPayment(req.params.id);
  if (!rows.length) {
    return reply.code(404).send({ success: false });
  }
  return reply.send(rows[0]);
}

export async function webhookXendit(
  req: FastifyRequest,
  reply: FastifyReply
) {
  // 1️⃣ Verifikasi kalau memang xendit yang nembak
  if (req.headers["x-callback-token"] !== env.XENDIT_WEBHOOK_SECRET) {
    return reply.code(401).send({ success: false });
  }

  // 2️⃣ Normalize payload (HTTP → domain)
  const body: any = req.body;
  const data = body?.data ?? body ?? {};

  // body dari xenditnya 
  const input: WebhookInput = {
    externalId: data.reference_id ?? data.external_id ?? null,
    providerRef: data.id ?? null,
    providerStatus: String(data.status ?? "").trim(),
    providerEventId: data.id ?? null,
    payload: body,
  };


  await redis.lpush(
    "xendit:webhook",
    JSON.stringify(input)
  );

  return reply.send({ success: true });


  // // 3️⃣ Delegate to service
  // const result = await paymentService.handleWebhook(input);

  // // 4️⃣ HTTP response
  // return reply.send(result);
}