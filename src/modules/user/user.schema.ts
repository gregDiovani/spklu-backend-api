export const createUserSchema = {
  body: {
    type: "object",
    required: ["role_id", "username", "password"],
    properties: {
      role_id: { type: "number" },
      username: { type: "string" },
      password: { type: "string", minLength: 6 },
      expired_at: { type: ["string", "null"] },
    },
  },
};

export const updateUserSchema = {
  body: {
    type: "object",
    required: ["merchant_id", "role_id",],
    properties: {
      merchant_id: { type: ["string", "null"] },
      role_id: { type: "number" },
      expired_at: { type: ["string", "null"] },
    },
  },
};
