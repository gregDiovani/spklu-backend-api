import pg from "pg";
import { env } from "../../config/env";

export const db = new pg.Pool({
  connectionString: env.DB_URL,
});
