import test from "node:test";
import assert from "node:assert/strict";

import { buildIngestLaunchValidationEvidence } from "../server/ingest/launch-validation";
import { buildFinalLaunchValidationRecord } from "./final-launch-validation";

test("final launch validation is ready when all launch domains are healthy", () => {
  const record = buildFinalLaunchValidationRecord({
    checkedAt: new Date("2026-03-12T12:00:00.000Z"),
    ingestValidation: buildIngestLaunchValidationEvidence({
      checkedAt: new Date("2026-03-12T12:00:00.000Z"),
      acceptedProviderLane: {
        providerKey: "jszyapi_vod_json",
        adapterKey: "jszyapi_vod_json",
        displayName: "jszyapi Base VOD JSON",
        accepted: true,
      },
      providerExecution: {
        lastSuccessfulPageIngestAt: new Date("2026-03-12T11:30:00.000Z"),
      },
      schedule: {
        enabled: true,
        lastIncrementalCompletedAt: new Date("2026-03-12T11:35:00.000Z"),
        lastBackfillCompletedAt: new Date("2026-03-11T12:00:00.000Z"),
      },
      queueTelemetry: {
        failures: [],
      },
      probeRecovery: {
        latestRefreshObservedAt: new Date("2026-03-12T11:45:00.000Z"),
        latestRefreshObservedState: "healthy",
        latestProbeObservedAt: new Date("2026-03-12T11:50:00.000Z"),
        latestProbeObservedState: "healthy",
        openRepairCount: 0,
      },
    }),
    catalogEvidence: {
      adminPublishedCount: 1,
      publicPublishedCount: 1,
      sampleMediaPublicId: "med_public_1",
      sampleMediaTitle: "Northline Station",
      sampleCanonicalWatchHref: "/watch?v=med_public_1",
      sampleDetailAvailable: true,
      sampleWatchAvailable: true,
      sampleSourceResolutionReason: "preferred_healthy",
      sampleSelectedResourceHealthState: "healthy",
    },
    healthEvidence: {
      queueFailureCount: 0,
      failedQueueFailureCount: 0,
      retryingQueueFailureCount: 0,
      openRepairCount: 0,
      inProgressRepairCount: 0,
      waitingProviderRepairCount: 0,
    },
    adminAccessEvidence: {
      currentActorId: "operator-test",
      currentRole: "operator",
      currentSource: "env",
      privilegedSessionValidated: true,
      anonymousDenied: true,
      viewerDenied: true,
      operatorAllowed: true,
    },
    migrationPreflight: {
      target: "published_catalog_runtime",
      status: "ready",
      reasonCode: "ready",
      summary: "Ready.",
      expectedSchemaDigest: "digest-123",
      checkedAt: new Date("2026-03-12T12:00:00.000Z"),
      metadata: null,
    },
    recoveryReadiness: {
      state: "ready",
      reasonCode: "ready",
      summary: "Recovery readiness is healthy.",
      checkedAt: new Date("2026-03-12T12:00:00.000Z"),
      policy: {
        backupMaxAgeHours: 48,
        restoreMaxAgeHours: 336,
      },
      backupArtifact: {
        id: "backup-1",
        artifactKey: "backup-2026-03-12",
        summary: "Nightly backup completed.",
        completedAt: new Date("2026-03-12T09:00:00.000Z"),
      },
      latestRestoreRehearsal: {
        id: "restore-1",
        backupArtifactId: "backup-1",
        status: "succeeded",
        summary: "Restore rehearsal completed successfully.",
        rehearsedAt: new Date("2026-03-10T09:00:00.000Z"),
      },
      contributingReasonCodes: ["ready"],
      backupAgeHours: 3,
      restoreAgeHours: 51,
    },
  });

  assert.equal(record.state, "ready");
  assert.equal(record.reasonCode, "ready");
  assert.deepEqual(record.contributingReasonCodes, ["ready"]);
  assert.deepEqual(
    record.domains.map((domain) => ({ domain: domain.domain, state: domain.state, reasonCode: domain.reasonCode })),
    [
      { domain: "ingest", state: "ready", reasonCode: "ready" },
      { domain: "catalog_publishing", state: "ready", reasonCode: "ready" },
      { domain: "source_health", state: "ready", reasonCode: "ready" },
      { domain: "admin_access", state: "ready", reasonCode: "ready" },
      { domain: "guardrails", state: "ready", reasonCode: "ready" },
    ],
  );
});

