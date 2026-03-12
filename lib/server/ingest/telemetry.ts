import "server-only";

import { BackendError } from "../errors";

import type { IngestExecutionStatus, IngestRunScope } from "../../db/repositories/staging/types";
import type { IngestMode, IngestPageRequest, IngestSourceProbeRequest, IngestSourceRefreshRequest } from "./types";

export const ingestJobTelemetryVersion = 2;

export const ingestFailureCategories = [
  "provider_request",
  "provider_response",
  "provider_contract",
  "unsupported_operation",
  "validation",
  "internal",
  "unexpected",
] as const;

export type IngestFailureCategory = (typeof ingestFailureCategories)[number];

export type IngestJobKind = "provider_page_ingest" | "scheduled_source_refresh" | "scheduled_source_probe";
export type IngestRetryState = "none" | "retrying" | "retryable_failure" | "terminal_failure";

export const ingestFailureSeverities = [
  "retrying_noise",
  "degraded_attention",
  "operator_action_required",
] as const;

export type IngestFailureSeverity = (typeof ingestFailureSeverities)[number];

export const ingestFailureEscalationReasons = [
  "none",
  "first_retryable_failure",
  "repeated_retryable_failure",
  "terminal_failure",
] as const;

export type IngestFailureEscalationReason = (typeof ingestFailureEscalationReasons)[number];

interface JobExecutionTargetSnapshot {
  sourceId: string;
  providerItemId: string;
  sourceKind: string;
  providerLineKey: string | null;
  urls: string[];
}

export interface IngestExecutionFailureSummary {
  category: IngestFailureCategory;
  code: string;
  status: number | null;
  retryable: boolean;
  summary: string;
  errorName: string;
}

export interface IngestFailureSignal {
  severity: IngestFailureSeverity;
  alertReady: boolean;
  escalationReason: IngestFailureEscalationReason;
}

interface IngestExecutionContext {
  jobType: IngestJobKind;
  scope: IngestRunScope;
  providerKey: string;
  mode: IngestMode | null;
  requestId: string | null;
  actorId: string | null;
  maintenanceReason: string | null;
  probeKind: string | null;
  target: JobExecutionTargetSnapshot | null;
  request: {
    page: number | null;
    pageSize: number | null;
    cursor: string | null;
    updatedAfter: string | null;
    updatedBefore: string | null;
  } | null;
}

interface BuildExecutionTelemetryMetadataInput {
  status: IngestExecutionStatus;
  attemptCount: number;
  startedAt?: string;
  finishedAt?: string;
  itemCount?: number;
  rawPayloadCount?: number;
  warningCount?: number;
  checkpoint?: {
    cursor: string | null;
    page: number | null;
  };
  failure?: IngestExecutionFailureSummary;
  lastErrorSummary?: string | null;
}

function toNullableString(value: string | undefined): string | null {
  return value ?? null;
}

function createTargetSnapshot(
  target: IngestSourceRefreshRequest["target"] | IngestSourceProbeRequest["target"],
): JobExecutionTargetSnapshot {
  return {
    sourceId: target.sourceId,
    providerItemId: target.providerItemId,
    sourceKind: target.sourceKind,
    providerLineKey: target.providerLineKey ?? null,
    urls: [...target.urls],
  };
}

function resolveFailureCategory(error: BackendError): IngestFailureCategory {
  if (error.code === "provider_request_failed") {
    return "provider_request";
  }

  if (error.code === "provider_invalid_json" || error.code === "provider_payload_invalid") {
    return "provider_response";
  }

  if (error.code.endsWith("_not_supported")) {
    return "unsupported_operation";
  }

  if (error.code.startsWith("provider_")) {
    return "provider_contract";
  }

  if (error.status >= 500) {
    return "internal";
  }

  return "validation";
}

function inferRetryable(error: BackendError): boolean {
  if (error.code === "provider_invalid_json" || error.code === "provider_payload_invalid") {
    return false;
  }

  return error.code === "provider_request_failed" || error.status >= 500;
}

function deriveBackendErrorSummary(error: BackendError): string {
  const providerMessage =
    error.details && typeof error.details.message === "string" && error.details.message.trim().length > 0
      ? error.details.message.trim()
      : null;

  if (error.code === "provider_payload_invalid" && providerMessage) {
    return `Provider response 'msg' indicated an error: ${providerMessage}.`;
  }

  return error.message;
}

function buildErrorSummary(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected ingest job failure.";
}

function computeDurationMs(startedAt?: string, finishedAt?: string): number | null {
  if (!startedAt || !finishedAt) {
    return null;
  }

  const start = Date.parse(startedAt);
  const finish = Date.parse(finishedAt);

  if (Number.isNaN(start) || Number.isNaN(finish)) {
    return null;
  }

  return Math.max(0, finish - start);
}

