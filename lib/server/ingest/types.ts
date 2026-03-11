import "server-only";

import type { ProviderDetailResult, ProviderPageResult } from "../provider";

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
