export type Role = "admin" | "client";

/** Custom claims set by the server (Admin SDK). Enforced by firestore.rules. */
export interface RoleClaims {
  role: Role | null;
  clientId: string | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  clientId: string | null;
  disabled: boolean;
}
