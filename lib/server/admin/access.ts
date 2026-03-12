import "server-only";

import { createRequire } from "node:module";

import { BackendError } from "../errors";

const require = createRequire(import.meta.url);

export const adminAccessRoles = ["viewer", "operator", "admin"] as const;

export type AdminAccessRole = (typeof adminAccessRoles)[number];

export type PrivilegedAdminRole = Extract<AdminAccessRole, "operator" | "admin">;

export interface ResolvedAdminAccess {
  actorId?: string | null;
  role?: AdminAccessRole | null;
  source: "header" | "cookie" | "env" | "missing";
  isAuthenticated: boolean;
}

const roleRank: Record<AdminAccessRole, number> = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

function normalizeRole(value?: string | null): AdminAccessRole | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "viewer" || normalized === "operator" || normalized === "admin") {
    return normalized;
  }

  return null;
}

function normalizeActorId(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function safeReadHeader(name: string): string | null {
  try {
    const nextHeaders = require("next/headers") as {
      headers: () => Headers;
    };
    return nextHeaders.headers().get(name);
  } catch {
    return null;
  }
}

function safeReadCookie(name: string): string | null {
  try {
    const nextHeaders = require("next/headers") as {
      cookies: () => {
        get(cookieName: string): { value: string } | undefined;
      };
    };
    return nextHeaders.cookies().get(name)?.value ?? null;
  } catch {
    return null;
  }
}

export function resolveAdminAccessFromValues(input: {
  headerRole?: string | null;
  headerActorId?: string | null;
  cookieRole?: string | null;
  cookieActorId?: string | null;
  envRole?: string | null;
  envActorId?: string | null;
} = {}): ResolvedAdminAccess {
  const headerRole = normalizeRole(input.headerRole);
  const cookieRole = normalizeRole(input.cookieRole);
  const envRole = normalizeRole(input.envRole);

  const role = headerRole ?? cookieRole ?? envRole;
  const source = headerRole ? "header" : cookieRole ? "cookie" : envRole ? "env" : "missing";
  const actorId =
    normalizeActorId(input.headerActorId) ??
    normalizeActorId(input.cookieActorId) ??
    normalizeActorId(input.envActorId) ??
    (role ? `stub-${role}` : null);

  return {
    actorId,
    role,
    source,
    isAuthenticated: Boolean(role),
  };
}

export function resolveCurrentAdminAccess(): ResolvedAdminAccess {
  return resolveAdminAccessFromValues({
    headerRole: safeReadHeader("x-media-admin-role"),
    headerActorId: safeReadHeader("x-media-admin-actor"),
    cookieRole: safeReadCookie("mw_admin_role"),
    cookieActorId: safeReadCookie("mw_admin_actor"),
    envRole: process.env.ADMIN_ACCESS_STUB_ROLE ?? null,
    envActorId: process.env.ADMIN_ACCESS_STUB_ACTOR_ID ?? null,
  });
}

export function hasSufficientAdminRole(
  role: AdminAccessRole | null | undefined,
  minimumRole: PrivilegedAdminRole = "operator",
): boolean {
  if (!role) {
    return false;
  }

  return roleRank[role] >= roleRank[minimumRole];
}

export function requirePrivilegedAdminAccess(minimumRole: PrivilegedAdminRole = "operator"): ResolvedAdminAccess {
  const access = resolveCurrentAdminAccess();

  if (!access.isAuthenticated || !access.role) {
    throw new BackendError("Admin access requires an authenticated operator or admin identity.", {
      status: 401,
      code: "admin_access_unauthorized",
    });
  }

  if (!hasSufficientAdminRole(access.role, minimumRole)) {
    throw new BackendError("The current identity does not have sufficient admin privileges.", {
      status: 403,
      code: "admin_access_forbidden",
    });
  }

  return access;
}
