import "server-only";

import { BackendError } from "../errors";
import { logger } from "../logging";
import {
  createProviderFetchContext,
  createProviderRuntimeContext,
  type ProviderPageResult,
  type ProviderRegistry,
  type ProviderRuntimeContext,
} from "../provider";

import type {
  IngestDetailRequest,
  IngestDetailRunResult,
  IngestPagePersistencePlan,
  IngestPageRequest,
  IngestPageRunResult,
} from "./types";

const ingestLogger = logger.child({ subsystem: "ingest.service" });

function createPagePersistencePlan(
  request: IngestPageRequest,
  fetchedAt: string,
  result: ProviderPageResult,
): IngestPagePersistencePlan {
  return {
    providerKey: request.providerKey,
    mode: request.mode,
    fetchedAt,
    requestId: request.requestId,
    payloads: result.rawPayloads,
    items: result.items,
    checkpoint: result.nextCheckpoint,
  };
}

export async function ingestProviderPage(
  registry: ProviderRegistry,
  request: IngestPageRequest,
  runtimeOverrides: Partial<ProviderRuntimeContext> = {},
): Promise<IngestPageRunResult> {
  const adapter = registry.get(request.providerKey);
  const runtime = createProviderRuntimeContext(runtimeOverrides);
  const context = {
    ...runtime,
    ...createProviderFetchContext({
      requestId: request.requestId,
      actorId: request.actorId,
      requestedAt: runtime.now().toISOString(),
    }),
  };

  ingestLogger.info("Starting provider page ingest", {
    providerKey: request.providerKey,
    mode: request.mode,
    page: request.page,
    cursor: request.cursor,
  });

  const result = await adapter.fetchPage(
    {
      page: request.page,
      pageSize: request.pageSize,
      cursor: request.cursor,
      updatedAfter: request.updatedAfter,
      updatedBefore: request.updatedBefore,
    },
    context,
  );

  return {
    providerKey: request.providerKey,
    mode: request.mode,
    itemCount: result.items.length,
    rawPayloadCount: result.rawPayloads.length,
    persistence: createPagePersistencePlan(request, context.requestedAt, result),
  };
}

export async function ingestProviderDetail(
  registry: ProviderRegistry,
  request: IngestDetailRequest,
  runtimeOverrides: Partial<ProviderRuntimeContext> = {},
): Promise<IngestDetailRunResult> {
  const adapter = registry.get(request.providerKey);

  if (!adapter.fetchById) {
    throw new BackendError(`Provider adapter '${request.providerKey}' does not implement fetchById.`, {
      status: 400,
      code: "provider_fetch_by_id_not_supported",
    });
  }

  const runtime = createProviderRuntimeContext(runtimeOverrides);
  const context = {
    ...runtime,
    ...createProviderFetchContext({
      requestId: request.requestId,
      actorId: request.actorId,
      requestedAt: runtime.now().toISOString(),
    }),
  };

  ingestLogger.info("Starting provider detail ingest", {
    providerKey: request.providerKey,
    mode: request.mode,
    providerItemId: request.providerItemId,
  });

  const result = await adapter.fetchById(
    {
      providerItemId: request.providerItemId,
    },
    context,
  );

  return {
    providerKey: request.providerKey,
    mode: request.mode,
    rawPayloadCount: result.rawPayloads.length,
    persistence: {
      providerKey: request.providerKey,
      mode: request.mode,
      fetchedAt: context.requestedAt,
      requestId: request.requestId,
      payloads: result.rawPayloads,
      item: result.item,
    },
  };
}
