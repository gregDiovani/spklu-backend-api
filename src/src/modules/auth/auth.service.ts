// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import { AuthRepository } from "./auth.repository";

export class AuthService {
  constructor(private repo: AuthRepository) { }

  async findActiveUserByUsername(username: string) {
    return this.repo.findActiveUserByUsername(username);
  }

  async findUserById(userId: string) {
    return this.repo.findUserById(userId);
  }

  async verifyPassword(
    plain: string,
    hashed: string
  ): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  async saveRefreshToken(userId: string, token: string) {
    return this.repo.saveRefreshToken(userId, token);
  }

  async findValidRefreshToken(token: string) {
    return this.repo.findValidRefreshToken(token);
  }

  async revokeRefreshToken(token: string) {
    return this.repo.revokeRefreshToken(token);
  }

  async updateLastLoginAt(userId: string) {
    return this.repo.updateLastLoginAt(userId);
  }
}
