import test from "node:test";
import assert from "node:assert/strict";

import { buildQueueFailureMonitoringViewModel } from "./admin-queue-failure.helpers.ts";

import type { AdminQueueFailureMonitoringPageRecord } from "../../lib/server/admin";

function createPage(
  overrides: Partial<AdminQueueFailureMonitoringPageRecord> = {},
): AdminQueueFailureMonitoringPageRecord {
  return {
    title: "Queue Failures",
    description: "Operator triage view for failed and retrying ingest, refresh, and probe jobs.",
    appliedFilters: {},
    summary: {
      totalItems: 2,
      failedItems: 1,
      retryingItems: 1,
      providerPageIngestItems: 1,
      sourceRefreshItems: 1,
      sourceProbeItems: 0,
    },
    items: [
      {
        jobId: "job_failed_1",
        runId: "run_failed_1",
        providerId: "provider_jszy",
        providerKey: "jszyapi_vod_json",
        providerDisplayName: "JSZY API",
        visibilityState: "failed",
        status: "failed",
        jobType: "provider_page_ingest",
        scope: "page",
        mode: "backfill",
        requestId: "req_failed",
        actorId: "system",
        providerItemId: "vod-001",
        attemptCount: 2,
        retryState: "terminal_failure",
        failureSignal: {
          severity: "operator_action_required",
          alertReady: true,
          escalationReason: "terminal_failure",
        },
        startedAt: new Date("2026-03-11T10:00:00.000Z"),
        finishedAt: new Date("2026-03-11T10:00:04.000Z"),
        durationMs: 4000,
        lastErrorSummary: "Provider response 'msg' indicated an error: provider failed.",
        failure: {
          category: "provider_response",
          code: "provider_payload_invalid",
          status: 502,
          retryable: false,
          errorName: "BackendError",
        },
        target: {
          sourceId: "src_001",
          providerItemId: "vod-001",
          sourceKind: "stream",
          providerLineKey: "lineA",
          urls: ["https://example.com/stream.m3u8"],
        },
        request: {
          page: 3,
          pageSize: 30,
          cursor: "cursor-3",
          updatedAfter: null,
          updatedBefore: null,
        },
        checkpoint: {
          cursor: "cursor-3",
          page: 3,
        },
        counts: {
          itemCount: 0,
          rawPayloadCount: 1,
          warningCount: 1,
        },
      },
      {
        jobId: "job_retry_1",
        runId: "run_retry_1",
        providerId: "provider_jszy",
        providerKey: "jszyapi_vod_json",
        providerDisplayName: "JSZY API",
        visibilityState: "retrying",
        status: "running",
        jobType: "scheduled_source_refresh",
        scope: "source_refresh",
        mode: "incremental",
        requestId: "req_retry",
        actorId: "scheduler",
        providerItemId: "vod-002",
        attemptCount: 3,
        retryState: "retrying",
        failureSignal: {
          severity: "degraded_attention",
          alertReady: false,
          escalationReason: "repeated_retryable_failure",
        },
        startedAt: new Date("2026-03-11T10:05:00.000Z"),
        finishedAt: null,
        durationMs: null,
        lastErrorSummary: "Previous refresh failed.",
        failure: {
          category: "provider_request",
          code: "provider_request_failed",
          status: 504,
          retryable: true,
          errorName: "BackendError",
        },
        target: {
          sourceId: "src_002",
          providerItemId: "vod-002",
          sourceKind: "stream",
          providerLineKey: "lineB",
          urls: ["https://example.com/stream-2.m3u8"],
        },
        request: null,
        checkpoint: {
          cursor: null,
          page: null,
        },
        counts: {
          itemCount: 1,
          rawPayloadCount: 2,
          warningCount: 0,
        },
      },
    ],
    ...overrides,
  };
}

