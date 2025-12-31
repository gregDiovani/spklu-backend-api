import { db } from "../../config/db";

export class UserRepository {
  create(payload: any) {
    return db.query(
      `SELECT spklu.create_user_access($1::jsonb) AS result`,
      [payload]
    );
  }

  findAll() {
    return db.query(`
      SELECT
        ua.user_id,
        ua.username,
        r.role_id,
        r.name AS role_name,
        ua.merchant_id,
        m.merchant_name,
        ua.created_at,
        ua.last_login_at
      FROM spklu.main_user_access ua
      LEFT JOIN spklu.master_roles r ON r.role_id = ua.role_id
      LEFT JOIN spklu.master_merchant m ON m.merchant_id = ua.merchant_id
      WHERE r.role_id <> 4
        AND m.deleted_at IS NULL
        AND ua.deleted_at IS NULL
      ORDER BY ua.created_at DESC
    `);
  }

  update(userId: string, payload: any) {
    return db.query(
      `
      WITH updated AS (
  UPDATE spklu.main_user_access
  SET
    merchant_id = $1,
    expired_at  = $2,
    updated_at  = NOW()
  WHERE user_id = $3
  RETURNING
    user_id,
    username,
    merchant_id,
    role_id
)
SELECT
  u.user_id,
  u.username,
  u.merchant_id,
  m.merchant_name,
  r.role_id,
  r.name AS role_name
FROM updated u
JOIN spklu.master_roles r
  ON r.role_id = u.role_id
LEFT JOIN spklu.master_merchant m
  ON m.merchant_id = u.merchant_id;
      `,
      [
        payload.merchant_id,
        payload.expired_at ?? null,
        userId,
      ]
    );
  }

  softDelete(userId: string) {
    return db.query(
      `
      UPDATE spklu.main_user_access
      SET deleted_at = NOW()
      WHERE user_id = $1
        AND deleted_at IS NULL
      RETURNING user_id
      `,
      [userId]
    );
  }
}
