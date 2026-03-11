import "server-only";

import {
  ingestProviderSourceProbe,
  ingestProviderSourceRefresh,
} from "./service";
import {
  buildExecutionTelemetryMetadata,
  classifyIngestExecutionFailure,
  createSourceProbeTelemetryContext,
  createSourceRefreshTelemetryContext,
} from "./telemetry";

import type { ProviderCapability, ProviderRegistry, ProviderRuntimeContext } from "../provider";
import type {
  PersistedIngestJobRecord,
  PersistedIngestRunRecord,
  PersistedProviderRegistryRecord,
  ProviderRegistryType,
} from "../../db/repositories/staging/types";
import type { RepairQueueEntryRecord, SourceProbeRunRecord } from "../health";
import type {
  IngestJobCreateInput,
  IngestJobStatusUpdateInput,
  IngestRunCreateInput,
  IngestRunStatusUpdateInput,
} from "../../db/repositories/staging/types";
import type {
  IngestSourceProbeRequest,
  IngestSourceProbeRunResult,
  IngestSourceRefreshRequest,
  IngestSourceRefreshRunResult,
} from "./types";

export interface SourceJobPersistenceGateway {
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
}

export interface SourceJobHealthGateway {
  recordSourceRefreshHealth(request: {
    providerKey: string;
    actorId?: string;
    requestId?: string;
    persistence: IngestSourceRefreshRunResult["persistence"];
  }): Promise<{ probeRun: SourceProbeRunRecord; repairQueue: RepairQueueEntryRecord[] }>;
  recordSourceProbeHealth(request: {
    providerKey: string;
    actorId?: string;
    requestId?: string;
    persistence: IngestSourceProbeRunResult["persistence"];
  }): Promise<{ probeRun: SourceProbeRunRecord; repairQueue: RepairQueueEntryRecord[] }>;
}

export interface ExecuteScheduledSourceRefreshJobResult {
  provider: PersistedProviderRegistryRecord;
  job: PersistedIngestJobRecord;
  run: PersistedIngestRunRecord;
  ingest: IngestSourceRefreshRunResult;
  health: {
    probeRun: SourceProbeRunRecord;
    repairQueue: RepairQueueEntryRecord[];
  };
}

export interface ExecuteScheduledSourceProbeJobResult {
  provider: PersistedProviderRegistryRecord;
  job: PersistedIngestJobRecord;
  run: PersistedIngestRunRecord;
  ingest: IngestSourceProbeRunResult;
  health: {
    probeRun: SourceProbeRunRecord;
    repairQueue: RepairQueueEntryRecord[];
  };
}

