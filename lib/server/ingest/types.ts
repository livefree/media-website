import "server-only";

import type {
  ProviderDetailResult,
  ProviderMaintenanceReason,
  ProviderPageResult,
  ProviderRequestMetadata,
  ProviderSourceProbeResult,
  ProviderSourceRefreshResult,
  ProviderSourceTarget,
  RepairIntakeSignal,
  SourceHealthFinding,
  SourceProbeKind,
} from "../provider";

export const ingestModes = ["backfill", "incremental", "manual"] as const;

export type IngestMode = (typeof ingestModes)[number];

export interface IngestPageRequest {
  providerKey: string;
  mode: IngestMode;
  page?: number;
  pageSize?: number;
  cursor?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  requestId?: string;
  actorId?: string;
}

export interface IngestDetailRequest {
  providerKey: string;
  mode: IngestMode;
  providerItemId: string;
  requestId?: string;
  actorId?: string;
}

export interface IngestSourceRefreshRequest {
  providerKey: string;
  target: ProviderSourceTarget;
  reason: ProviderMaintenanceReason;
  requestId?: string;
  actorId?: string;
}

export interface IngestSourceProbeRequest {
  providerKey: string;
  target: ProviderSourceTarget;
  probeKind: SourceProbeKind;
  reason: ProviderMaintenanceReason;
  requestId?: string;
  actorId?: string;
}

export interface IngestPagePersistencePlan {
  providerKey: string;
  mode: IngestMode;
  fetchedAt: string;
  requestId?: string;
  payloads: ProviderPageResult["rawPayloads"];
  items: ProviderPageResult["items"];
  checkpoint?: ProviderPageResult["nextCheckpoint"];
}

export interface IngestDetailPersistencePlan {
  providerKey: string;
  mode: IngestMode;
  fetchedAt: string;
  requestId?: string;
  payloads: ProviderDetailResult["rawPayloads"];
  item: ProviderDetailResult["item"];
}

export interface IngestRepairIntakePlan {
  providerKey: string;
  requestId?: string;
  capturedAt: string;
  target: ProviderSourceTarget;
  findings: SourceHealthFinding[];
  signals: RepairIntakeSignal[];
}

export interface IngestSourceRefreshPersistencePlan {
  providerKey: string;
  reason: ProviderMaintenanceReason;
  fetchedAt: string;
  requestId?: string;
  request: ProviderRequestMetadata;
  target: ProviderSourceTarget;
  payloads: ProviderSourceRefreshResult["rawPayloads"];
  item?: ProviderSourceRefreshResult["item"];
  findings: ProviderSourceRefreshResult["findings"];
  repair: IngestRepairIntakePlan;
}

export interface IngestSourceProbePersistencePlan {
  providerKey: string;
  reason: ProviderMaintenanceReason;
  probeKind: SourceProbeKind;
  probedAt: string;
  requestId?: string;
  request: ProviderRequestMetadata;
  target: ProviderSourceTarget;
  payloads: ProviderSourceProbeResult["rawPayloads"];
  findings: ProviderSourceProbeResult["findings"];
  repair: IngestRepairIntakePlan;
}

export interface IngestPageRunResult {
  providerKey: string;
  mode: IngestMode;
  itemCount: number;
  rawPayloadCount: number;
  persistence: IngestPagePersistencePlan;
}

export interface IngestDetailRunResult {
  providerKey: string;
  mode: IngestMode;
  rawPayloadCount: number;
  persistence: IngestDetailPersistencePlan;
}

export interface CreateRepairIntakePlanRequest {
  providerKey: string;
  requestId?: string;
  capturedAt: string;
  target: ProviderSourceTarget;
  findings: SourceHealthFinding[];
  signals?: RepairIntakeSignal[];
}

export interface IngestSourceRefreshRunResult {
  providerKey: string;
  reason: ProviderMaintenanceReason;
  rawPayloadCount: number;
  findingCount: number;
  repairSignalCount: number;
  persistence: IngestSourceRefreshPersistencePlan;
}

export interface IngestSourceProbeRunResult {
  providerKey: string;
  reason: ProviderMaintenanceReason;
  probeKind: SourceProbeKind;
  rawPayloadCount: number;
  findingCount: number;
  repairSignalCount: number;
  persistence: IngestSourceProbePersistencePlan;
}
