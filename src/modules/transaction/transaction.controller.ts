// modules/payment/payment.controller.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { paymentService } from "../../container";
import { env } from "../../config/env";
import { CreatePaymentInput, WebhookInput } from "./transaction.type";
import { redis } from "../../config/redis";
import { XenditQrPaymentWebhook } from "./webhook.type";

export async function createPayment(
  req: FastifyRequest<{ Body: CreatePaymentInput }>,
  reply: FastifyReply


) {
  const result = await paymentService.createPaymentQRIS(
    req.body  );
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
  req: FastifyRequest<{ Body: XenditQrPaymentWebhook }>,
  reply: FastifyReply
) {
  // 1️⃣ Verifikasi kalau memang xendit yang nembak
  if (req.headers["x-callback-token"] !== env.XENDIT_WEBHOOK_SECRET) {
    return reply.code(401).send({ success: false });
  }

  const body = req.body

  // console.log(body);

  const input = {
    externalId: body.qr_code.external_id,
    providerStatus: body.status,
    providerEventId: body.qr_code.id,
    payload: body,
  }


  redis.lpush(
    "xendit:webhook",
    JSON.stringify(input)
  );

  return reply.send({ success: true });



}