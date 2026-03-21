import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify/types/request";
import { portfolioFileService, portfolioService } from "../../container";
import { FileService } from "./file.sertvice";
import { env } from "../../config/env";

type PortfolioQuery = {
  page?: string;
  limit?: string;
};

type FileParams = {
  name: string;
};


export async function getProject(
  req: FastifyRequest<{ Querystring: PortfolioQuery }>,
  reply: FastifyReply
) {
  try {
    let page = Number(req.query?.page ?? 1);
    let limit = Number(req.query?.limit ?? 5);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 5;

    const result = await portfolioService.getProjectExperience(limit, page);


    const mapped = result.data.map((item: any) => ({
      ...item,
      image_url: `${env.BASE_URL}/uploads/${item.image_url}`
    }));


    reply.send({
      success: true,
      message: "Featured projects fetched successfully",
      data: mapped,
    });

  } catch (err: any) {
    reply.code(500).send({
      success: false,
      message: err?.message ?? "Internal server error"
    });
  }
}


export async function showFile(
  req: FastifyRequest<{ Params: FileParams }>,
  reply: FastifyReply
) {
  const { name } = req.params;

  if (!name || name.includes("..")) {
    return reply.code(400).send({ message: "Invalid path" });
  }

  return reply.send({
    url: `https://api.gregdiovani.my.id/uploads/${encodeURIComponent(name)}`,
  });
}