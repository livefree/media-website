import "server-only";

import type { IngestDetailPersistencePlan, IngestMode, IngestPagePersistencePlan } from "../../../server/ingest";
import type {
  ClaimedQueuedProviderJob,
  ClaimQueuedProviderJobInput,
  CompleteQueuedProviderJobInput,
  FailQueuedProviderJobInput,
} from "../../../server/ingest";
import type {
  ClaimedQueuedProviderPageJob,
  ClaimQueuedProviderPageJobInput,
  CompleteQueuedProviderPageJobInput,
  FailQueuedProviderPageJobInput,
  RequeueQueuedProviderPageJobInput,
} from "../../../server/ingest/page-worker";
import type { ProviderSyncState, QueueProviderSyncPageJobInput } from "../../../server/ingest/sync-orchestration";
import type { QueuedProviderPageJob } from "../../../server/ingest/page-worker";
import type { UnattendedProviderSyncScheduleState } from "../../../server/ingest/sync-scheduler";
import type { ProviderCapability, ProviderContentTypeHint } from "../../../server/provider";

export const providerRegistryTypes = ["catalog", "playback", "download", "subtitle", "manual_submission"] as const;
export type ProviderRegistryType = (typeof providerRegistryTypes)[number];

export const ingestExecutionStatuses = ["pending", "running", "succeeded", "failed", "cancelled", "partial"] as const;
export type IngestExecutionStatus = (typeof ingestExecutionStatuses)[number];

export const ingestRunScopes = ["page", "detail", "source_refresh", "source_probe"] as const;
export type IngestRunScope = (typeof ingestRunScopes)[number];

export const providerItemLifecycleStatuses = ["discovered", "detail_fetched", "staged", "error", "withdrawn"] as const;
export type ProviderItemLifecycleStatus = (typeof providerItemLifecycleStatuses)[number];

export const stagingCandidatePersistenceStatuses = [
  "pending",
  "parsed",
  "ready_for_normalization",
  "parse_failed",
  "skipped",
] as const;
export type StagingCandidatePersistenceStatus = (typeof stagingCandidatePersistenceStatuses)[number];

