import "server-only";

export const providerCapabilities = ["catalog", "playback", "download", "subtitle", "manual_submission"] as const;

export type ProviderCapability = (typeof providerCapabilities)[number];

export const providerPayloadFormats = ["json", "xml", "html", "text", "other"] as const;

export type ProviderPayloadFormat = (typeof providerPayloadFormats)[number];

export const providerContentTypeHints = ["movie", "series", "anime", "variety", "documentary", "special", "unknown"] as const;

export type ProviderContentTypeHint = (typeof providerContentTypeHints)[number];

export const stagingFragmentKinds = ["stream", "download", "subtitle"] as const;

export type StagingFragmentKind = (typeof stagingFragmentKinds)[number];

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
  scope: "page" | "detail";
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
}
