import "server-only";

import { ingestProviderPage } from "./service";
import {
  buildExecutionTelemetryMetadata,
  classifyIngestExecutionFailure,
  createPageIngestTelemetryContext,
} from "./telemetry";

import type { ProviderRegistry, ProviderRuntimeContext } from "../provider";
import type { PersistIngestPlanResult } from "../../db/repositories/staging/types";
import type {
  IngestJobCreateInput,
  IngestJobStatusUpdateInput,
  IngestRunCreateInput,
  IngestRunStatusUpdateInput,
  PersistIngestPageInput,
  PersistedIngestJobRecord,
  PersistedIngestRunRecord,
  PersistedProviderRegistryRecord,
  ProviderRegistryType,
} from "../../db/repositories/staging/types";
import type { IngestPageRequest, IngestPageRunResult } from "./types";
import type { ProviderCapability } from "../provider";

export interface PageIngestPersistenceGateway {
  upsertProviderRegistry(input: {
    adapterKey: string;
    displayName: string;
    providerType: ProviderRegistryType;
    capabilities: ProviderCapability[];
    baseUrl?: string;
    enabled?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<PersistedProviderRegistryRecord>;
  createIngestJob(input: IngestJobCreateInput): Promise<PersistedIngestJobRecord>;
  updateIngestJobStatus(jobId: string, input: IngestJobStatusUpdateInput): Promise<PersistedIngestJobRecord>;
  createIngestRun(input: IngestRunCreateInput): Promise<PersistedIngestRunRecord>;
  updateIngestRunStatus(runId: string, input: IngestRunStatusUpdateInput): Promise<PersistedIngestRunRecord>;
  persistPagePlan(input: PersistIngestPageInput): Promise<PersistIngestPlanResult>;
}

export interface ExecuteProviderPageIngestRunResult {
  provider: PersistedProviderRegistryRecord;
  job: PersistedIngestJobRecord;
  run: PersistedIngestRunRecord;
  ingest: IngestPageRunResult;
  persisted: PersistIngestPlanResult;
}

function deriveProviderType(capabilities: PersistedProviderRegistryRecord["capabilities"]): ProviderRegistryType {
  if (capabilities.includes("catalog")) {
    return "catalog";
  }

  if (capabilities.includes("playback")) {
    return "playback";
  }

  if (capabilities.includes("download")) {
    return "download";
  }

  if (capabilities.includes("subtitle")) {
    return "subtitle";
  }

  return "manual_submission";
}

export async function executeProviderPageIngestRun(
  persistence: PageIngestPersistenceGateway,
  registry: ProviderRegistry,
  request: IngestPageRequest,
  runtimeOverrides: Partial<ProviderRuntimeContext> = {},
): Promise<ExecuteProviderPageIngestRunResult> {
  const adapter = registry.get(request.providerKey);
  const now = runtimeOverrides.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const attemptCount = 1;
  const telemetryContext = createPageIngestTelemetryContext(request);
  const provider = await persistence.upsertProviderRegistry({
    adapterKey: adapter.metadata.key,
    displayName: adapter.metadata.displayName,
    providerType: deriveProviderType(adapter.metadata.capabilities),
    capabilities: adapter.metadata.capabilities,
    baseUrl: adapter.metadata.baseUrl,
    enabled: adapter.metadata.enabledByDefault ?? true,
  });
  const job = await persistence.createIngestJob({
    providerId: provider.id,
    mode: request.mode,
    status: "running",
    requestId: request.requestId,
    actorId: request.actorId,
    startedAt,
    metadata: buildExecutionTelemetryMetadata(telemetryContext, {
      status: "running",
      attemptCount,
      startedAt,
      lastErrorSummary: null,
    }),
  });
  const run = await persistence.createIngestRun({
    ingestJobId: job.id,
    providerId: provider.id,
    mode: request.mode,
    scope: "page",
    status: "running",
    requestId: request.requestId,
    actorId: request.actorId,
    startedAt,
    metadata: buildExecutionTelemetryMetadata(telemetryContext, {
      status: "running",
      attemptCount,
      startedAt,
      lastErrorSummary: null,
    }),
  });

  try {
    const ingest = await ingestProviderPage(registry, request, runtimeOverrides);
    const persisted = await persistence.persistPagePlan({
      providerId: provider.id,
      ingestJobId: job.id,
      ingestRunId: run.id,
      plan: ingest.persistence,
    });
    const finishedAt = now().toISOString();
    const warningCount = persisted.candidates.reduce((total, candidate) => total + candidate.warningCount, 0);
    const updatedRun = await persistence.updateIngestRunStatus(run.id, {
      status: "succeeded",
      finishedAt,
      itemCount: persisted.providerItems.length,
      rawPayloadCount: persisted.rawPayloads.length,
      warningCount,
      metadata: buildExecutionTelemetryMetadata(telemetryContext, {
        status: "succeeded",
        attemptCount,
        startedAt,
        finishedAt,
        itemCount: persisted.providerItems.length,
        rawPayloadCount: persisted.rawPayloads.length,
        warningCount,
        checkpoint: persisted.checkpoint
          ? {
              cursor: persisted.checkpoint.cursor ?? null,
              page: persisted.checkpoint.page ?? null,
            }
          : undefined,
      }),
    });
    const updatedJob = await persistence.updateIngestJobStatus(job.id, {
      status: "succeeded",
      finishedAt,
      attemptCount,
      metadata: buildExecutionTelemetryMetadata(telemetryContext, {
        status: "succeeded",
        attemptCount,
        startedAt,
        finishedAt,
      }),
    });

    return {
      provider,
      job: updatedJob,
      run: updatedRun,
      ingest,
      persisted,
    };
  } catch (error) {
    const finishedAt = now().toISOString();
    const failure = classifyIngestExecutionFailure(error);
    const lastErrorSummary = failure.summary;

    await persistence.updateIngestRunStatus(run.id, {
      status: "failed",
      finishedAt,
      lastErrorSummary,
      metadata: buildExecutionTelemetryMetadata(telemetryContext, {
        status: "failed",
        attemptCount,
        startedAt,
        finishedAt,
        failure,
        lastErrorSummary,
      }),
    });
    await persistence.updateIngestJobStatus(job.id, {
      status: "failed",
      finishedAt,
      lastErrorSummary,
      attemptCount,
      metadata: buildExecutionTelemetryMetadata(telemetryContext, {
        status: "failed",
        attemptCount,
        startedAt,
        finishedAt,
        failure,
        lastErrorSummary,
      }),
    });

    throw error;
  }
}
