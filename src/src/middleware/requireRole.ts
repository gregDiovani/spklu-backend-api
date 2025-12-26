// src/middleware/requireRole.ts
import { FastifyReply, FastifyRequest } from "fastify";
import type { UserRole } from "../shared/constants/role";

export function requireRole(allowedRoles: UserRole[]) {
    return async (req: FastifyRequest, reply: FastifyReply) => {
        if (!req.user || !req.user.role) {
            return reply.code(403).send({ error: "Forbidden" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return reply.code(403).send({
                error: "Forbidden",
                message: "Insufficient role",
            });
        }
    };
}
