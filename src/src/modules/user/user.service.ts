import bcrypt from "bcrypt";
import { UserRepository } from "./user.repository";
import { CreateUserInput, UpdateUserInput } from "./user.types";

export class UserService {
  constructor(private repo: UserRepository) {}

  async create(input: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(input.password, 10);

    const payload = {
      merchant_id: input.merchant_id,
      role_id: input.role_id,
      username: input.username,
      password: hashedPassword,
      expired_at: input.expired_at ?? null,
    };

    const { rows } = await this.repo.create(payload);
    return rows[0].result;
  }

  async findAll() {
    const { rows } = await this.repo.findAll();
    return rows;
  }

  async update(userId: string, input: UpdateUserInput) {
    const { rows } = await this.repo.update(userId, input);
    if (!rows.length) throw new Error("NOT_FOUND");
    return rows[0];
  }

  async delete(userId: string) {
    const result = await this.repo.softDelete(userId);
    if (result.rowCount === 0) throw new Error("NOT_FOUND");
    return result.rows[0];
  }
}
