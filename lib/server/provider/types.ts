import "server-only";

export const providerCapabilities = ["catalog", "playback", "download", "subtitle", "manual_submission"] as const;

export type ProviderCapability = (typeof providerCapabilities)[number];

export const providerPayloadFormats = ["json", "xml", "html", "text", "other"] as const;

export type ProviderPayloadFormat = (typeof providerPayloadFormats)[number];

export const providerContentTypeHints = ["movie", "series", "anime", "variety", "documentary", "special", "unknown"] as const;

export type ProviderContentTypeHint = (typeof providerContentTypeHints)[number];

export const stagingFragmentKinds = ["stream", "download", "subtitle"] as const;

export type StagingFragmentKind = (typeof stagingFragmentKinds)[number];

export const sourceHealthStates = ["healthy", "degraded", "broken", "replaced", "offline"] as const;

export type SourceHealthState = (typeof sourceHealthStates)[number];

export const providerMaintenanceReasons = ["scheduled", "manual", "repair"] as const;

export type ProviderMaintenanceReason = (typeof providerMaintenanceReasons)[number];

export const sourceProbeKinds = ["availability", "manifest", "playback", "download", "subtitle", "metadata_refresh"] as const;

export type SourceProbeKind = (typeof sourceProbeKinds)[number];

export const repairSignalTriggers = [
  "source_degraded",
  "source_broken",
  "source_offline",
  "source_replaced",
  "provider_item_missing",
  "provider_line_missing",
  "provider_payload_mismatch",
  "manual_followup",
] as const;

export type RepairSignalTrigger = (typeof repairSignalTriggers)[number];

export const repairSignalSeverities = ["low", "medium", "high", "critical"] as const;

export type RepairSignalSeverity = (typeof repairSignalSeverities)[number];

export interface ProviderAdapterMetadata {
  key: string;
  displayName: string;
  capabilities: ProviderCapability[];
  baseUrl?: string;
  enabledByDefault?: boolean;
}

export interface ProviderFetchPageParams {
  cursor?: string;
  page?: number;
  pageSize?: number;
  updatedAfter?: string;
  updatedBefore?: string;
  signal?: AbortSignal;
}

export interface ProviderFetchByIdParams {
  providerItemId: string;
  signal?: AbortSignal;
}

export interface ProviderSourceTarget {
  sourceId: string;
  providerItemId: string;
  sourceKind: StagingFragmentKind;
  mediaId?: string;
  episodeId?: string;
  providerLineKey?: string;
  label?: string;
  urls: string[];
  metadata?: Record<string, unknown>;
}

export interface ProviderRefreshSourceParams {
  target: ProviderSourceTarget;
  reason: ProviderMaintenanceReason;
  signal?: AbortSignal;
}

export interface ProviderProbeSourceParams {
  target: ProviderSourceTarget;
  probeKind: SourceProbeKind;
  reason: ProviderMaintenanceReason;
  signal?: AbortSignal;
}

export interface ProviderFetchContext {
  requestedAt: string;
  requestId?: string;
  actorId?: string;
}

export interface ProviderRequestMetadata {
  requestUrl?: string;
  method?: "GET" | "POST";
  cursor?: string;
  page?: number;
}

export interface ProviderRawPayloadRecord {
  providerKey: string;
  providerItemId?: string;
  payloadFormat: ProviderPayloadFormat;
  scope: "page" | "detail" | "source_refresh" | "source_probe";
  body: string | Record<string, unknown>;
  fetchedAt: string;
  request: ProviderRequestMetadata;
}

export interface StagingSourceFragment {
  kind: StagingFragmentKind;
  providerLineKey?: string;
  label?: string;
  language?: string;
  quality?: string;
  urls: string[];
  rawEpisodeLabel?: string;
  rawPayload?: string | Record<string, unknown>;
}

export interface StagingProviderItem {
  providerKey: string;
  providerItemId: string;
  title: string;
  originalTitle?: string;
  summary?: string;
  releaseYear?: number;
  region?: string;
  language?: string;
  rawCategory?: string;
  rawEpisodeText?: string;
  typeHint?: ProviderContentTypeHint;
  providerUpdatedAt?: string;
  sourceFragments: StagingSourceFragment[];
  warnings: string[];
}

export interface ProviderCheckpoint {
  cursor?: string;
  page?: number;
  updatedAfter?: string;
  updatedBefore?: string;
  providerUpdatedAt?: string;
}

export interface ProviderPageResult {
  providerKey: string;
  fetchedAt: string;
  request: ProviderRequestMetadata;
  nextCheckpoint?: ProviderCheckpoint;
  items: StagingProviderItem[];
  rawPayloads: ProviderRawPayloadRecord[];
}

export interface ProviderDetailResult {
  providerKey: string;
  fetchedAt: string;
  request: ProviderRequestMetadata;
  item: StagingProviderItem;
  rawPayloads: ProviderRawPayloadRecord[];
}

export interface SourceHealthFinding {
  sourceId: string;
  observedAt: string;
  observedState: SourceHealthState;
  probeKind: SourceProbeKind;
  summary: string;
  code?: string;
  providerItemId?: string;
  providerLineKey?: string;
  evidence?: Record<string, unknown>;
}

export interface RepairIntakeSignal {
  sourceId: string;
  createdAt: string;
  healthState: Exclude<SourceHealthState, "healthy">;
  trigger: RepairSignalTrigger;
  severity: RepairSignalSeverity;
  summary: string;
  probeKind?: SourceProbeKind;
  providerItemId?: string;
  providerLineKey?: string;
  evidence?: Record<string, unknown>;
}

export interface ProviderSourceRefreshResult {
  providerKey: string;
  fetchedAt: string;
  request: ProviderRequestMetadata;
  target: ProviderSourceTarget;
  item?: StagingProviderItem;
  rawPayloads: ProviderRawPayloadRecord[];
  findings: SourceHealthFinding[];
  repairSignals: RepairIntakeSignal[];
}

export interface ProviderSourceProbeResult {
  providerKey: string;
  probedAt: string;
  request: ProviderRequestMetadata;
  target: ProviderSourceTarget;
  rawPayloads: ProviderRawPayloadRecord[];
  findings: SourceHealthFinding[];
  repairSignals: RepairIntakeSignal[];
}

export interface ProviderHttpClient {
  fetchJson<T>(url: string, init?: RequestInit): Promise<T>;
  fetchText(url: string, init?: RequestInit): Promise<string>;
}

export interface ProviderRuntimeContext {
  http: ProviderHttpClient;
  now(): Date;
}

export interface ProviderAdapter {
  metadata: ProviderAdapterMetadata;
  fetchPage(params: ProviderFetchPageParams, context: ProviderRuntimeContext & ProviderFetchContext): Promise<ProviderPageResult>;
  fetchById?(
    params: ProviderFetchByIdParams,
    context: ProviderRuntimeContext & ProviderFetchContext,
  ): Promise<ProviderDetailResult>;
  refreshSource?(
    params: ProviderRefreshSourceParams,
    context: ProviderRuntimeContext & ProviderFetchContext,
  ): Promise<ProviderSourceRefreshResult>;
  probeSource?(
    params: ProviderProbeSourceParams,
    context: ProviderRuntimeContext & ProviderFetchContext,
  ): Promise<ProviderSourceProbeResult>;
}