function deriveRetryState(input: BuildExecutionTelemetryMetadataInput): IngestRetryState {
  if (input.status === "failed") {
    return input.failure?.retryable ? "retryable_failure" : "terminal_failure";
  }

  if ((input.status === "pending" || input.status === "running") && input.attemptCount > 1) {
    return "retrying";
  }

  return "none";
}

function deriveFailureSignal(input: BuildExecutionTelemetryMetadataInput): IngestFailureSignal | null {
  const retryState = deriveRetryState(input);

  switch (retryState) {
    case "retrying":
      return {
        severity: "retrying_noise",
        alertReady: false,
        escalationReason: "none",
      };
    case "retryable_failure":
      if (input.attemptCount > 1) {
        return {
          severity: "operator_action_required",
          alertReady: true,
          escalationReason: "repeated_retryable_failure",
        };
      }

      return {
        severity: "degraded_attention",
        alertReady: false,
        escalationReason: "first_retryable_failure",
      };
    case "terminal_failure":
      return {
        severity: "operator_action_required",
        alertReady: true,
        escalationReason: "terminal_failure",
      };
    default:
      return null;
  }
}

export function classifyIngestExecutionFailure(error: unknown): IngestExecutionFailureSummary {
  if (error instanceof BackendError) {
    return {
      category: resolveFailureCategory(error),
      code: error.code,
      status: error.status,
      retryable: inferRetryable(error),
      summary: deriveBackendErrorSummary(error),
      errorName: error.name,
    };
  }

  if (error instanceof Error) {
    return {
      category: "unexpected",
      code: "unexpected_error",
      status: null,
      retryable: false,
      summary: error.message,
      errorName: error.name,
    };
  }

  return {
    category: "unexpected",
    code: "unexpected_error",
    status: null,
    retryable: false,
    summary: buildErrorSummary(error),
    errorName: "UnknownError",
  };
}

export function createPageIngestTelemetryContext(request: IngestPageRequest): IngestExecutionContext {
  return {
    jobType: "provider_page_ingest",
    scope: "page",
    providerKey: request.providerKey,
    mode: request.mode,
    requestId: request.requestId ?? null,
    actorId: request.actorId ?? null,
    maintenanceReason: null,
    probeKind: null,
    target: null,
    request: {
      page: request.page ?? null,
      pageSize: request.pageSize ?? null,
      cursor: toNullableString(request.cursor),
      updatedAfter: toNullableString(request.updatedAfter),
      updatedBefore: toNullableString(request.updatedBefore),
    },
  };
}

export function createSourceRefreshTelemetryContext(request: IngestSourceRefreshRequest): IngestExecutionContext {
  return {
    jobType: "scheduled_source_refresh",
    scope: "source_refresh",
    providerKey: request.providerKey,
    mode: "incremental",
    requestId: request.requestId ?? null,
    actorId: request.actorId ?? null,
    maintenanceReason: request.reason,
    probeKind: null,
    target: createTargetSnapshot(request.target),
    request: null,
  };
}

export function createSourceProbeTelemetryContext(request: IngestSourceProbeRequest): IngestExecutionContext {
  return {
    jobType: "scheduled_source_probe",
    scope: "source_probe",
    providerKey: request.providerKey,
    mode: "incremental",
    requestId: request.requestId ?? null,
    actorId: request.actorId ?? null,
    maintenanceReason: request.reason,
    probeKind: request.probeKind,
    target: createTargetSnapshot(request.target),
    request: null,
  };
}

export function buildExecutionTelemetryMetadata(
  context: IngestExecutionContext,
  input: BuildExecutionTelemetryMetadataInput,
): Record<string, unknown> {
  const lastErrorSummary = input.lastErrorSummary ?? input.failure?.summary ?? null;
  const retryState = deriveRetryState(input);
  const failureSignal = deriveFailureSignal(input);

  return {
    jobType: context.jobType,
    ...(context.maintenanceReason ? { maintenanceReason: context.maintenanceReason } : {}),
    ...(context.probeKind ? { probeKind: context.probeKind } : {}),
    ...(context.target ? { target: context.target } : {}),
    ...(context.request ? { request: context.request } : {}),
    executionTelemetry: {
      version: ingestJobTelemetryVersion,
      status: input.status,
      scope: context.scope,
      providerKey: context.providerKey,
      mode: context.mode,
      requestId: context.requestId,
      actorId: context.actorId,
      maintenanceReason: context.maintenanceReason,
      probeKind: context.probeKind,
      target: context.target,
      request: context.request,
      attemptCount: input.attemptCount,
      retryState,
      startedAt: input.startedAt ?? null,
      finishedAt: input.finishedAt ?? null,
      durationMs: computeDurationMs(input.startedAt, input.finishedAt),
      lastErrorSummary,
      failureSignal,
      itemCount: input.itemCount ?? null,
      rawPayloadCount: input.rawPayloadCount ?? null,
      warningCount: input.warningCount ?? null,
      checkpoint: input.checkpoint ?? null,
      failure: input.failure ?? null,
    },
  };
}
