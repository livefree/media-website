import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRecoveryReadinessRecord,
  type RecoveryBackupArtifactRecord,
  type RestoreRehearsalRecord,
} from "./recovery-readiness";

function createBackupArtifact(overrides: Partial<RecoveryBackupArtifactRecord> = {}): RecoveryBackupArtifactRecord {
  return {
    id: "backup-1",
    artifactKey: "backup-2026-03-11T00-00-00Z",
    summary: "Nightly logical backup completed.",
    artifactRef: "backups/2026-03-11/atlas.dump",
    coverageScope: "catalog_runtime",
    completedAt: new Date("2026-03-11T00:00:00.000Z"),
    expiresAt: new Date("2026-03-18T00:00:00.000Z"),
    metadata: {
      objectCount: 12,
    },
    ...overrides,
  };
}

function createRestoreRehearsal(overrides: Partial<RestoreRehearsalRecord> = {}): RestoreRehearsalRecord {
  return {
    id: "restore-1",
    backupArtifactId: "backup-1",
    status: "succeeded",
    summary: "Restore rehearsal completed successfully.",
    notes: null,
    actorId: "operator-1",
    requestId: "restore-run-1",
    rehearsedAt: new Date("2026-03-10T12:00:00.000Z"),
    metadata: {
      restoredRows: 100,
    },
    ...overrides,
  };
}

test("recovery readiness is ready when backup and restore rehearsal are fresh", () => {
  const record = buildRecoveryReadinessRecord({
    checkedAt: new Date("2026-03-11T12:00:00.000Z"),
    backupArtifact: createBackupArtifact(),
    latestRestoreRehearsal: createRestoreRehearsal(),
  });

  assert.equal(record.state, "ready");
  assert.equal(record.reasonCode, "ready");
  assert.deepEqual(record.contributingReasonCodes, ["ready"]);
  assert.equal(record.backupAgeHours, 12);
  assert.equal(record.restoreAgeHours, 24);
});

test("recovery readiness blocks when no backup has been recorded", () => {
  const record = buildRecoveryReadinessRecord({
    checkedAt: new Date("2026-03-11T12:00:00.000Z"),
    latestRestoreRehearsal: createRestoreRehearsal(),
  });

  assert.equal(record.state, "blocked");
  assert.equal(record.reasonCode, "backup_missing");
  assert.deepEqual(record.contributingReasonCodes, ["backup_missing"]);
});

test("recovery readiness degrades when the latest backup is stale", () => {
  const record = buildRecoveryReadinessRecord({
    checkedAt: new Date("2026-03-11T12:00:00.000Z"),
    backupArtifact: createBackupArtifact({
      completedAt: new Date("2026-03-08T11:30:00.000Z"),
    }),
    latestRestoreRehearsal: createRestoreRehearsal(),
  });

  assert.equal(record.state, "degraded");
  assert.equal(record.reasonCode, "backup_stale");
  assert.ok(record.summary.includes("stale"));
  assert.deepEqual(record.contributingReasonCodes, ["backup_stale"]);
});

test("recovery readiness blocks on failed restore rehearsal with a distinct reason", () => {
  const record = buildRecoveryReadinessRecord({
    checkedAt: new Date("2026-03-11T12:00:00.000Z"),
    backupArtifact: createBackupArtifact(),
    latestRestoreRehearsal: createRestoreRehearsal({
      status: "failed",
      summary: "Restore rehearsal failed while replaying catalog indexes.",
    }),
  });

  assert.equal(record.state, "blocked");
  assert.equal(record.reasonCode, "restore_rehearsal_failed");
  assert.ok(record.summary.includes("failed"));
  assert.notEqual(record.reasonCode, "backup_stale");
});

test("recovery readiness preserves distinct degraded reasons when backup and rehearsal are both stale", () => {
  const record = buildRecoveryReadinessRecord({
    checkedAt: new Date("2026-03-30T12:00:00.000Z"),
    backupArtifact: createBackupArtifact({
      completedAt: new Date("2026-03-20T10:00:00.000Z"),
    }),
    latestRestoreRehearsal: createRestoreRehearsal({
      rehearsedAt: new Date("2026-03-01T10:00:00.000Z"),
    }),
  });

  assert.equal(record.state, "degraded");
  assert.equal(record.reasonCode, "backup_stale");
  assert.deepEqual(record.contributingReasonCodes, ["backup_stale", "restore_rehearsal_stale"]);
});

test("recovery readiness degrades on partial restore rehearsal without blocking backup freshness", () => {
  const record = buildRecoveryReadinessRecord({
    checkedAt: new Date("2026-03-11T12:00:00.000Z"),
    backupArtifact: createBackupArtifact(),
    latestRestoreRehearsal: createRestoreRehearsal({
      status: "partial",
      summary: "Restore rehearsal completed with warnings.",
    }),
  });

  assert.equal(record.state, "degraded");
  assert.equal(record.reasonCode, "restore_rehearsal_partial");
  assert.deepEqual(record.contributingReasonCodes, ["restore_rehearsal_partial"]);
});
