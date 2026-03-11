import "server-only";

import { randomUUID } from "node:crypto";

import type { Prisma } from "@prisma/client";

import type { RepositoryContext } from "../types";
import { BaseRepository, createRepositoryContext } from "../types";
import { BackendError } from "../../../server/errors";

import type {
  ClaimedQueuedProviderJob,
  ClaimedQueuedProviderPageJob,
  ClaimQueuedProviderJobInput,
  ClaimQueuedProviderPageJobInput,
  CompleteQueuedProviderJobInput,
  FailQueuedProviderJobInput,
  IngestDetailPersistencePlan,
  IngestMode,
  IngestSourceProbeRequest,
  IngestSourceRefreshRequest,
} from "../../../server/ingest";
import type { IngestPageRequest } from "../../../server/ingest";
import type {
  CompleteQueuedProviderPageJobInput,
  FailQueuedProviderPageJobInput,
  QueuedProviderPageJob,
  ProviderPageWorkerCheckpoint,
  RequeueQueuedProviderPageJobInput,
} from "../../../server/ingest/page-worker";
import type {
  ActiveProviderSync,
  ProviderSyncExecutionState,
  ProviderSyncMode,
  ProviderSyncState,
  QueueProviderSyncPageJobInput,
  QueuedProviderSyncRequest,
} from "../../../server/ingest/sync-orchestration";
import type { UnattendedProviderSyncScheduleState } from "../../../server/ingest/sync-scheduler";
import type {
  ProviderCapability,
  ProviderContentTypeHint,
  ProviderPayloadFormat,
  ProviderRawPayloadRecord,
  StagingProviderItem,
} from "../../../server/provider";
import type {
  IngestExecutionStatus,
  IngestJobCreateInput,
  IngestJobStatusUpdateInput,
  IngestRunCreateInput,
  IngestRunScope,
  IngestRunStatusUpdateInput,
  PersistIngestDetailInput,
  PersistIngestPageInput,
  PersistIngestPlanResult,
  PersistedCheckpointRecord,
  PersistedIngestJobRecord,
  PersistedIngestRunRecord,
  PersistedProviderItemRecord,
  PersistedProviderRegistryRecord,
  PersistedRawPayloadRecord,
  PersistedStagingCandidateRecord,
  DurableProviderPageWorkerPersistenceGateway,
  DurableProviderSyncOrchestrationPersistenceGateway,
  DurableProviderSyncSchedulingPersistenceGateway,
  ProviderItemLifecycleStatus,
  ProviderRegistryType,
  ProviderRegistryUpsertInput,
  StagingCandidatePersistenceStatus,
  DurableProviderWorkerPersistenceGateway,
} from "./types";

const providerTypeMap = {
  catalog: "CATALOG_PROVIDER",
  playback: "PLAYBACK_PROVIDER",
  download: "DOWNLOAD_PROVIDER",
  subtitle: "SUBTITLE_PROVIDER",
  manual_submission: "MANUAL_SUBMISSION_PROVIDER",
} as const;

const providerCapabilityMap = {
  catalog: "CATALOG",
  playback: "PLAYBACK",
  download: "DOWNLOAD",
  subtitle: "SUBTITLE",
  manual_submission: "MANUAL_SUBMISSION",
} as const;

const payloadFormatMap = {
  json: "JSON",
  xml: "XML",
  html: "HTML",
  text: "TEXT",
  other: "OTHER",
} as const;

const contentTypeHintMap = {
  movie: "MOVIE",
  series: "SERIES",
  anime: "ANIME",
  variety: "VARIETY",
  documentary: "DOCUMENTARY",
  special: "SPECIAL",
  unknown: "UNKNOWN",
} as const;

const ingestModeMap = {
  backfill: "BACKFILL",
  incremental: "INCREMENTAL",
  manual: "MANUAL",
} as const;

const ingestStatusMap = {
  pending: "PENDING",
  running: "RUNNING",
  succeeded: "SUCCEEDED",
  failed: "FAILED",
  cancelled: "CANCELLED",
  partial: "PARTIAL",
} as const;

const ingestRunScopeMap = {
  page: "PAGE",
  detail: "DETAIL",
  source_refresh: "SOURCE_REFRESH",
  source_probe: "SOURCE_PROBE",
} as const;

const providerItemStatusMap = {
  discovered: "DISCOVERED",
  detail_fetched: "DETAIL_FETCHED",
  staged: "STAGED",
  error: "ERROR",
  withdrawn: "WITHDRAWN",
} as const;

const stagingCandidateStatusMap = {
  pending: "PENDING",
  parsed: "PARSED",
  ready_for_normalization: "READY_FOR_NORMALIZATION",
  parse_failed: "PARSE_FAILED",
  skipped: "SKIPPED",
} as const;

const providerSyncExecutionStateMap = {
  scheduled: "SCHEDULED",
  waiting_retry: "WAITING_RETRY",
  waiting_throttle: "WAITING_THROTTLE",
} as const;

function toDate(value?: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(value);
}

