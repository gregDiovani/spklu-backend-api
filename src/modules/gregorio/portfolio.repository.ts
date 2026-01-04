import { Pool } from "pg";

export class PortfolioRepository {
  constructor(private readonly db: Pool) {}

 async getPaginated(limit: number, page: number) {

  const res = await this.db.query(
    `SELECT get_paginated_project_experiencev2($1,$2) AS result`,
    [limit, page]
  );

  return res.rows[0].result;
}
}