test("buildQueueFailureMonitoringViewModel keeps populated failed and retrying jobs with triage fields", () => {
  const viewModel = buildQueueFailureMonitoringViewModel({
    page: createPage(),
    searchState: {
      q: "vod",
      visibility: "failed",
      provider: "jszyapi_vod_json",
      jobType: "provider_page_ingest",
    },
  });

  assert.equal(viewModel.surfaceId, "admin-queue-failures");
  assert.equal(viewModel.navSection, "queue-failures");
  assert.equal(viewModel.summaryMetrics[0]?.label, "Visible jobs");
  assert.equal(viewModel.summaryMetrics[0]?.value, 2);
  assert.equal(viewModel.summaryMetrics[1]?.value, 1);
  assert.equal(viewModel.summaryMetrics[2]?.value, 1);
  assert.equal(viewModel.items.length, 2);
  assert.deepEqual(viewModel.items[0]?.badges, ["failed", "terminal failure", "operator action required", "alert ready", "provider page ingest", "page"]);
  assert.equal(viewModel.items[0]?.summary, "Provider response 'msg' indicated an error: provider failed.");
  assert.equal(viewModel.items[0]?.alertSignal?.severityLabel, "operator action required");
  assert.equal(viewModel.items[0]?.alertSignal?.alertReadyLabel, "Alert-ready");
  assert.equal(viewModel.items[0]?.alertSignal?.escalationReasonLabel, "terminal failure");
  assert.equal(viewModel.items[0]?.alertSignal?.actionSummary, "Operator action required");
  assert.equal(viewModel.items[0]?.triage.find((item) => item.label === "Alert signal")?.value, "operator action required · terminal failure");
  assert.equal(viewModel.items[0]?.triage.find((item) => item.label === "Failure class")?.value, "provider_response · provider_payload_invalid");
  assert.equal(viewModel.items[0]?.triage.find((item) => item.label === "Attempts")?.value, "2");
  assert.match(viewModel.items[0]?.triage.find((item) => item.label === "Started")?.value ?? "", /2026/);
  assert.equal(viewModel.items[1]?.triage.find((item) => item.label === "HTTP / retryable")?.value, "HTTP 504 · retryable");
  assert.equal(viewModel.items[1]?.alertSignal?.alertReadyLabel, "Monitoring only");
});

test("buildQueueFailureMonitoringViewModel emits a stable empty state when no actionable jobs exist", () => {
  const viewModel = buildQueueFailureMonitoringViewModel({
    page: createPage({
      summary: {
        totalItems: 0,
        failedItems: 0,
        retryingItems: 0,
        providerPageIngestItems: 0,
        sourceRefreshItems: 0,
        sourceProbeItems: 0,
      },
      items: [],
    }),
    searchState: {
      q: "",
      visibility: "",
      provider: "",
      jobType: "",
    },
  });

  assert.equal(viewModel.items.length, 0);
  assert.equal(viewModel.emptyMessage, "No failed or retrying jobs matched the current filters.");
  assert.equal(viewModel.errorMessage, undefined);
  assert.deepEqual(viewModel.filterFields.map((field) => field.name), ["q", "visibility", "provider", "jobType"]);
});

test("buildQueueFailureMonitoringViewModel keeps a stable page shape for the privileged surface", () => {
  const viewModel = buildQueueFailureMonitoringViewModel({
    page: createPage(),
    searchState: {
      q: "",
      visibility: "",
      provider: "",
      jobType: "",
    },
  });

  assert.equal(viewModel.title, "Queue Failures");
  assert.equal(viewModel.description, "Operator triage view for failed and retrying ingest, refresh, and probe jobs.");
  assert.deepEqual(
    viewModel.summaryMetrics.map((metric) => metric.label),
    ["Visible jobs", "Failed", "Retrying", "Page ingest", "Source refresh", "Source probe"],
  );
  assert.deepEqual(
    viewModel.filterFields.map((field) => `${field.name}:${field.kind}`),
    ["q:text", "visibility:select", "provider:text", "jobType:select"],
  );
  assert.deepEqual(viewModel.items[0]?.links.map((link) => link.label), ["Open repair queue", "Open inventory"]);
  assert.equal(viewModel.items[0]?.triage.length, 13);
});
