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
