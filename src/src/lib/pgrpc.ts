// src/utils/pgRpc.ts
import { db } from "../config/db";

/**
 * callRpc
 * @param fn postgres function name (schema.function)
 * @param params array of params
 */
export async function callRpc<T = any>(
    fn: string,
    params: any[] = []
): Promise<T> {
    const placeholders = params.map((_, i) => `$${i + 1}`).join(", ");

    const sql = `SELECT ${fn}(${placeholders}) AS result`;

    const { rows } = await db.query(sql, params);

    return rows[0]?.result;
}
