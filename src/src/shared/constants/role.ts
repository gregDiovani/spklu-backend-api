// src/shared/constants/role.ts
export const ROLES = {
    SUPERUSER: "superuser",
    ADMIN: "admin",

} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];
