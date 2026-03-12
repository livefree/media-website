import test from "node:test";
import assert from "node:assert/strict";

import { buildIngestLaunchValidationEvidence } from "./launch-validation";

test("buildIngestLaunchValidationEvidence reports ready when the accepted ingest lane is healthy", () => {
  const record = buildIngestLaunchValidationEvidence({
    checkedAt: new Date("2026-03-12T12:00:00.000Z"),
    acceptedProviderLane: {
      providerKey: "jszyapi_vod_json",
      adapterKey: "jszyapi_vod_json",
      displayName: "jszyapi Base VOD JSON",
      accepted: true,
    },
    providerExecution: {
      lastSuccessfulPageIngestAt: new Date("2026-03-12T11:15:00.000Z"),
    },
    schedule: {
      enabled: true,
      lastIncrementalCompletedAt: new Date("2026-03-12T11:30:00.000Z"),
      lastBackfillCompletedAt: new Date("2026-03-11T21:00:00.000Z"),
      nextIncrementalAt: new Date("2026-03-12T12:30:00.000Z"),
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
  });

  assert.equal(record.state, "ready");
  assert.equal(record.reasonCode, "ready");
  assert.deepEqual(record.contributingReasonCodes, ["ready"]);
  assert.deepEqual(
    record.domains.map((domain) => ({ domain: domain.domain, state: domain.state, reasonCode: domain.reasonCode })),
    [
      { domain: "provider_lane", state: "ready", reasonCode: "ready" },
      { domain: "scheduled_execution", state: "ready", reasonCode: "ready" },
      { domain: "queue_telemetry", state: "ready", reasonCode: "ready" },
      { domain: "probe_recovery", state: "ready", reasonCode: "ready" },
    ],
  );
});

test("buildIngestLaunchValidationEvidence blocks when provider and scheduled evidence are missing", () => {
  const record = buildIngestLaunchValidationEvidence({
    checkedAt: new Date("2026-03-12T12:00:00.000Z"),
    acceptedProviderLane: {
      providerKey: "jszyapi_vod_json",
      adapterKey: "jszyapi_vod_json",
      displayName: "jszyapi Base VOD JSON",
      accepted: true,
    },
    providerExecution: {
      lastSuccessfulPageIngestAt: null,
    },
    schedule: {
      enabled: true,
      lastIncrementalCompletedAt: null,
      lastBackfillCompletedAt: null,
    },
    queueTelemetry: {
      failures: [],
    },
    probeRecovery: {
      latestRefreshObservedAt: null,
      latestProbeObservedAt: null,
      openRepairCount: 0,
    },
  });

  assert.equal(record.state, "blocked");
  assert.equal(record.reasonCode, "provider_execution_missing");
  assert.deepEqual(
    record.contributingReasonCodes,
    ["provider_execution_missing", "scheduled_execution_missing", "probe_evidence_missing"],
  );
});

test("buildIngestLaunchValidationEvidence blocks on alert-ready queue telemetry", () => {
  const record = buildIngestLaunchValidationEvidence({
    checkedAt: new Date("2026-03-12T12:00:00.000Z"),
    acceptedProviderLane: {
      providerKey: "jszyapi_vod_json",
      adapterKey: "jszyapi_vod_json",
      displayName: "jszyapi Base VOD JSON",
      accepted: true,
    },
    providerExecution: {
      lastSuccessfulPageIngestAt: new Date("2026-03-12T11:00:00.000Z"),
    },
    schedule: {
      enabled: true,
      lastIncrementalCompletedAt: new Date("2026-03-12T10:00:00.000Z"),
      lastBackfillCompletedAt: new Date("2026-03-11T10:00:00.000Z"),
    },
    queueTelemetry: {
      failures: [
        {
          jobType: "scheduled_source_probe",
          lastErrorSummary: "Probe transport failed.",
          alertSignal: {
            severity: "operator_action_required",
            alertReady: true,
            escalationReason: "terminal_failure",
          },
        },
      ],
    },
    probeRecovery: {
      latestRefreshObservedAt: new Date("2026-03-12T11:30:00.000Z"),
      latestRefreshObservedState: "healthy",
      latestProbeObservedAt: new Date("2026-03-12T11:20:00.000Z"),
      latestProbeObservedState: "healthy",
      openRepairCount: 0,
    },
  });

  assert.equal(record.state, "blocked");
  assert.equal(record.reasonCode, "queue_operator_action_required");
  assert.equal(record.domains.find((domain) => domain.domain === "queue_telemetry")?.state, "blocked");
});

test("buildIngestLaunchValidationEvidence degrades on stale schedule and open repair backlog", () => {
  const record = buildIngestLaunchValidationEvidence({
    checkedAt: new Date("2026-03-12T12:00:00.000Z"),
    acceptedProviderLane: {
      providerKey: "jszyapi_vod_json",
      adapterKey: "jszyapi_vod_json",
      displayName: "jszyapi Base VOD JSON",
      accepted: true,
    },
    providerExecution: {
      lastSuccessfulPageIngestAt: new Date("2026-03-12T11:45:00.000Z"),
    },
    schedule: {
      enabled: true,
      lastIncrementalCompletedAt: new Date("2026-03-10T10:00:00.000Z"),
      lastBackfillCompletedAt: new Date("2026-03-11T10:00:00.000Z"),
    },
    queueTelemetry: {
      failures: [
        {
          jobType: "provider_page_ingest",
          lastErrorSummary: "Provider timed out once.",
          alertSignal: {
            severity: "degraded_attention",
            alertReady: false,
            escalationReason: "first_retryable_failure",
          },
        },
      ],
    },
    probeRecovery: {
      latestRefreshObservedAt: new Date("2026-03-12T10:30:00.000Z"),
      latestRefreshObservedState: "healthy",
      latestProbeObservedAt: new Date("2026-03-12T10:45:00.000Z"),
      latestProbeObservedState: "healthy",
      openRepairCount: 2,
    },
  });

  assert.equal(record.state, "degraded");
  assert.equal(record.reasonCode, "scheduled_execution_stale");
  assert.deepEqual(
    record.contributingReasonCodes,
    ["scheduled_execution_stale", "queue_retrying", "repair_queue_open"],
  );
});
