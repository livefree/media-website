import "server-only";

import type {
  IngestSourceProbePersistencePlan,
  IngestSourceRefreshPersistencePlan,
} from "../ingest";
import type {
  ProviderMaintenanceReason,
  RepairSignalSeverity,
  RepairSignalTrigger,
  SourceHealthState,
  SourceProbeKind,
} from "../provider";

export const sourceProbeStatuses = ["pending", "running", "succeeded", "failed", "cancelled"] as const;
export type SourceProbeStatus = (typeof sourceProbeStatuses)[number];

export const repairQueueStatuses = ["open", "in_progress", "waiting_provider", "resolved", "dismissed"] as const;
export type RepairQueueStatus = (typeof repairQueueStatuses)[number];

export const queueFailureVisibilityStates = ["failed", "retrying"] as const;
export type QueueFailureVisibilityState = (typeof queueFailureVisibilityStates)[number];

export type QueueFailureJobType = "provider_page_ingest" | "scheduled_source_refresh" | "scheduled_source_probe";
export type QueueFailureExecutionStatus = "pending" | "running" | "succeeded" | "failed" | "cancelled" | "partial";
export type QueueFailureScope = "page" | "detail" | "source_refresh" | "source_probe";
export type QueueFailureRetryState = "none" | "retrying" | "retryable_failure" | "terminal_failure";

export interface QueueFailureTriageContext {
  sourceId: string;
  providerItemId: string;
  sourceKind: string;
  providerLineKey?: string | null;
  urls: string[];
}

export interface QueueFailureRequestContext {
  page?: number | null;
  pageSize?: number | null;
  cursor?: string | null;
  updatedAfter?: string | null;
  updatedBefore?: string | null;
}

export interface QueueFailureCheckpointContext {
  cursor?: string | null;
  page?: number | null;
}

export interface QueueFailureSummary {
  category: string;
  code: string;
  status?: number | null;
  retryable: boolean;
  errorName: string;
}

export interface AdminQueueFailureItemRecord {
  jobId: string;
  runId?: string | null;
  providerId: string;
  providerKey: string;
  providerDisplayName: string;
  visibilityState: QueueFailureVisibilityState;
  status: QueueFailureExecutionStatus;
  jobType: QueueFailureJobType;
  scope: QueueFailureScope;
  mode?: "backfill" | "incremental" | "manual" | null;
  requestId?: string | null;
  actorId?: string | null;
  providerItemId?: string | null;
  attemptCount: number;
  retryState: QueueFailureRetryState;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  durationMs?: number | null;
  lastErrorSummary?: string | null;
  failure?: QueueFailureSummary | null;
  target?: QueueFailureTriageContext | null;
  request?: QueueFailureRequestContext | null;
  checkpoint?: QueueFailureCheckpointContext | null;
  counts: {
    itemCount?: number | null;
    rawPayloadCount?: number | null;
    warningCount?: number | null;
  };
}

export interface AdminQueueFailureQuery {
  visibilityStates?: QueueFailureVisibilityState[];
  providerKeys?: string[];
  jobTypes?: QueueFailureJobType[];
  search?: string;
  limit?: number;
}

export interface SourceProbeRunRecord {
  id: string;
  resourceId: string;
  providerId?: string | null;
  providerItemId?: string | null;
  providerLineKey?: string | null;
  probeKind: SourceProbeKind;
  maintenanceReason: ProviderMaintenanceReason;
  status: SourceProbeStatus;
  requestId?: string | null;
  actorId?: string | null;
  observedState?: SourceHealthState | null;
  summary?: string | null;
  failureSummary?: string | null;
  payloadCount: number;
  evidence?: Record<string, unknown> | null;
  startedAt: Date;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepairQueueEntryRecord {
  id: string;
  resourceId: string;
  probeRunId?: string | null;
  providerId?: string | null;
  providerItemId?: string | null;
  providerLineKey?: string | null;
  trigger: RepairSignalTrigger;
  severity: RepairSignalSeverity;
  currentHealthState: SourceHealthState;
  status: RepairQueueStatus;
  summary: string;
  evidence?: Record<string, unknown> | null;
  createdAt: Date;
  lastObservedAt: Date;
  resolvedAt?: Date | null;
  updatedAt: Date;
}

export interface PersistSourceRefreshHealthRequest {
  providerKey: string;
  actorId?: string;
  requestId?: string;
  persistence: IngestSourceRefreshPersistencePlan;
}

export interface PersistSourceProbeHealthRequest {
  providerKey: string;
  actorId?: string;
  requestId?: string;
  persistence: IngestSourceProbePersistencePlan;
}

export interface RepairQueueQuery {
  statuses?: RepairQueueStatus[];
  severities?: RepairSignalSeverity[];
  healthStates?: SourceHealthState[];
  providerId?: string;
  search?: string;
}

export interface RepairQueueStatusUpdateInput {
  status: RepairQueueStatus;
  actorId?: string;
  requestId?: string;
  resolvedAt?: string;
}

export interface AdminRepairQueueItemRecord extends RepairQueueEntryRecord {
  resourcePublicId: string;
  resourceKind: "stream" | "download" | "subtitle" | "trailer";
  resourceLabel: string;
  mediaPublicId: string;
  mediaTitle: string;
  mediaSlug: string;
  episodePublicId?: string | null;
  episodeTitle?: string | null;
  episodeLabel?: string | null;
  providerAdapterKey?: string | null;
  providerDisplayName?: string | null;
  probeKind?: SourceProbeKind | null;
  probeSummary?: string | null;
}
