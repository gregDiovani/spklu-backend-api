import { FastifyInstance } from "fastify";
import * as c from "./user.controller";
import { createUserSchema, updateUserSchema } from "./user.schema";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";

export default async function userRoutes(app: FastifyInstance) {
  app.addHook(
    "preHandler",
    async (req, reply) => {
      await requireAuth(req, reply);
      await requireRole(["superuser"])(req, reply);
    }
  );

  app.post("/", { schema: createUserSchema }, c.createUser);
  app.get("/", c.getUsers);
  app.put("/:user_id", { schema: updateUserSchema }, c.updateUser);
  app.delete("/:user_id", c.deleteUser);
}

