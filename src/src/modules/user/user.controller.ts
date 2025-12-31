import { FastifyReply, FastifyRequest } from "fastify";
import { userService } from "../../container";
import { CreateUserInput, UpdateUserInput } from "./user.types";

export async function createUser(
  req: FastifyRequest<{ Body: CreateUserInput }>,
  reply: FastifyReply
) {
  const result = await userService.create(req.body);
  if (!result.success) return reply.code(400).send(result);
  return reply.code(201).send(result);
}

export async function getUsers(
  _req: FastifyRequest,
  reply: FastifyReply
) {
  const data = await userService.findAll();
  return reply.send({ success: true, data });
}

export async function updateUser(
  req: FastifyRequest<{ Params: { user_id: string }; Body: UpdateUserInput }>,
  reply: FastifyReply
) {
  try {
    const data = await userService.update(req.params.user_id, req.body);
    return reply.send({ success: true, data });
  } catch {
    return reply.code(404).send({ success: false, message: "Data not found" });
  }
}

export async function deleteUser(
  req: FastifyRequest<{ Params: { user_id: string } }>,
  reply: FastifyReply
) {
  try {
    const data = await userService.delete(req.params.user_id);
    return reply.send({
      success: true,
      message: "User deleted (soft)",
      user_id: data.user_id,
    });
  } catch {
    return reply.code(404).send({
      success: false,
      message: "User not found or already deleted",
    });
  }
}