test("final launch validation blocks when migration safety or catalog launch evidence is missing", () => {
  const record = buildFinalLaunchValidationRecord({
    checkedAt: new Date("2026-03-12T12:00:00.000Z"),
    ingestValidation: buildIngestLaunchValidationEvidence({
      checkedAt: new Date("2026-03-12T12:00:00.000Z"),
      acceptedProviderLane: {
        providerKey: "jszyapi_vod_json",
        adapterKey: "jszyapi_vod_json",
        displayName: "jszyapi Base VOD JSON",
        accepted: true,
      },
      providerExecution: {
        lastSuccessfulPageIngestAt: new Date("2026-03-12T11:30:00.000Z"),
      },
      schedule: {
        enabled: true,
        lastIncrementalCompletedAt: new Date("2026-03-12T11:35:00.000Z"),
      },
      queueTelemetry: {
        failures: [],
      },
      probeRecovery: {
        latestProbeObservedAt: new Date("2026-03-12T11:50:00.000Z"),
        latestProbeObservedState: "healthy",
        openRepairCount: 0,
      },
    }),
    catalogEvidence: {
      adminPublishedCount: 0,
      publicPublishedCount: 0,
      sampleDetailAvailable: false,
      sampleWatchAvailable: false,
    },
    healthEvidence: {
      queueFailureCount: 1,
      failedQueueFailureCount: 1,
      retryingQueueFailureCount: 0,
      openRepairCount: 0,
      inProgressRepairCount: 0,
      waitingProviderRepairCount: 0,
    },
    adminAccessEvidence: {
      currentActorId: "operator-test",
      currentRole: "operator",
      currentSource: "env",
      privilegedSessionValidated: true,
      anonymousDenied: true,
      viewerDenied: true,
      operatorAllowed: true,
    },
    migrationPreflight: {
      target: "published_catalog_runtime",
      status: "blocked",
      reasonCode: "schema_digest_mismatch",
      summary: "Schema mismatch.",
      expectedSchemaDigest: "digest-123",
      checkedAt: new Date("2026-03-12T12:00:00.000Z"),
      metadata: null,
    },
    recoveryReadiness: {
      state: "ready",
      reasonCode: "ready",
      summary: "Recovery readiness is healthy.",
      checkedAt: new Date("2026-03-12T12:00:00.000Z"),
      policy: {
        backupMaxAgeHours: 48,
        restoreMaxAgeHours: 336,
      },
      backupArtifact: {
        id: "backup-1",
        artifactKey: "backup-2026-03-12",
        summary: "Nightly backup completed.",
        completedAt: new Date("2026-03-12T09:00:00.000Z"),
      },
      latestRestoreRehearsal: {
        id: "restore-1",
        status: "succeeded",
        summary: "Restore rehearsal completed successfully.",
        rehearsedAt: new Date("2026-03-10T09:00:00.000Z"),
      },
      contributingReasonCodes: ["ready"],
      backupAgeHours: 3,
      restoreAgeHours: 51,
    },
  });

  assert.equal(record.state, "blocked");
  assert.equal(record.reasonCode, "catalog_publish_path_missing");
  assert.deepEqual(record.contributingReasonCodes, ["catalog_publish_path_missing", "source_watch_contract_missing", "migration_preflight_blocked"]);
});

test("final launch validation degrades when source health and recovery guardrails are degraded", () => {
  const record = buildFinalLaunchValidationRecord({
    checkedAt: new Date("2026-03-12T12:00:00.000Z"),
    ingestValidation: buildIngestLaunchValidationEvidence({
      checkedAt: new Date("2026-03-12T12:00:00.000Z"),
      acceptedProviderLane: {
        providerKey: "jszyapi_vod_json",
        adapterKey: "jszyapi_vod_json",
        displayName: "jszyapi Base VOD JSON",
        accepted: true,
      },
      providerExecution: {
        lastSuccessfulPageIngestAt: new Date("2026-03-12T11:30:00.000Z"),
      },
      schedule: {
        enabled: true,
        lastIncrementalCompletedAt: new Date("2026-03-12T11:35:00.000Z"),
      },
      queueTelemetry: {
        failures: [],
      },
      probeRecovery: {
        latestProbeObservedAt: new Date("2026-03-12T11:50:00.000Z"),
        latestProbeObservedState: "healthy",
        openRepairCount: 0,
      },
    }),
    catalogEvidence: {
      adminPublishedCount: 2,
      publicPublishedCount: 1,
      sampleMediaPublicId: "med_public_1",
      sampleMediaTitle: "Northline Station",
      sampleCanonicalWatchHref: "/watch?v=med_public_1",
      sampleDetailAvailable: true,
      sampleWatchAvailable: true,
      sampleSourceResolutionReason: "preferred_degraded",
      sampleSelectedResourceHealthState: "degraded",
    },
    healthEvidence: {
      queueFailureCount: 1,
      failedQueueFailureCount: 0,
      retryingQueueFailureCount: 1,
      openRepairCount: 2,
      inProgressRepairCount: 1,
      waitingProviderRepairCount: 0,
    },
    adminAccessEvidence: {
      currentActorId: "operator-test",
      currentRole: "operator",
      currentSource: "env",
      privilegedSessionValidated: true,
      anonymousDenied: true,
      viewerDenied: true,
      operatorAllowed: true,
    },
    migrationPreflight: {
      target: "published_catalog_runtime",
      status: "ready",
      reasonCode: "ready",
      summary: "Ready.",
      expectedSchemaDigest: "digest-123",
      checkedAt: new Date("2026-03-12T12:00:00.000Z"),
      metadata: null,
    },
    recoveryReadiness: {
      state: "degraded",
      reasonCode: "backup_stale",
      summary: "Recovery readiness is degraded.",
      checkedAt: new Date("2026-03-12T12:00:00.000Z"),
      policy: {
        backupMaxAgeHours: 48,
        restoreMaxAgeHours: 336,
      },
      backupArtifact: {
        id: "backup-1",
        artifactKey: "backup-2026-03-10",
        summary: "Nightly backup completed.",
        completedAt: new Date("2026-03-09T09:00:00.000Z"),
      },
      latestRestoreRehearsal: {
        id: "restore-1",
        status: "succeeded",
        summary: "Restore rehearsal completed successfully.",
        rehearsedAt: new Date("2026-03-10T09:00:00.000Z"),
      },
      contributingReasonCodes: ["backup_stale"],
      backupAgeHours: 75,
      restoreAgeHours: 51,
    },
  });

  assert.equal(record.state, "degraded");
  assert.equal(record.reasonCode, "source_watch_contract_degraded");
  assert.deepEqual(record.contributingReasonCodes, ["source_watch_contract_degraded", "recovery_guardrail_degraded"]);
});
