import test from "node:test";
import assert from "node:assert/strict";

import { BackendError } from "../server/errors";

import {
  assertMigrationPreflightReady,
  getMigrationPreflightRecord,
  type RuntimeMigrationStateRecord,
} from "./migration-safety";

const schemaText = `
model Example {
  id String @id
}
`;

function createRuntimeState(overrides: Partial<RuntimeMigrationStateRecord> = {}): RuntimeMigrationStateRecord {
  return {
    target: "published_catalog_runtime",
    schemaDigest: "override-me",
    rolloutState: "ready",
    summary: "Ready for rollout.",
    updatedBy: "operator-1",
    metadata: {
      rolloutTicket: "ops-123",
    },
    createdAt: new Date("2026-03-11T10:00:00.000Z"),
    updatedAt: new Date("2026-03-11T11:00:00.000Z"),
    ...overrides,
  };
}

test("migration preflight passes when metadata is ready and schema digest matches", async () => {
  const ready = await getMigrationPreflightRecord("published_catalog_runtime", {
    schemaText,
    loadRuntimeState: async () => {
      const record = await getMigrationPreflightRecord("published_catalog_runtime", {
        schemaText,
        loadRuntimeState: async () => createRuntimeState(),
      });

      return createRuntimeState({
        schemaDigest: record.expectedSchemaDigest,
      });
    },
  });

  assert.equal(ready.status, "ready");
  assert.equal(ready.reasonCode, "ready");
  assert.equal(ready.metadata?.rolloutState, "ready");
});

test("migration preflight blocks when rollout metadata is present but incompatible", async () => {
  const blocked = await getMigrationPreflightRecord("published_catalog_runtime", {
    schemaText,
    loadRuntimeState: async () =>
      createRuntimeState({
        schemaDigest: "stale-digest",
        rolloutState: "ready",
        summary: "Still on the previous rollout.",
      }),
  });

  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.reasonCode, "schema_digest_mismatch");
  assert.equal(blocked.metadata?.summary, "Still on the previous rollout.");
});

test("assertMigrationPreflightReady throws a safe backend error when rollout is blocked", async () => {
  await assert.rejects(
    () =>
      assertMigrationPreflightReady("published_catalog_runtime", {
        schemaText,
        loadRuntimeState: async () =>
          createRuntimeState({
            schemaDigest: "stale-digest",
            rolloutState: "blocked",
            summary: "Manual rollout hold is active.",
          }),
      }),
    (error: unknown) => {
      assert.ok(error instanceof BackendError);
      assert.equal(error.code, "migration_preflight_blocked");
      assert.equal(error.status, 503);
      assert.equal((error.details as { reasonCode?: string } | undefined)?.reasonCode, "rollout_blocked");
      return true;
    },
  );
});
