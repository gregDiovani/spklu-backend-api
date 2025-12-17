// modules/payment/payment.route.ts
import { FastifyInstance } from "fastify";
import * as c from "./transaction.controller";

export default async function paymentRoutes(app: FastifyInstance) {
  app.post("/payments", c.createPayment);
  app.get("/payments/:id", c.getPayment);
  app.post("/webhook/xendit", c.webhookXendit);
}
