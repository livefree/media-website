import test from "node:test";
import assert from "node:assert/strict";

import { extractExecutionTelemetry, inferVisibilityState } from "./index";

test("extractExecutionTelemetry preserves alert-ready failure signal metadata", () => {
  const telemetry = extractExecutionTelemetry({
    jobType: "provider_page_ingest",
    executionTelemetry: {
      status: "failed",
      scope: "page",
      providerKey: "jszyapi_vod_json",
      mode: "incremental",
      requestId: "req-1",
      actorId: "system",
      attemptCount: 3,
      retryState: "terminal_failure",
      failureSignal: {
        severity: "operator_action_required",
        alertReady: true,
        escalationReason: "terminal_failure",
      },
      startedAt: "2026-03-12T09:00:00.000Z",
      finishedAt: "2026-03-12T09:02:00.000Z",
      lastErrorSummary: "Provider returned HTTP 500.",
      failure: {
        category: "provider_response",
        code: "http_500",
        status: 500,
        retryable: true,
        errorName: "ProviderHttpError",
      },
    },
  });

  assert.ok(telemetry);
  assert.equal(telemetry.retryState, "terminal_failure");
  assert.deepEqual(telemetry.failureSignal, {
    severity: "operator_action_required",
    alertReady: true,
    escalationReason: "terminal_failure",
  });
});

test("extractExecutionTelemetry drops malformed failure signal metadata", () => {
  const telemetry = extractExecutionTelemetry({
    jobType: "scheduled_source_refresh",
    executionTelemetry: {
      status: "running",
      scope: "source_refresh",
      providerKey: "jszyapi_vod_json",
      attemptCount: 2,
      retryState: "retrying",
      failureSignal: {
        severity: "not_real",
        alertReady: "yes",
        escalationReason: "mystery",
      },
    },
  });

  assert.ok(telemetry);
  assert.equal(telemetry.failureSignal, null);
});

test("inferVisibilityState continues to distinguish retrying noise from failed states", () => {
  assert.equal(
    inferVisibilityState({
      status: "running",
      retryState: "retrying",
      attemptCount: 2,
    }),
    "retrying",
  );

  assert.equal(
    inferVisibilityState({
      status: "failed",
      retryState: "terminal_failure",
      attemptCount: 3,
    }),
    "failed",
  );
});
