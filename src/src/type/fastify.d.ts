// src/types/fastify.d.ts
import "fastify";
import { UserRole } from "../shared/constants/role";



declare module "fastify" {
    interface FastifyRequest {
        user?: {
            id: string;
            username: string;
            role: UserRole;
        };
    }
}
