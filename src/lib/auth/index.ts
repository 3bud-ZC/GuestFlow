import { Role } from "@prisma/client";

// Represents the authenticated user session structurally.
export interface SessionUser {
  id: string;
  email: string;
  role: Role;
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "./authOptions";
import { cache } from "react";

/**
 * getCurrentUser retrieves the currently authenticated user.
 */
export const getCurrentUser = cache(async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  return {
    id: (session.user as any).id,
    email: session.user.email as string,
    role: (session.user as any).role as Role,
  };
});

/**
 * requireAuthenticatedUser guarantees a valid SessionUser is returned,
 * or throws an error (which should be caught and redirected to login).
 */
export async function requireAuthenticatedUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * requireRole ensures the user is authenticated AND has one of the allowed roles.
 */
export async function requireRole(allowedRoles: Role[]): Promise<SessionUser> {
  const user = await requireAuthenticatedUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/**
 * can checks if a user has permission to perform an action.
 * Useful for fine-grained permissions beyond basic roles.
 */
export function can(user: SessionUser | null, action: string): boolean {
  if (!user) return false;
  
  if (user.role === Role.ADMIN) return true;

  if (user.role === Role.RECEPTION) {
    // Basic rules for reception
    if (action === "create:reservation" || action === "view:reservation") return true;
    if (action === "update:property_settings") return false;
  }

  return false;
}
