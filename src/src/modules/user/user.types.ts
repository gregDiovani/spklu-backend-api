export interface CreateUserInput {
  merchant_id: string | null;
  role_id: number;
  username: string;
  password: string;
  expired_at?: string | null;
}

export interface UpdateUserInput {
  merchant_id: string | null;
  role_id: number;
  username: string;
  expired_at?: string | null;
}
