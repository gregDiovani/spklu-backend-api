import { PortfolioRepository } from "./portfolio.repository";

export class PortfolioService {
  constructor(private readonly repo: PortfolioRepository) {}

async getProjectExperience(limit = 5, page = 1) {

  if (page < 1) page = 1;
  if (limit < 1) limit = 5;

  const result = await this.repo.getPaginated(limit, page);

  if (!result) throw new Error("not found");

  return result;
}
}