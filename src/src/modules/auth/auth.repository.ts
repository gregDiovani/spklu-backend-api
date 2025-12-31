// src/modules/auth/auth.repository.ts
import { db } from "../../infrastructure/db/postgres";

export interface AuthUserRow {
  user_id: string;
  username: string;
  password: string;
  role_name: string;
}

export class AuthRepository {

  async findActiveUserByUsername(
    username: string
  ): Promise<AuthUserRow | null> {
    const { rows } = await db.query<AuthUserRow>(
      `
     SELECT u.user_id, u.username, u.role_id, u.password, r.name AS role_name
     FROM spklu.main_user_access u
     JOIN spklu.master_roles r ON r.role_id = u.role_id
     WHERE u.username = $1 AND u.expired_at IS NULL AND u.deleted_at IS NULL LIMIT 1
      `,
      [username]
    );

    return rows[0] ?? null;
  }

  async findUserById(userId: string) {
    const { rows } = await db.query(
      `
      SELECT
      u.user_id,
      u.username,
      u.role_id,
      r.name AS role_name
    FROM spklu.main_user_access u
    JOIN spklu.master_roles r ON r.role_id = u.role_id
    WHERE u.user_id = $1
      AND u.expired_at IS NULL
    LIMIT 1
      `,
      [userId]
    );

    return rows[0] ?? null;
  }

  async saveRefreshToken(userId: string, refreshToken: string) {
    await db.query(
      `
     INSERT INTO auth_refresh_token (user_id, token, expired_at) VALUES ($1, $2, now() + interval '7 days')
      `,
      [userId, refreshToken]
    );
  }

  async findValidRefreshToken(token: string) {
    const { rows } = await db.query(
      `
      SELECT user_id FROM auth_refresh_token WHERE token = $1 AND is_revoked = false AND expired_at > now() LIMIT 1
      `,
      [token]
    );

    return rows[0] ?? null;
  }

  async revokeRefreshToken(token: string) {
    await db.query(
      `
    UPDATE auth_refresh_token SET is_revoked = true WHERE token = $1
      `,
      [token]
    );
  }

  async updateLastLoginAt(userId: string) {
    await db.query(
      `
      UPDATE spklu.main_user_access
      SET last_login_at = NOW()
      WHERE user_id = $1
      `,
      [userId]
    );
  }
}