function toDateUpdate(value: string | null | undefined, fallback: Date | null = null): Date | null {
  if (value === undefined) {
    return fallback;
  }

  if (value === null) {
    return null;
  }

  return new Date(value);
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function parseWorkerSourceKind(value: unknown): "stream" | "download" | "subtitle" | null {
  switch (value) {
    case "stream":
    case "download":
    case "subtitle":
      return value;
    default:
      return null;
  }
}

function parsePageWorkerCheckpoint(value: unknown): ProviderPageWorkerCheckpoint | null {
  if (!isRecord(value)) {
    return null;
  }

  const checkpoint: ProviderPageWorkerCheckpoint = {
    cursor: toStringOrNull(value.cursor),
    page: typeof value.page === "number" && Number.isFinite(value.page) ? value.page : null,
    updatedAfter: toStringOrNull(value.updatedAfter),
    updatedBefore: toStringOrNull(value.updatedBefore),
    providerUpdatedAt: toStringOrNull(value.providerUpdatedAt),
  };

  if (
    checkpoint.cursor == null &&
    checkpoint.page == null &&
    checkpoint.updatedAfter == null &&
    checkpoint.updatedBefore == null &&
    checkpoint.providerUpdatedAt == null
  ) {
    return null;
  }

  return checkpoint;
}

function mapProviderRegistryType(value: ProviderRegistryType) {
  return providerTypeMap[value];
}

function mapProviderCapabilities(values: ProviderCapability[]) {
  return values.map((value) => providerCapabilityMap[value]);
}

function mapPayloadFormat(value: ProviderPayloadFormat) {
  return payloadFormatMap[value];
}

function mapContentTypeHint(value?: ProviderContentTypeHint) {
  return contentTypeHintMap[value ?? "unknown"];
}

function mapIngestMode(value: IngestMode) {
  return ingestModeMap[value];
}

function mapIngestStatus(value: IngestExecutionStatus) {
  return ingestStatusMap[value];
}

function mapIngestRunStatus(value: IngestExecutionStatus) {
  return ingestStatusMap[value];
}

function mapIngestScope(value: IngestRunScope) {
  return ingestRunScopeMap[value];
}

function mapProviderItemStatus(value: ProviderItemLifecycleStatus) {
  return providerItemStatusMap[value];
}

function mapCandidateStatus(value: StagingCandidatePersistenceStatus) {
  return stagingCandidateStatusMap[value];
}

function mapProviderSyncExecutionState(value: ProviderSyncExecutionState) {
  return providerSyncExecutionStateMap[value];
}

function unmapProviderRegistryType(value: string): ProviderRegistryType {
  switch (value) {
    case "CATALOG_PROVIDER":
      return "catalog";
    case "PLAYBACK_PROVIDER":
      return "playback";
    case "DOWNLOAD_PROVIDER":
      return "download";
    case "SUBTITLE_PROVIDER":
      return "subtitle";
    case "MANUAL_SUBMISSION_PROVIDER":
      return "manual_submission";
  }

  throw new Error(`Unsupported provider registry type: ${value}`);
}

function unmapProviderCapabilities(values: readonly string[]): ProviderCapability[] {
  return values.map((value) => {
    switch (value) {
      case "CATALOG":
        return "catalog";
      case "PLAYBACK":
        return "playback";
      case "DOWNLOAD":
        return "download";
      case "SUBTITLE":
        return "subtitle";
      case "MANUAL_SUBMISSION":
        return "manual_submission";
    }

    throw new Error(`Unsupported provider capability: ${value}`);
  });
}

function unmapProviderSyncExecutionState(value: string): ProviderSyncExecutionState {
  switch (value) {
    case "SCHEDULED":
      return "scheduled";
    case "WAITING_RETRY":
      return "waiting_retry";
    case "WAITING_THROTTLE":
      return "waiting_throttle";
    default:
      throw new Error(`Unsupported provider sync execution state: ${value}`);
  }
}

function unmapPayloadFormat(value: string): PersistedRawPayloadRecord["payloadFormat"] {
  switch (value) {
    case "JSON":
      return "json";
    case "XML":
      return "xml";
    case "HTML":
      return "html";
    case "TEXT":
      return "text";
    case "OTHER":
      return "other";
  }

  throw new Error(`Unsupported provider payload format: ${value}`);
}

function unmapContentTypeHint(value: string): ProviderContentTypeHint {
  switch (value) {
    case "MOVIE":
      return "movie";
    case "SERIES":
      return "series";
    case "ANIME":
      return "anime";
    case "VARIETY":
      return "variety";
    case "DOCUMENTARY":
      return "documentary";
    case "SPECIAL":
      return "special";
    case "UNKNOWN":
      return "unknown";
  }

  throw new Error(`Unsupported provider content type hint: ${value}`);
}

function unmapIngestMode(value: string): IngestMode {
  switch (value) {
    case "BACKFILL":
      return "backfill";
    case "INCREMENTAL":
      return "incremental";
    case "MANUAL":
      return "manual";
  }

  throw new Error(`Unsupported ingest mode: ${value}`);
}

function unmapIngestStatus(value: string): IngestExecutionStatus {
  switch (value) {
    case "PENDING":
      return "pending";
    case "RUNNING":
      return "running";
    case "SUCCEEDED":
      return "succeeded";
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
    case "PARTIAL":
      return "partial";
  }

  throw new Error(`Unsupported ingest status: ${value}`);
}

function unmapIngestScope(value: string): IngestRunScope {
  switch (value) {
    case "PAGE":
      return "page";
    case "DETAIL":
      return "detail";
    case "SOURCE_REFRESH":
      return "source_refresh";
    case "SOURCE_PROBE":
      return "source_probe";
  }

  throw new Error(`Unsupported ingest scope: ${value}`);
}

function unmapProviderItemStatus(value: string): ProviderItemLifecycleStatus {
  switch (value) {
    case "DISCOVERED":
      return "discovered";
    case "DETAIL_FETCHED":
      return "detail_fetched";
    case "STAGED":
      return "staged";
    case "ERROR":
      return "error";
    case "WITHDRAWN":
      return "withdrawn";
  }

  throw new Error(`Unsupported provider item status: ${value}`);
}

function unmapCandidateStatus(value: string): StagingCandidatePersistenceStatus {
  switch (value) {
    case "PENDING":
      return "pending";
    case "PARSED":
      return "parsed";
    case "READY_FOR_NORMALIZATION":
      return "ready_for_normalization";
    case "PARSE_FAILED":
      return "parse_failed";
    case "SKIPPED":
      return "skipped";
  }

  throw new Error(`Unsupported staging candidate status: ${value}`);
}

function mapProviderRecord(record: Prisma.ProviderRegistryGetPayload<Record<string, never>>): PersistedProviderRegistryRecord {
  return {
    id: record.id,
    adapterKey: record.adapterKey,
    displayName: record.displayName,
    providerType: unmapProviderRegistryType(record.providerType),
    capabilities: unmapProviderCapabilities(record.capabilities),
    enabled: record.enabled,
    baseUrl: record.baseUrl,
    lastSuccessfulSyncAt: record.lastSuccessfulSyncAt,
  };
}

function mapIngestJobRecord(record: Prisma.IngestJobGetPayload<Record<string, never>>): PersistedIngestJobRecord {
  return {
    id: record.id,
    providerId: record.providerId,
    mode: unmapIngestMode(record.mode),
    status: unmapIngestStatus(record.status),
    requestId: record.requestId,
    actorId: record.actorId,
    attemptCount: record.attemptCount,
    startedAt: record.startedAt,
    finishedAt: record.finishedAt,
    lastErrorSummary: record.lastErrorSummary,
  };
}

type QueuedIngestJobPayload = Prisma.IngestJobGetPayload<{
  include: {
    provider: {
      select: {
        adapterKey: true;
      };
    };
  };
}>;

function parseQueuedSourceTarget(metadata: Prisma.JsonValue | null) {
  if (!isRecord(metadata) || !isRecord(metadata.target)) {
    return null;
  }

  return {
    sourceId: toStringOrNull(metadata.target.sourceId),
    providerItemId: toStringOrNull(metadata.target.providerItemId),
    sourceKind: parseWorkerSourceKind(metadata.target.sourceKind),
    providerLineKey: toStringOrNull(metadata.target.providerLineKey),
    urls: toStringArray(metadata.target.urls),
  };
}

function parseQueuedProviderKey(record: QueuedIngestJobPayload): string | null {
  if (isRecord(record.metadata) && isRecord(record.metadata.executionTelemetry)) {
    return toStringOrNull(record.metadata.executionTelemetry.providerKey) ?? record.provider.adapterKey;
  }

  return record.provider.adapterKey;
}

function parseQueuedPageRequest(record: QueuedIngestJobPayload): IngestPageRequest | null {
  if (!isRecord(record.metadata) || !isRecord(record.metadata.executionTelemetry)) {
    return null;
  }

  const request = isRecord(record.metadata.executionTelemetry.request) ? record.metadata.executionTelemetry.request : null;
  const providerKey = parseQueuedProviderKey(record);
  const mode = unmapIngestMode(record.mode);

  if (!providerKey || !request) {
    return null;
  }

  return {
    providerKey,
    mode,
    page: typeof request.page === "number" && Number.isFinite(request.page) ? request.page : undefined,
    pageSize: typeof request.pageSize === "number" && Number.isFinite(request.pageSize) ? request.pageSize : undefined,
    cursor: toStringOrNull(request.cursor) ?? undefined,
    updatedAfter: toStringOrNull(request.updatedAfter) ?? undefined,
    updatedBefore: toStringOrNull(request.updatedBefore) ?? undefined,
    requestId: record.requestId ?? undefined,
    actorId: record.actorId ?? undefined,
  };
}

function parseQueuedPageCheckpoint(record: QueuedIngestJobPayload): ProviderPageWorkerCheckpoint | null {
  if (!isRecord(record.metadata)) {
    return null;
  }

  const explicitCheckpoint = parsePageWorkerCheckpoint(record.metadata.resumeCheckpoint);

  if (explicitCheckpoint) {
    return explicitCheckpoint;
  }

  const executionTelemetry = isRecord(record.metadata.executionTelemetry) ? record.metadata.executionTelemetry : null;
  return parsePageWorkerCheckpoint(executionTelemetry?.checkpoint);
}

function parseSyncRequest(value: unknown, providerKey: string, mode: ProviderSyncMode): IngestPageRequest {
  const request = isRecord(value) ? value : {};

  return {
    providerKey,
    mode,
    page: typeof request.page === "number" && Number.isFinite(request.page) ? request.page : undefined,
    pageSize: typeof request.pageSize === "number" && Number.isFinite(request.pageSize) ? request.pageSize : undefined,
    cursor: toStringOrNull(request.cursor) ?? undefined,
    updatedAfter: toStringOrNull(request.updatedAfter) ?? undefined,
    updatedBefore: toStringOrNull(request.updatedBefore) ?? undefined,
    requestId: toStringOrNull(request.requestId) ?? undefined,
    actorId: toStringOrNull(request.actorId) ?? undefined,
  };
}

function mapSyncRequest(input: QueuedProviderSyncRequest | null): {
  request: Prisma.InputJsonValue | undefined;
  requestedAt: Date | null;
} {
  if (!input) {
    return {
      request: undefined,
      requestedAt: null,
    };
  }

  return {
    request: toJsonValue(input.request),
    requestedAt: toDateUpdate(input.requestedAt, null),
  };
}

function parseQueuedSyncRequest(
  providerKey: string,
  mode: ProviderSyncMode,
  request: Prisma.JsonValue | null,
  requestedAt: Date | null,
): QueuedProviderSyncRequest | null {
  if (!request || !requestedAt) {
    return null;
  }

  return {
    mode,
    request: parseSyncRequest(request, providerKey, mode),
    requestedAt: requestedAt.toISOString(),
  };
}

function parseActiveProviderSync(
  record: Prisma.ProviderSyncLaneStateGetPayload<Record<string, never>>,
): ActiveProviderSync | null {
  if (!record.activeMode || !record.activeQueueJobId || !record.activeRequestedAt || !record.activeExecutionState) {
    return null;
  }

  return {
    mode: unmapIngestMode(record.activeMode) as ProviderSyncMode,
    queueJobId: record.activeQueueJobId,
    requestedAt: record.activeRequestedAt.toISOString(),
    checkpoint: parsePageWorkerCheckpoint(record.activeCheckpoint),
    executionState: unmapProviderSyncExecutionState(record.activeExecutionState),
    retryCount: record.activeRetryCount,
    nextAttemptAt: record.activeNextAttemptAt?.toISOString() ?? null,
  };
}

function mapProviderSyncStateRecord(
  record: Prisma.ProviderSyncLaneStateGetPayload<Record<string, never>>,
): ProviderSyncState {
  return {
    providerKey: record.providerKey,
    activeSync: parseActiveProviderSync(record),
    pendingBackfill: parseQueuedSyncRequest(
      record.providerKey,
      "backfill",
      record.pendingBackfillRequest,
      record.pendingBackfillRequestedAt,
    ),
    pendingIncremental: parseQueuedSyncRequest(
      record.providerKey,
      "incremental",
      record.pendingIncrementalRequest,
      record.pendingIncrementalRequestedAt,
    ),
  };
}

function parseQueuedJobKind(record: QueuedIngestJobPayload): ClaimedQueuedProviderJob["kind"] | null {
  if (!isRecord(record.metadata)) {
    return null;
  }

  switch (record.metadata.jobType) {
    case "scheduled_source_refresh":
      return "source_refresh";
    case "scheduled_source_probe":
      return "source_probe";
    default:
      return null;
  }
}

function buildQueuedSourceRefreshRequest(record: QueuedIngestJobPayload): IngestSourceRefreshRequest | null {
  const target = parseQueuedSourceTarget(record.metadata);
  const providerKey = parseQueuedProviderKey(record);

  if (!target?.sourceId || !target.providerItemId || !target.sourceKind || target.urls.length === 0 || !providerKey) {
    return null;
  }

  return {
    providerKey,
    reason:
      (isRecord(record.metadata) ? toStringOrNull(record.metadata.maintenanceReason) : null) as IngestSourceRefreshRequest["reason"] ??
      "scheduled",
    requestId: record.requestId ?? undefined,
    actorId: record.actorId ?? undefined,
    target: {
      sourceId: target.sourceId,
      providerItemId: target.providerItemId,
      sourceKind: target.sourceKind,
      providerLineKey: target.providerLineKey ?? undefined,
      urls: target.urls,
    },
  };
}

function buildQueuedSourceProbeRequest(record: QueuedIngestJobPayload): IngestSourceProbeRequest | null {
  const target = parseQueuedSourceTarget(record.metadata);
  const providerKey = parseQueuedProviderKey(record);
  const probeKind = isRecord(record.metadata) ? toStringOrNull(record.metadata.probeKind) : null;

  if (!target?.sourceId || !target.providerItemId || !target.sourceKind || target.urls.length === 0 || !providerKey || !probeKind) {
    return null;
  }

  return {
    providerKey,
    probeKind: probeKind as IngestSourceProbeRequest["probeKind"],
    reason:
      (isRecord(record.metadata) ? toStringOrNull(record.metadata.maintenanceReason) : null) as IngestSourceProbeRequest["reason"] ??
      "scheduled",
    requestId: record.requestId ?? undefined,
    actorId: record.actorId ?? undefined,
    target: {
      sourceId: target.sourceId,
      providerItemId: target.providerItemId,
      sourceKind: target.sourceKind,
      providerLineKey: target.providerLineKey ?? undefined,
      urls: target.urls,
    },
  };
}

function buildClaimedQueuedProviderJob(
  record: QueuedIngestJobPayload,
  input: ClaimQueuedProviderJobInput,
  leaseId: string,
): ClaimedQueuedProviderJob | null {
  const kind = parseQueuedJobKind(record);
  const providerKey = parseQueuedProviderKey(record);

  if (!kind || !providerKey) {
    return null;
  }

  const lease = {
    workerId: input.workerId,
    leaseId,
    claimedAt: input.claimedAt,
    leaseExpiresAt: new Date(Date.parse(input.claimedAt) + input.leaseMs).toISOString(),
  };

  if (kind === "source_refresh") {
    const request = buildQueuedSourceRefreshRequest(record);

    if (!request) {
      return null;
    }

    return {
      queueJobId: record.id,
      kind: "source_refresh",
      providerKey,
      requestId: record.requestId ?? undefined,
      actorId: record.actorId ?? undefined,
      attemptCount: record.attemptCount + 1,
      enqueuedAt: record.createdAt.toISOString(),
      request,
      lease,
    };
  }

  const request = buildQueuedSourceProbeRequest(record);

  if (!request) {
    return null;
  }

  return {
    queueJobId: record.id,
    kind: "source_probe",
    providerKey,
    requestId: record.requestId ?? undefined,
    actorId: record.actorId ?? undefined,
    attemptCount: record.attemptCount + 1,
    enqueuedAt: record.createdAt.toISOString(),
    request,
    lease,
  };
}

function buildClaimedQueuedProviderPageJob(
  record: QueuedIngestJobPayload,
  input: ClaimQueuedProviderPageJobInput,
  leaseId: string,
): ClaimedQueuedProviderPageJob | null {
  if (!isRecord(record.metadata) || record.metadata.jobType !== "provider_page_ingest") {
    return null;
  }

  const providerKey = parseQueuedProviderKey(record);
  const request = parseQueuedPageRequest(record);

  if (!providerKey || !request) {
    return null;
  }

  return {
    queueJobId: record.id,
    providerKey,
    mode: request.mode,
    request,
    checkpoint: parseQueuedPageCheckpoint(record),
    requestId: record.requestId ?? undefined,
    actorId: record.actorId ?? undefined,
    attemptCount: record.attemptCount + 1,
    retryCount: record.retryCount,
    lastAttemptedAt: record.lastAttemptedAt?.toISOString() ?? null,
    nextAttemptAt: record.nextAttemptAt?.toISOString() ?? null,
    enqueuedAt: record.createdAt.toISOString(),
    lease: {
      workerId: input.workerId,
      leaseId,
      claimedAt: input.claimedAt,
      leaseExpiresAt: new Date(Date.parse(input.claimedAt) + input.leaseMs).toISOString(),
    },
  };
}

function mapIngestRunRecord(record: Prisma.IngestRunGetPayload<Record<string, never>>): PersistedIngestRunRecord {
  return {
    id: record.id,
    ingestJobId: record.ingestJobId,
    providerId: record.providerId,
    mode: unmapIngestMode(record.mode),
    scope: unmapIngestScope(record.scope),
    status: unmapIngestStatus(record.status),
    providerItemId: record.providerItemId,
    requestId: record.requestId,
    actorId: record.actorId,
    itemCount: record.itemCount,
    rawPayloadCount: record.rawPayloadCount,
    warningCount: record.warningCount,
    startedAt: record.startedAt,
    finishedAt: record.finishedAt,
    lastErrorSummary: record.lastErrorSummary,
  };
}

function mapCheckpointRecord(record: Prisma.IngestCheckpointGetPayload<Record<string, never>>): PersistedCheckpointRecord {
  return {
    id: record.id,
    providerId: record.providerId,
    ingestJobId: record.ingestJobId,
    ingestRunId: record.ingestRunId,
    cursor: record.cursor,
    page: record.page,
    updatedAfter: record.updatedAfter,
    updatedBefore: record.updatedBefore,
    providerUpdatedAt: record.providerUpdatedAt,
    recordedAt: record.recordedAt,
  };
}

function mapProviderItemRecord(record: Prisma.ProviderItemGetPayload<Record<string, never>>): PersistedProviderItemRecord {
  return {
    id: record.id,
    providerId: record.providerId,
    externalId: record.externalId,
    titleSnapshot: record.titleSnapshot,
    originalTitleSnapshot: record.originalTitleSnapshot,
    typeHint: unmapContentTypeHint(record.typeHint),
    latestStatus: unmapProviderItemStatus(record.latestStatus),
    providerUpdatedAt: record.providerUpdatedAt,
    lastSeenAt: record.lastSeenAt,
  };
}

function mapRawPayloadRecord(record: Prisma.ProviderRawPayloadGetPayload<Record<string, never>>): PersistedRawPayloadRecord {
  return {
    id: record.id,
    providerId: record.providerId,
    ingestJobId: record.ingestJobId,
    ingestRunId: record.ingestRunId,
    providerItemId: record.providerItemId,
    externalItemId: record.externalItemId,
    fetchedAt: record.fetchedAt,
    payloadFormat: unmapPayloadFormat(record.payloadFormat),
    scope: unmapIngestScope(record.scope),
  };
}

function mapCandidateRecord(record: Prisma.StagingCandidateGetPayload<Record<string, never>>): PersistedStagingCandidateRecord {
  return {
    id: record.id,
    providerId: record.providerId,
    providerItemId: record.providerItemId,
    ingestJobId: record.ingestJobId,
    ingestRunId: record.ingestRunId,
    status: unmapCandidateStatus(record.status),
    title: record.title,
    originalTitle: record.originalTitle,
    typeHint: unmapContentTypeHint(record.typeHint),
    warningCount: record.warnings.length,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function createRawPayloadRecord(
  context: RepositoryContext["db"],
  input: {
    providerId: string;
    ingestJobId: string;
    ingestRunId: string;
    providerItemId?: string;
    payload: ProviderRawPayloadRecord;
  },
) {
  return context.providerRawPayload.create({
    data: {
      providerId: input.providerId,
      ingestJobId: input.ingestJobId,
      ingestRunId: input.ingestRunId,
      providerItemId: input.providerItemId,
      externalItemId: input.payload.providerItemId,
      payloadFormat: mapPayloadFormat(input.payload.payloadFormat),
      scope: input.payload.scope === "detail" ? "DETAIL" : "PAGE",
      requestUrl: input.payload.request.requestUrl,
      requestMethod: input.payload.request.method,
      requestCursor: input.payload.request.cursor,
      requestPage: input.payload.request.page,
      body: toJsonValue(input.payload.body) ?? (null as unknown as Prisma.InputJsonValue),
      fetchedAt: toDate(input.payload.fetchedAt) ?? new Date(),
    },
  });
}

export class StagingPersistenceRepository
  extends BaseRepository
  implements
    DurableProviderWorkerPersistenceGateway,
    DurableProviderPageWorkerPersistenceGateway,
    DurableProviderSyncOrchestrationPersistenceGateway,
    DurableProviderSyncSchedulingPersistenceGateway
{
  public constructor(context: RepositoryContext) {
    super(context);
  }

  async loadProviderSyncState(providerKey: string): Promise<ProviderSyncState> {
    const record = await this.db.providerSyncLaneState.findUnique({
      where: {
        providerKey,
      },
    });

    if (!record) {
      return {
        providerKey,
        activeSync: null,
        pendingBackfill: null,
        pendingIncremental: null,
      };
    }

    return mapProviderSyncStateRecord(record);
  }

  async saveProviderSyncState(state: ProviderSyncState): Promise<ProviderSyncState> {
    const pendingBackfill = mapSyncRequest(state.pendingBackfill);
    const pendingIncremental = mapSyncRequest(state.pendingIncremental);

    const record = await this.db.providerSyncLaneState.upsert({
      where: {
        providerKey: state.providerKey,
      },
      create: {
        providerKey: state.providerKey,
        activeMode: state.activeSync ? mapIngestMode(state.activeSync.mode) : undefined,
        activeQueueJobId: state.activeSync?.queueJobId,
        activeRequestedAt: toDateUpdate(state.activeSync?.requestedAt, null) ?? undefined,
        activeCheckpoint: state.activeSync ? toJsonValue(state.activeSync.checkpoint) : undefined,
        activeExecutionState: state.activeSync ? mapProviderSyncExecutionState(state.activeSync.executionState) : undefined,
        activeRetryCount: state.activeSync?.retryCount ?? 0,
        activeNextAttemptAt: toDateUpdate(state.activeSync?.nextAttemptAt, null) ?? undefined,
        pendingBackfillRequest: pendingBackfill.request,
        pendingBackfillRequestedAt: pendingBackfill.requestedAt ?? undefined,
        pendingIncrementalRequest: pendingIncremental.request,
        pendingIncrementalRequestedAt: pendingIncremental.requestedAt ?? undefined,
      },
      update: {
        activeMode: state.activeSync ? mapIngestMode(state.activeSync.mode) : null,
        activeQueueJobId: state.activeSync?.queueJobId ?? null,
        activeRequestedAt: toDateUpdate(state.activeSync?.requestedAt, null),
        activeCheckpoint: state.activeSync
          ? toJsonValue(state.activeSync.checkpoint)
          : (null as unknown as Prisma.InputJsonValue),
        activeExecutionState: state.activeSync ? mapProviderSyncExecutionState(state.activeSync.executionState) : null,
        activeRetryCount: state.activeSync?.retryCount ?? 0,
        activeNextAttemptAt: toDateUpdate(state.activeSync?.nextAttemptAt, null),
        pendingBackfillRequest: pendingBackfill.request ?? (null as unknown as Prisma.InputJsonValue),
        pendingBackfillRequestedAt: pendingBackfill.requestedAt,
        pendingIncrementalRequest: pendingIncremental.request ?? (null as unknown as Prisma.InputJsonValue),
        pendingIncrementalRequestedAt: pendingIncremental.requestedAt,
      },
    });

    return mapProviderSyncStateRecord(record);
  }

  async loadUnattendedProviderSyncScheduleState(providerKey: string): Promise<UnattendedProviderSyncScheduleState | null> {
    const record = await this.db.providerSyncLaneState.findUnique({
      where: {
        providerKey,
      },
    });

    if (
      !record ||
      (record.nextIncrementalAt == null &&
        record.nextBackfillAt == null &&
        record.lastIncrementalTriggeredAt == null &&
        record.lastIncrementalCompletedAt == null &&
        record.lastBackfillTriggeredAt == null &&
        record.lastBackfillCompletedAt == null)
    ) {
      return null;
    }

    return {
      providerKey: record.providerKey,
      nextIncrementalAt: record.nextIncrementalAt?.toISOString() ?? new Date(0).toISOString(),
      nextBackfillAt: record.nextBackfillAt?.toISOString() ?? null,
      lastIncrementalTriggeredAt: record.lastIncrementalTriggeredAt?.toISOString() ?? null,
      lastIncrementalCompletedAt: record.lastIncrementalCompletedAt?.toISOString() ?? null,
      lastBackfillTriggeredAt: record.lastBackfillTriggeredAt?.toISOString() ?? null,
      lastBackfillCompletedAt: record.lastBackfillCompletedAt?.toISOString() ?? null,
    };
  }

  async saveUnattendedProviderSyncScheduleState(
    state: UnattendedProviderSyncScheduleState,
  ): Promise<UnattendedProviderSyncScheduleState> {
    const record = await this.db.providerSyncLaneState.upsert({
      where: {
        providerKey: state.providerKey,
      },
      create: {
        providerKey: state.providerKey,
        nextIncrementalAt: toDateUpdate(state.nextIncrementalAt, null) ?? undefined,
        nextBackfillAt: toDateUpdate(state.nextBackfillAt, null) ?? undefined,
        lastIncrementalTriggeredAt: toDateUpdate(state.lastIncrementalTriggeredAt, null) ?? undefined,
        lastIncrementalCompletedAt: toDateUpdate(state.lastIncrementalCompletedAt, null) ?? undefined,
        lastBackfillTriggeredAt: toDateUpdate(state.lastBackfillTriggeredAt, null) ?? undefined,
        lastBackfillCompletedAt: toDateUpdate(state.lastBackfillCompletedAt, null) ?? undefined,
      },
      update: {
        nextIncrementalAt: toDateUpdate(state.nextIncrementalAt, null),
        nextBackfillAt: toDateUpdate(state.nextBackfillAt, null),
        lastIncrementalTriggeredAt: toDateUpdate(state.lastIncrementalTriggeredAt, null),
        lastIncrementalCompletedAt: toDateUpdate(state.lastIncrementalCompletedAt, null),
        lastBackfillTriggeredAt: toDateUpdate(state.lastBackfillTriggeredAt, null),
        lastBackfillCompletedAt: toDateUpdate(state.lastBackfillCompletedAt, null),
      },
    });

    return {
      providerKey: record.providerKey,
      nextIncrementalAt: record.nextIncrementalAt?.toISOString() ?? state.nextIncrementalAt,
      nextBackfillAt: record.nextBackfillAt?.toISOString() ?? null,
      lastIncrementalTriggeredAt: record.lastIncrementalTriggeredAt?.toISOString() ?? null,
      lastIncrementalCompletedAt: record.lastIncrementalCompletedAt?.toISOString() ?? null,
      lastBackfillTriggeredAt: record.lastBackfillTriggeredAt?.toISOString() ?? null,
      lastBackfillCompletedAt: record.lastBackfillCompletedAt?.toISOString() ?? null,
    };
  }

  async enqueueQueuedProviderPageSyncJob(input: QueueProviderSyncPageJobInput): Promise<QueuedProviderPageJob> {
    const provider = await this.db.providerRegistry.findUnique({
      where: {
        adapterKey: input.providerKey,
      },
      select: {
        id: true,
      },
    });

    if (!provider) {
      throw new BackendError(`Provider '${input.providerKey}' is not registered for sync orchestration.`, {
        status: 404,
        code: "provider_not_found",
      });
    }

    const record = await this.db.ingestJob.create({
      data: {
        providerId: provider.id,
        mode: mapIngestMode(input.mode),
        status: "PENDING",
        requestId: input.request.requestId,
        actorId: input.request.actorId,
        retryCount: 0,
        lastAttemptedAt: null,
        nextAttemptAt: null,
        metadata: toJsonValue({
          jobType: "provider_page_ingest",
          orchestration: {
            providerKey: input.providerKey,
            requestedAt: input.requestedAt,
            mode: input.mode,
          },
          executionTelemetry: {
            providerKey: input.providerKey,
            request: input.request,
          },
        }),
      },
      include: {
        provider: {
          select: {
            adapterKey: true,
          },
        },
      },
    });

    const request = parseQueuedPageRequest(record) ?? {
      ...input.request,
      providerKey: input.providerKey,
      mode: input.mode,
    };

    return {
      queueJobId: record.id,
      providerKey: input.providerKey,
      mode: input.mode,
      request,
      checkpoint: parseQueuedPageCheckpoint(record),
      requestId: record.requestId ?? undefined,
      actorId: record.actorId ?? undefined,
      attemptCount: record.attemptCount,
      retryCount: record.retryCount,
      lastAttemptedAt: record.lastAttemptedAt?.toISOString() ?? null,
      nextAttemptAt: record.nextAttemptAt?.toISOString() ?? null,
      enqueuedAt: record.createdAt.toISOString(),
    };
  }

  async upsertProviderRegistry(input: ProviderRegistryUpsertInput): Promise<PersistedProviderRegistryRecord> {
    const record = await this.db.providerRegistry.upsert({
      where: {
        adapterKey: input.adapterKey,
      },
      create: {
        adapterKey: input.adapterKey,
        displayName: input.displayName,
        providerType: mapProviderRegistryType(input.providerType),
        capabilities: mapProviderCapabilities(input.capabilities),
        baseUrl: input.baseUrl,
        enabled: input.enabled ?? true,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
      update: {
        displayName: input.displayName,
        providerType: mapProviderRegistryType(input.providerType),
        capabilities: mapProviderCapabilities(input.capabilities),
        baseUrl: input.baseUrl,
        enabled: input.enabled ?? true,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    return mapProviderRecord(record);
  }

  async createIngestJob(input: IngestJobCreateInput): Promise<PersistedIngestJobRecord> {
    const record = await this.db.ingestJob.create({
      data: {
        providerId: input.providerId,
        mode: mapIngestMode(input.mode),
        status: mapIngestStatus(input.status ?? "pending"),
        requestId: input.requestId,
        actorId: input.actorId,
        startedAt: toDate(input.startedAt),
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    return mapIngestJobRecord(record);
  }

  async updateIngestJobStatus(jobId: string, input: IngestJobStatusUpdateInput): Promise<PersistedIngestJobRecord> {
    const record = await this.db.ingestJob.update({
      where: { id: jobId },
      data: {
        status: mapIngestStatus(input.status),
        finishedAt: toDate(input.finishedAt),
        attemptCount: input.attemptCount,
        lastErrorSummary: input.lastErrorSummary,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    return mapIngestJobRecord(record);
  }

  async claimNextQueuedProviderJob(input: ClaimQueuedProviderJobInput): Promise<ClaimedQueuedProviderJob | null> {
    const candidates = await this.db.ingestJob.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        provider: {
          select: {
            adapterKey: true,
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
      take: 20,
    });

    for (const candidate of candidates) {
      const leaseId = randomUUID();
      const claimedJob = buildClaimedQueuedProviderJob(candidate, input, leaseId);

      if (!claimedJob) {
        continue;
      }

      const claimedAt = toDate(input.claimedAt) ?? new Date();
      const leaseExpiresAt = new Date(claimedAt.getTime() + input.leaseMs);
      const result = await this.db.ingestJob.updateMany({
        where: {
          id: candidate.id,
          status: "PENDING",
        },
        data: {
          status: "RUNNING",
          startedAt: claimedAt,
          attemptCount: {
            increment: 1,
          },
          leaseWorkerId: input.workerId,
          leaseId,
          leaseClaimedAt: claimedAt,
          leaseExpiresAt,
        },
      });

      if (result.count === 1) {
        return claimedJob;
      }
    }

    return null;
  }

  async claimNextQueuedProviderPageJob(input: ClaimQueuedProviderPageJobInput): Promise<ClaimedQueuedProviderPageJob | null> {
    const claimedAt = toDate(input.claimedAt) ?? new Date();
    const candidates = await this.db.ingestJob.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        provider: {
          select: {
            adapterKey: true,
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
      take: 20,
    });

    for (const candidate of candidates) {
      if (candidate.nextAttemptAt && candidate.nextAttemptAt.getTime() > claimedAt.getTime()) {
        continue;
      }

      const leaseId = randomUUID();
      const claimedJob = buildClaimedQueuedProviderPageJob(candidate, input, leaseId);

      if (!claimedJob) {
        continue;
      }

      const leaseExpiresAt = new Date(claimedAt.getTime() + input.leaseMs);
      const result = await this.db.ingestJob.updateMany({
        where: {
          id: candidate.id,
          status: "PENDING",
        },
        data: {
          status: "RUNNING",
          startedAt: claimedAt,
          attemptCount: {
            increment: 1,
          },
          leaseWorkerId: input.workerId,
          leaseId,
          leaseClaimedAt: claimedAt,
          leaseExpiresAt,
        },
      });

      if (result.count === 1) {
        return claimedJob;
      }
    }

    return null;
  }

  async completeQueuedProviderJob(input: CompleteQueuedProviderJobInput): Promise<void> {
    const result = await this.db.ingestJob.updateMany({
      where: {
        id: input.queueJobId,
        status: "RUNNING",
        leaseWorkerId: input.workerId,
        leaseId: input.leaseId,
      },
      data: {
        status: "SUCCEEDED",
        finishedAt: toDate(input.finishedAt),
        lastErrorSummary: null,
        metadata: toJsonValue(input.metadata),
        leaseWorkerId: null,
        leaseId: null,
        leaseClaimedAt: null,
        leaseExpiresAt: null,
      },
    });

    if (result.count !== 1) {
      throw new BackendError(`Lease validation failed while completing queued job '${input.queueJobId}'.`, {
        status: 409,
        code: "ingest_job_lease_conflict",
      });
    }
  }

  async requeueQueuedProviderPageJob(input: RequeueQueuedProviderPageJobInput): Promise<void> {
    const existing = await this.db.ingestJob.findFirst({
      where: {
        id: input.queueJobId,
        status: "RUNNING",
        leaseWorkerId: input.workerId,
        leaseId: input.leaseId,
      },
      select: {
        metadata: true,
        retryCount: true,
        lastAttemptedAt: true,
        nextAttemptAt: true,
      },
    });

    if (!existing) {
      throw new BackendError(`Lease validation failed while requeueing page job '${input.queueJobId}'.`, {
        status: 409,
        code: "ingest_job_lease_conflict",
      });
    }

    const nextMetadata = {
      ...(isRecord(existing.metadata) ? existing.metadata : {}),
      ...(input.metadata ?? {}),
      resumeCheckpoint: input.checkpoint,
    };

    const result = await this.db.ingestJob.updateMany({
      where: {
        id: input.queueJobId,
        status: "RUNNING",
        leaseWorkerId: input.workerId,
        leaseId: input.leaseId,
      },
      data: {
        status: "PENDING",
        finishedAt: toDate(input.requeuedAt),
        metadata: toJsonValue(nextMetadata),
        retryCount: input.retryCount ?? existing.retryCount,
        lastAttemptedAt: toDateUpdate(input.lastAttemptedAt, existing.lastAttemptedAt),
        nextAttemptAt: toDateUpdate(input.nextAttemptAt, existing.nextAttemptAt),
        leaseWorkerId: null,
        leaseId: null,
        leaseClaimedAt: null,
        leaseExpiresAt: null,
      },
    });

    if (result.count !== 1) {
      throw new BackendError(`Lease validation failed while requeueing page job '${input.queueJobId}'.`, {
        status: 409,
        code: "ingest_job_lease_conflict",
      });
    }
  }

  async completeQueuedProviderPageJob(input: CompleteQueuedProviderPageJobInput): Promise<void> {
    const result = await this.db.ingestJob.updateMany({
      where: {
        id: input.queueJobId,
        status: "RUNNING",
        leaseWorkerId: input.workerId,
        leaseId: input.leaseId,
      },
      data: {
        status: "SUCCEEDED",
        finishedAt: toDate(input.finishedAt),
        lastErrorSummary: null,
        metadata: toJsonValue(input.metadata),
        leaseWorkerId: null,
        leaseId: null,
        leaseClaimedAt: null,
        leaseExpiresAt: null,
      },
    });

    if (result.count !== 1) {
      throw new BackendError(`Lease validation failed while completing page job '${input.queueJobId}'.`, {
        status: 409,
        code: "ingest_job_lease_conflict",
      });
    }
  }

  async failQueuedProviderJob(input: FailQueuedProviderJobInput): Promise<void> {
    const result = await this.db.ingestJob.updateMany({
      where: {
        id: input.queueJobId,
        status: "RUNNING",
        leaseWorkerId: input.workerId,
        leaseId: input.leaseId,
      },
      data: {
        status: "FAILED",
        finishedAt: toDate(input.finishedAt),
        lastErrorSummary: input.lastErrorSummary,
        metadata: toJsonValue(input.metadata),
        leaseWorkerId: null,
        leaseId: null,
        leaseClaimedAt: null,
        leaseExpiresAt: null,
      },
    });

    if (result.count !== 1) {
      throw new BackendError(`Lease validation failed while failing queued job '${input.queueJobId}'.`, {
        status: 409,
        code: "ingest_job_lease_conflict",
      });
    }
  }

  async failQueuedProviderPageJob(input: FailQueuedProviderPageJobInput): Promise<void> {
    const result = await this.db.ingestJob.updateMany({
      where: {
        id: input.queueJobId,
        status: "RUNNING",
        leaseWorkerId: input.workerId,
        leaseId: input.leaseId,
      },
      data: {
        status: "FAILED",
        finishedAt: toDate(input.finishedAt),
        lastErrorSummary: input.lastErrorSummary,
        metadata: toJsonValue(input.metadata),
        leaseWorkerId: null,
        leaseId: null,
        leaseClaimedAt: null,
        leaseExpiresAt: null,
      },
    });

    if (result.count !== 1) {
      throw new BackendError(`Lease validation failed while failing page job '${input.queueJobId}'.`, {
        status: 409,
        code: "ingest_job_lease_conflict",
      });
    }
  }

  async createIngestRun(input: IngestRunCreateInput): Promise<PersistedIngestRunRecord> {
    const record = await this.db.ingestRun.create({
      data: {
        ingestJobId: input.ingestJobId,
        providerId: input.providerId,
        mode: mapIngestMode(input.mode),
        scope: mapIngestScope(input.scope),
        status: mapIngestRunStatus(input.status ?? "pending"),
        requestId: input.requestId,
        actorId: input.actorId,
        providerItemId: input.providerItemId,
        startedAt: toDate(input.startedAt),
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    return mapIngestRunRecord(record);
  }

  async updateIngestRunStatus(runId: string, input: IngestRunStatusUpdateInput): Promise<PersistedIngestRunRecord> {
    const record = await this.db.ingestRun.update({
      where: { id: runId },
      data: {
        status: mapIngestRunStatus(input.status),
        finishedAt: toDate(input.finishedAt),
        itemCount: input.itemCount,
        rawPayloadCount: input.rawPayloadCount,
        warningCount: input.warningCount,
        lastErrorSummary: input.lastErrorSummary,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    if (input.status === "succeeded" || input.status === "partial") {
      await this.db.providerRegistry.update({
        where: { id: record.providerId },
        data: {
          lastSuccessfulSyncAt: record.finishedAt ?? new Date(),
          lastErrorAt: null,
          lastErrorSummary: null,
        },
      });
    }

    if (input.status === "failed") {
      await this.db.providerRegistry.update({
        where: { id: record.providerId },
        data: {
          lastErrorAt: record.finishedAt ?? new Date(),
          lastErrorSummary: input.lastErrorSummary,
        },
      });
    }

    return mapIngestRunRecord(record);
  }

  async recordCheckpoint(input: {
    providerId: string;
    ingestJobId?: string;
    ingestRunId?: string;
    checkpoint: PersistIngestPageInput["plan"]["checkpoint"];
  }): Promise<PersistedCheckpointRecord | undefined> {
    if (!input.checkpoint) {
      return undefined;
    }

    const record = await this.db.ingestCheckpoint.create({
      data: {
        providerId: input.providerId,
        ingestJobId: input.ingestJobId,
        ingestRunId: input.ingestRunId,
        cursor: input.checkpoint.cursor,
        page: input.checkpoint.page,
        updatedAfter: toDate(input.checkpoint.updatedAfter),
        updatedBefore: toDate(input.checkpoint.updatedBefore),
        providerUpdatedAt: toDate(input.checkpoint.providerUpdatedAt),
      },
    });

    return mapCheckpointRecord(record);
  }

  async persistPagePlan(input: PersistIngestPageInput): Promise<PersistIngestPlanResult> {
    const itemStatus = input.itemStatus ?? "staged";
    const candidateStatus = input.candidateStatus ?? "ready_for_normalization";
    const itemMap = new Map<string, PersistedProviderItemRecord>();
    const providerItems: PersistedProviderItemRecord[] = [];
    const candidates: PersistedStagingCandidateRecord[] = [];

    for (const item of input.plan.items) {
      const providerItem = await this.upsertProviderItem({
        providerId: input.providerId,
        item,
        seenAt: input.plan.fetchedAt,
        itemStatus,
        candidateStatus,
      });

      itemMap.set(item.providerItemId, providerItem);
      providerItems.push(providerItem);

      const candidate = await this.db.stagingCandidate.create({
        data: {
          providerId: input.providerId,
          providerItemId: providerItem.id,
          ingestJobId: input.ingestJobId,
          ingestRunId: input.ingestRunId,
          status: mapCandidateStatus(candidateStatus),
          title: item.title,
          originalTitle: item.originalTitle,
          summary: item.summary,
          releaseYear: item.releaseYear,
          region: item.region,
          language: item.language,
          rawCategory: item.rawCategory,
          rawEpisodeText: item.rawEpisodeText,
          typeHint: mapContentTypeHint(item.typeHint),
          providerUpdatedAt: toDate(item.providerUpdatedAt),
          sourceFragmentSummary: toJsonValue(item.sourceFragments),
          warnings: item.warnings,
        },
      });

      candidates.push(mapCandidateRecord(candidate));
    }

    const rawPayloads: PersistedRawPayloadRecord[] = [];

    for (const payload of input.plan.payloads) {
      const linkedItem = payload.providerItemId ? itemMap.get(payload.providerItemId) : undefined;
      const rawPayload = await createRawPayloadRecord(this.db, {
        providerId: input.providerId,
        ingestJobId: input.ingestJobId,
        ingestRunId: input.ingestRunId,
        providerItemId: linkedItem?.id,
        payload,
      });
      rawPayloads.push(mapRawPayloadRecord(rawPayload));
    }

    const checkpoint = await this.recordCheckpoint({
      providerId: input.providerId,
      ingestJobId: input.ingestJobId,
      ingestRunId: input.ingestRunId,
      checkpoint: input.plan.checkpoint,
    });

    await this.db.ingestRun.update({
      where: { id: input.ingestRunId },
      data: {
        itemCount: providerItems.length,
        rawPayloadCount: rawPayloads.length,
        warningCount: candidates.reduce((count, candidate) => count + candidate.warningCount, 0),
      },
    });

    return {
      providerItems,
      rawPayloads,
      candidates,
      checkpoint,
    };
  }

  async persistDetailPlan(input: PersistIngestDetailInput): Promise<PersistIngestPlanResult> {
    const pageLikePlan: PersistIngestPageInput = {
      providerId: input.providerId,
      ingestJobId: input.ingestJobId,
      ingestRunId: input.ingestRunId,
      itemStatus: input.itemStatus ?? "detail_fetched",
      candidateStatus: input.candidateStatus ?? "ready_for_normalization",
      plan: {
        providerKey: input.plan.providerKey,
        mode: input.plan.mode,
        fetchedAt: input.plan.fetchedAt,
        requestId: input.plan.requestId,
        payloads: input.plan.payloads,
        items: [input.plan.item],
      },
    };

    return this.persistPagePlan(pageLikePlan);
  }

  private async upsertProviderItem(input: {
    providerId: string;
    item: StagingProviderItem;
    seenAt: string;
    itemStatus: ProviderItemLifecycleStatus;
    candidateStatus: StagingCandidatePersistenceStatus;
  }): Promise<PersistedProviderItemRecord> {
    const record = await this.db.providerItem.upsert({
      where: {
        providerId_externalId: {
          providerId: input.providerId,
          externalId: input.item.providerItemId,
        },
      },
      create: {
        providerId: input.providerId,
        externalId: input.item.providerItemId,
        titleSnapshot: input.item.title,
        originalTitleSnapshot: input.item.originalTitle,
        latestStatus: mapProviderItemStatus(input.itemStatus),
        typeHint: mapContentTypeHint(input.item.typeHint),
        providerUpdatedAt: toDate(input.item.providerUpdatedAt),
        lastSeenAt: toDate(input.seenAt) ?? new Date(),
        latestRawPayloadAt: toDate(input.seenAt),
        latestCandidateStatus: mapCandidateStatus(input.candidateStatus),
        latestCandidateAt: toDate(input.seenAt) ?? new Date(),
      },
      update: {
        titleSnapshot: input.item.title,
        originalTitleSnapshot: input.item.originalTitle,
        latestStatus: mapProviderItemStatus(input.itemStatus),
        typeHint: mapContentTypeHint(input.item.typeHint),
        providerUpdatedAt: toDate(input.item.providerUpdatedAt),
        lastSeenAt: toDate(input.seenAt) ?? new Date(),
        latestRawPayloadAt: toDate(input.seenAt),
        latestCandidateStatus: mapCandidateStatus(input.candidateStatus),
        latestCandidateAt: toDate(input.seenAt) ?? new Date(),
      },
    });

    return mapProviderItemRecord(record);
  }
}

export function createStagingPersistenceRepository(context: RepositoryContext) {
  return new StagingPersistenceRepository(context);
}

export async function createDefaultStagingPersistenceRepository() {
  const { requireDb } = await import("../../client");
  return createStagingPersistenceRepository(createRepositoryContext(requireDb()));
}