export interface ProviderRegistryUpsertInput {
  adapterKey: string;
  displayName: string;
  providerType: ProviderRegistryType;
  capabilities: ProviderCapability[];
  baseUrl?: string;
  enabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface IngestJobCreateInput {
  providerId: string;
  mode: IngestMode;
  status?: IngestExecutionStatus;
  requestId?: string;
  actorId?: string;
  startedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface IngestJobStatusUpdateInput {
  status: IngestExecutionStatus;
  finishedAt?: string;
  attemptCount?: number;
  lastErrorSummary?: string;
  metadata?: Record<string, unknown>;
}

export interface IngestRunCreateInput {
  ingestJobId: string;
  providerId: string;
  mode: IngestMode;
  scope: IngestRunScope;
  status?: IngestExecutionStatus;
  requestId?: string;
  actorId?: string;
  providerItemId?: string;
  startedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface IngestRunStatusUpdateInput {
  status: IngestExecutionStatus;
  finishedAt?: string;
  itemCount?: number;
  rawPayloadCount?: number;
  warningCount?: number;
  lastErrorSummary?: string;
  metadata?: Record<string, unknown>;
}

export interface PersistIngestPageInput {
  providerId: string;
  ingestJobId: string;
  ingestRunId: string;
  plan: IngestPagePersistencePlan;
  itemStatus?: ProviderItemLifecycleStatus;
  candidateStatus?: StagingCandidatePersistenceStatus;
}

export interface PersistIngestDetailInput {
  providerId: string;
  ingestJobId: string;
  ingestRunId: string;
  plan: IngestDetailPersistencePlan;
  itemStatus?: ProviderItemLifecycleStatus;
  candidateStatus?: StagingCandidatePersistenceStatus;
}

export interface PersistedProviderRegistryRecord {
  id: string;
  adapterKey: string;
  displayName: string;
  providerType: ProviderRegistryType;
  capabilities: ProviderCapability[];
  enabled: boolean;
  baseUrl?: string | null;
  lastSuccessfulSyncAt?: Date | null;
}

export interface PersistedIngestJobRecord {
  id: string;
  providerId: string;
  mode: IngestMode;
  status: IngestExecutionStatus;
  requestId?: string | null;
  actorId?: string | null;
  attemptCount: number;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  lastErrorSummary?: string | null;
}

export interface PersistedIngestRunRecord {
  id: string;
  ingestJobId: string;
  providerId: string;
  mode: IngestMode;
  scope: IngestRunScope;
  status: IngestExecutionStatus;
  providerItemId?: string | null;
  requestId?: string | null;
  actorId?: string | null;
  itemCount: number;
  rawPayloadCount: number;
  warningCount: number;
  startedAt: Date;
  finishedAt?: Date | null;
  lastErrorSummary?: string | null;
}

export interface PersistedCheckpointRecord {
  id: string;
  providerId: string;
  ingestJobId?: string | null;
  ingestRunId?: string | null;
  cursor?: string | null;
  page?: number | null;
  updatedAfter?: Date | null;
  updatedBefore?: Date | null;
  providerUpdatedAt?: Date | null;
  recordedAt: Date;
}

export interface PersistedProviderItemRecord {
  id: string;
  providerId: string;
  externalId: string;
  titleSnapshot: string;
  originalTitleSnapshot?: string | null;
  typeHint: ProviderContentTypeHint;
  latestStatus: ProviderItemLifecycleStatus;
  providerUpdatedAt?: Date | null;
  lastSeenAt: Date;
}

export interface PersistedRawPayloadRecord {
  id: string;
  providerId: string;
  ingestJobId?: string | null;
  ingestRunId?: string | null;
  providerItemId?: string | null;
  externalItemId?: string | null;
  fetchedAt: Date;
  payloadFormat: "json" | "xml" | "html" | "text" | "other";
  scope: IngestRunScope;
}

export interface PersistedStagingCandidateRecord {
  id: string;
  providerId: string;
  providerItemId: string;
  ingestJobId?: string | null;
  ingestRunId?: string | null;
  status: StagingCandidatePersistenceStatus;
  title: string;
  originalTitle?: string | null;
  typeHint: ProviderContentTypeHint;
  warningCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistIngestPlanResult {
  providerItems: PersistedProviderItemRecord[];
  rawPayloads: PersistedRawPayloadRecord[];
  candidates: PersistedStagingCandidateRecord[];
  checkpoint?: PersistedCheckpointRecord;
}

export interface DurableProviderWorkerPersistenceGateway {
  claimNextQueuedProviderJob(input: ClaimQueuedProviderJobInput): Promise<ClaimedQueuedProviderJob | null>;
  completeQueuedProviderJob(input: CompleteQueuedProviderJobInput): Promise<void>;
  failQueuedProviderJob(input: FailQueuedProviderJobInput): Promise<void>;
}

export interface DurableProviderPageWorkerPersistenceGateway {
  claimNextQueuedProviderPageJob(input: ClaimQueuedProviderPageJobInput): Promise<ClaimedQueuedProviderPageJob | null>;
  requeueQueuedProviderPageJob(input: RequeueQueuedProviderPageJobInput): Promise<void>;
  completeQueuedProviderPageJob(input: CompleteQueuedProviderPageJobInput): Promise<void>;
  failQueuedProviderPageJob(input: FailQueuedProviderPageJobInput): Promise<void>;
}

export interface DurableProviderSyncOrchestrationPersistenceGateway {
  loadProviderSyncState(providerKey: string): Promise<ProviderSyncState>;
  saveProviderSyncState(state: ProviderSyncState): Promise<ProviderSyncState>;
  enqueueQueuedProviderPageSyncJob(input: QueueProviderSyncPageJobInput): Promise<QueuedProviderPageJob>;
}

export interface DurableProviderSyncSchedulingPersistenceGateway {
  loadUnattendedProviderSyncScheduleState(providerKey: string): Promise<UnattendedProviderSyncScheduleState | null>;
  saveUnattendedProviderSyncScheduleState(
    state: UnattendedProviderSyncScheduleState,
  ): Promise<UnattendedProviderSyncScheduleState>;
}