function deriveProviderType(capabilities: ProviderCapability[]): ProviderRegistryType {
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

async function queueSourceJob(
  persistence: SourceJobPersistenceGateway,
  provider: PersistedProviderRegistryRecord,
  input: {
    mode: IngestJobCreateInput["mode"];
    scope: IngestRunCreateInput["scope"];
    requestId?: string;
    actorId?: string;
    providerItemId: string;
    pendingMetadata: Record<string, unknown>;
    buildRunningMetadata(attemptCount: number, lastErrorSummary: string | null): Record<string, unknown>;
  },
) {
  const job = await persistence.createIngestJob({
    providerId: provider.id,
    mode: input.mode,
    status: "pending",
    requestId: input.requestId,
    actorId: input.actorId,
    metadata: input.pendingMetadata,
  });
  const run = await persistence.createIngestRun({
    ingestJobId: job.id,
    providerId: provider.id,
    mode: input.mode,
    scope: input.scope,
    status: "pending",
    requestId: input.requestId,
    actorId: input.actorId,
    providerItemId: input.providerItemId,
    metadata: input.pendingMetadata,
  });
  const attemptCount = job.attemptCount + 1;
  const runningJob = await persistence.updateIngestJobStatus(job.id, {
    status: "running",
    attemptCount,
    metadata: input.buildRunningMetadata(attemptCount, job.lastErrorSummary ?? null),
  });
  const runningRun = await persistence.updateIngestRunStatus(run.id, {
    status: "running",
    metadata: input.buildRunningMetadata(attemptCount, job.lastErrorSummary ?? null),
  });

  return {
    attemptCount,
    job: runningJob,
    run: runningRun,
  };
}

export async function executeScheduledSourceRefreshJob(
  persistence: SourceJobPersistenceGateway,
  health: SourceJobHealthGateway,
  registry: ProviderRegistry,
  request: IngestSourceRefreshRequest,
  runtimeOverrides: Partial<ProviderRuntimeContext> = {},
): Promise<ExecuteScheduledSourceRefreshJobResult> {
  const adapter = registry.get(request.providerKey);
  const now = runtimeOverrides.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const telemetryContext = createSourceRefreshTelemetryContext(request);
  const provider = await persistence.upsertProviderRegistry({
    adapterKey: adapter.metadata.key,
    displayName: adapter.metadata.displayName,
    providerType: deriveProviderType(adapter.metadata.capabilities),
    capabilities: adapter.metadata.capabilities,
    baseUrl: adapter.metadata.baseUrl,
    enabled: adapter.metadata.enabledByDefault ?? true,
  });
  const { attemptCount, job, run } = await queueSourceJob(persistence, provider, {
    mode: "incremental",
    scope: "source_refresh",
    requestId: request.requestId,
    actorId: request.actorId,
    providerItemId: request.target.providerItemId,
    pendingMetadata: buildExecutionTelemetryMetadata(telemetryContext, {
      status: "pending",
      attemptCount: 0,
    }),
    buildRunningMetadata(attemptCount, lastErrorSummary) {
      return buildExecutionTelemetryMetadata(telemetryContext, {
        status: "running",
        attemptCount,
        startedAt,
        lastErrorSummary,
      });
    },
  });

  try {
    const ingest = await ingestProviderSourceRefresh(registry, request, runtimeOverrides);
    const persistedHealth = await health.recordSourceRefreshHealth({
      providerKey: request.providerKey,
      actorId: request.actorId,
      requestId: request.requestId,
      persistence: ingest.persistence,
    });
    const finishedAt = now().toISOString();
    const updatedRun = await persistence.updateIngestRunStatus(run.id, {
      status: "succeeded",
      finishedAt,
      itemCount: ingest.persistence.item ? 1 : 0,
      rawPayloadCount: ingest.rawPayloadCount,
      warningCount: ingest.findingCount,
      metadata: {
        ...buildExecutionTelemetryMetadata(telemetryContext, {
          status: "succeeded",
          attemptCount,
          startedAt,
          finishedAt,
          itemCount: ingest.persistence.item ? 1 : 0,
          rawPayloadCount: ingest.rawPayloadCount,
          warningCount: ingest.findingCount,
        }),
        probeRunId: persistedHealth.probeRun.id,
        repairQueueCount: persistedHealth.repairQueue.length,
        observedState: persistedHealth.probeRun.observedState ?? null,
      },
    });
    const updatedJob = await persistence.updateIngestJobStatus(job.id, {
      status: "succeeded",
      finishedAt,
      attemptCount,
      metadata: {
        ...buildExecutionTelemetryMetadata(telemetryContext, {
          status: "succeeded",
          attemptCount,
          startedAt,
          finishedAt,
        }),
        probeRunId: persistedHealth.probeRun.id,
        repairQueueCount: persistedHealth.repairQueue.length,
      },
    });

    return {
      provider,
      job: updatedJob,
      run: updatedRun,
      ingest,
      health: persistedHealth,
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

export async function executeScheduledSourceProbeJob(
  persistence: SourceJobPersistenceGateway,
  health: SourceJobHealthGateway,
  registry: ProviderRegistry,
  request: IngestSourceProbeRequest,
  runtimeOverrides: Partial<ProviderRuntimeContext> = {},
): Promise<ExecuteScheduledSourceProbeJobResult> {
  const adapter = registry.get(request.providerKey);
  const now = runtimeOverrides.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const telemetryContext = createSourceProbeTelemetryContext(request);
  const provider = await persistence.upsertProviderRegistry({
    adapterKey: adapter.metadata.key,
    displayName: adapter.metadata.displayName,
    providerType: deriveProviderType(adapter.metadata.capabilities),
    capabilities: adapter.metadata.capabilities,
    baseUrl: adapter.metadata.baseUrl,
    enabled: adapter.metadata.enabledByDefault ?? true,
  });
  const { attemptCount, job, run } = await queueSourceJob(persistence, provider, {
    mode: "incremental",
    scope: "source_probe",
    requestId: request.requestId,
    actorId: request.actorId,
    providerItemId: request.target.providerItemId,
    pendingMetadata: buildExecutionTelemetryMetadata(telemetryContext, {
      status: "pending",
      attemptCount: 0,
    }),
    buildRunningMetadata(attemptCount, lastErrorSummary) {
      return buildExecutionTelemetryMetadata(telemetryContext, {
        status: "running",
        attemptCount,
        startedAt,
        lastErrorSummary,
      });
    },
  });

  try {
    const ingest = await ingestProviderSourceProbe(registry, request, runtimeOverrides);
    const persistedHealth = await health.recordSourceProbeHealth({
      providerKey: request.providerKey,
      actorId: request.actorId,
      requestId: request.requestId,
      persistence: ingest.persistence,
    });
    const finishedAt = now().toISOString();
    const updatedRun = await persistence.updateIngestRunStatus(run.id, {
      status: "succeeded",
      finishedAt,
      itemCount: 1,
      rawPayloadCount: ingest.rawPayloadCount,
      warningCount: ingest.findingCount,
      metadata: {
        ...buildExecutionTelemetryMetadata(telemetryContext, {
          status: "succeeded",
          attemptCount,
          startedAt,
          finishedAt,
          itemCount: 1,
          rawPayloadCount: ingest.rawPayloadCount,
          warningCount: ingest.findingCount,
        }),
        probeRunId: persistedHealth.probeRun.id,
        repairQueueCount: persistedHealth.repairQueue.length,
        observedState: persistedHealth.probeRun.observedState ?? null,
      },
    });
    const updatedJob = await persistence.updateIngestJobStatus(job.id, {
      status: "succeeded",
      finishedAt,
      attemptCount,
      metadata: {
        ...buildExecutionTelemetryMetadata(telemetryContext, {
          status: "succeeded",
          attemptCount,
          startedAt,
          finishedAt,
        }),
        probeRunId: persistedHealth.probeRun.id,
        repairQueueCount: persistedHealth.repairQueue.length,
      },
    });

    return {
      provider,
      job: updatedJob,
      run: updatedRun,
      ingest,
      health: persistedHealth,
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
