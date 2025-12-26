// modules/payment/payment.route.ts
import { FastifyInstance } from "fastify";
import * as c from "./transaction.controller";
import { verifyMerchantSignature } from "../../middleware/verifyMerchantSignature";
import { CreatePaymentInput } from "./transaction.type";

export default async function paymentRoutes(app: FastifyInstance) {
  app.post<{ Body: CreatePaymentInput }>("/payments", {
    preHandler: verifyMerchantSignature
  },
    c.createPayment);
  app.get("/payments/:id",


    c.getPayment);
  app.post("/webhook/xendit", c.webhookXendit);
}
