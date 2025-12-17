import { FastifyInstance } from "fastify";

// modules/auth/auth.route.ts
import {
  loginController,
  refreshController,
  meController,
  logoutController,
} from "./auth.controller";
import { requireAuth } from "../../middleware/requireAuth";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/login", loginController);
  app.post("/refresh", refreshController);

  app.get(
    "/me",
    { preHandler: requireAuth },
    meController
  );

  app.post("/logout", logoutController);
}
