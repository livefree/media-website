import test from "node:test";
import assert from "node:assert/strict";

import { requirePrivilegedAdminAccess, resolveAdminAccessFromValues } from "./access";

async function withAdminAccessStub<T>(role: string | undefined, fn: () => Promise<T>) {
  const previousRole = process.env.ADMIN_ACCESS_STUB_ROLE;
  const previousActorId = process.env.ADMIN_ACCESS_STUB_ACTOR_ID;

  if (role) {
    process.env.ADMIN_ACCESS_STUB_ROLE = role;
    process.env.ADMIN_ACCESS_STUB_ACTOR_ID = `${role}-test`;
  } else {
    delete process.env.ADMIN_ACCESS_STUB_ROLE;
    delete process.env.ADMIN_ACCESS_STUB_ACTOR_ID;
  }

  try {
    return await fn();
  } finally {
    if (previousRole) {
      process.env.ADMIN_ACCESS_STUB_ROLE = previousRole;
    } else {
      delete process.env.ADMIN_ACCESS_STUB_ROLE;
    }

    if (previousActorId) {
      process.env.ADMIN_ACCESS_STUB_ACTOR_ID = previousActorId;
    } else {
      delete process.env.ADMIN_ACCESS_STUB_ACTOR_ID;
    }
  }
}

test("resolveAdminAccessFromValues prefers explicit request identity over env fallback", () => {
  const resolved = resolveAdminAccessFromValues({
    headerRole: "admin",
    headerActorId: "header-admin",
    cookieRole: "operator",
    cookieActorId: "cookie-operator",
    envRole: "viewer",
    envActorId: "env-viewer",
  });

  assert.equal(resolved.role, "admin");
  assert.equal(resolved.actorId, "header-admin");
  assert.equal(resolved.source, "header");
  assert.equal(resolved.isAuthenticated, true);
});

test("requirePrivilegedAdminAccess accepts operator stub identity", async () => {
  await withAdminAccessStub("operator", async () => {
    const access = requirePrivilegedAdminAccess("operator");
    assert.equal(access.role, "operator");
    assert.equal(access.source, "env");
  });
});

test("requirePrivilegedAdminAccess denies anonymous identities", async () => {
  await withAdminAccessStub(undefined, async () => {
    await assert.rejects(async () => requirePrivilegedAdminAccess("operator"), {
      message: "Admin access requires an authenticated operator or admin identity.",
    });
  });
});

test("requirePrivilegedAdminAccess denies underprivileged viewer identities", async () => {
  await withAdminAccessStub("viewer", async () => {
    await assert.rejects(async () => requirePrivilegedAdminAccess("operator"), {
      message: "The current identity does not have sufficient admin privileges.",
    });
  });
});
