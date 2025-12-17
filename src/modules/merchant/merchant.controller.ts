// modules/merchant/merchant.controller.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { merchantService } from "../../container";

export async function createMerchant(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const callerId = req.user!.id;
  const result = await merchantService.create(req.body, callerId);

  if (!result?.success) {
    if ((result?.message || "").includes("already exists"))
      return reply.code(409).send(result);
    return reply.code(400).send(result);
  }

  return reply.code(201).send(result);
}

export async function getMyMerchants(
  req: FastifyRequest<{ Querystring: { limit?: number; page?: number } }>,
  reply: FastifyReply
) {
  const callerId = req.user!.id;
  const limit = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;

  const result = await merchantService.getMyMerchants(callerId, limit, page);
  return reply.send(result);
}

export async function updateMerchant(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const result = await merchantService.update(
    req.params.id,
    req.body,
    req.user!.id
  );
  return reply.send(result);
}

export async function deleteMerchant(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  return reply.send(
    await merchantService.delete(req.params.id, req.user!.id)
  );
}

export async function forceDeleteMerchant(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  return reply.send(
    await merchantService.forceDelete(req.params.id, req.user!.id)
  );
}

export async function dashboard(
  req: FastifyRequest,
  reply: FastifyReply
) {
  return reply.send(
    await merchantService.dashboard(req.user!.id)
  );
}

export async function transactions(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const data = await merchantService.transactions(req.params.id);
  return reply.send({ success: true, data });
}

export async function chargers(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const data = await merchantService.chargers(req.params.id);
  return reply.send({ success: true, data });
}

export async function createCharger(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const payload = {
    ...(req.body as Record<string, unknown>),

    merchant_id: req.params.id,
    caller_id: req.user!.id,
  };

  return reply.code(201).send(
    await merchantService.createCharger(payload)
  );
}

export async function updateCharger(
  req: FastifyRequest<{ Params: { chargerId: string } }>,
  reply: FastifyReply
) {
  const payload = {
    ...(req.body as Record<string, unknown>),
    caller_id: req.user!.id
  };
  return reply.send(
    await merchantService.updateCharger(req.params.chargerId, payload)
  );
}

export async function deleteCharger(
  req: FastifyRequest<{ Params: { chargerId: string } }>,
  reply: FastifyReply
) {
  return reply.send(
    await merchantService.deleteCharger({
      charger_id: req.params.chargerId,
      caller_id: req.user!.id,
    })
  );
}
