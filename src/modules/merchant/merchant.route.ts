// modules/merchant/merchant.route.ts
import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/requireAuth";
import * as c from "./merchant.controller";

export default async function merchantRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.post("/", c.createMerchant);


  app.post("/:id/rotate-token", c.createnewMerchantSecret);

  app.get("/", c.getMyMerchants);
  app.put("/:id", c.updateMerchant);
  app.delete("/:id", c.deleteMerchant);
  app.delete("/:id/force", c.forceDeleteMerchant);

  app.get("/dashboard", c.dashboard);
  app.get("/:id/transaction", c.transactions);
  app.get("/:id/chargers", c.chargers);

  app.post("/:id/charger", c.createCharger);
  app.put("/:id/charger/:chargerId", c.updateCharger);
  app.delete("/:id/charger/:chargerId", c.deleteCharger);
}
