import "server-only";

import { createProviderHttpClient } from "./http";

import type { ProviderAdapter, ProviderFetchContext, ProviderRuntimeContext } from "./types";

export function defineProviderAdapter(adapter: ProviderAdapter): ProviderAdapter {
  return adapter;
}

export function createProviderRuntimeContext(overrides: Partial<ProviderRuntimeContext> = {}): ProviderRuntimeContext {
  return {
    http: overrides.http ?? createProviderHttpClient(),
    now: overrides.now ?? (() => new Date()),
  };
}

export function createProviderFetchContext(metadata: Partial<ProviderFetchContext> = {}): ProviderFetchContext {
  return {
    requestedAt: metadata.requestedAt ?? new Date().toISOString(),
    requestId: metadata.requestId,
    actorId: metadata.actorId,
  };
}
