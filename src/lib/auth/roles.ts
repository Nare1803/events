/**
 * V1 roles. SUPER_ADMIN and STAFF work in the studio (/admin). CUSTOMER is
 * reserved for a future customer portal; in V1 customers use private review
 * links and never need an account. A CUSTOMER_EDITOR role can be added later.
 */
export const ROLES = ["SUPER_ADMIN", "STAFF", "CUSTOMER"] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: readonly Role[] = ["SUPER_ADMIN", "STAFF"];

export const isStaffRole = (role: string): boolean => (STAFF_ROLES as readonly string[]).includes(role);
export const isSuperAdmin = (role: string): boolean => role === "SUPER_ADMIN";
