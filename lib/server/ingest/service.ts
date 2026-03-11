import "server-only";

import { BackendError } from "../errors";
import { logger } from "../logging";
import {
  createProviderFetchContext,
  createProviderRuntimeContext,
  type RepairIntakeSignal,
  type ProviderPageResult,
  type ProviderRegistry,
  type ProviderRuntimeContext,
  type RepairSignalSeverity,
  type RepairSignalTrigger,
  type SourceHealthFinding,
  type SourceHealthState,
} from "../provider";

import type {
  CreateRepairIntakePlanRequest,
  IngestDetailRequest,
  IngestDetailRunResult,
  IngestPagePersistencePlan,
  IngestPageRequest,
  IngestPageRunResult,
  IngestRepairIntakePlan,
  IngestSourceProbeRequest,
  IngestSourceProbeRunResult,
  IngestSourceRefreshRequest,
  IngestSourceRefreshRunResult,
} from "./types";

const ingestLogger = logger.child({ subsystem: "ingest.service" });

const actionableHealthStates = new Set<SourceHealthState>(["degraded", "broken", "replaced", "offline"]);

const repairSignalTriggerByHealthState: Record<Exclude<SourceHealthState, "healthy">, RepairSignalTrigger> = {
  degraded: "source_degraded",
  broken: "source_broken",
  replaced: "source_replaced",
  offline: "source_offline",
};

const repairSignalSeverityByHealthState: Record<Exclude<SourceHealthState, "healthy">, RepairSignalSeverity> = {
  degraded: "medium",
  broken: "high",
  replaced: "high",
  offline: "critical",
};

function createIngestContext(
  request: Pick<IngestPageRequest, "requestId" | "actorId">,
  runtimeOverrides: Partial<ProviderRuntimeContext>,
) {
  const runtime = createProviderRuntimeContext(runtimeOverrides);

  return {
    ...runtime,
    ...createProviderFetchContext({
      requestId: request.requestId,
      actorId: request.actorId,
      requestedAt: runtime.now().toISOString(),
    }),
  };
}

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

function createRepairSignalKey(signal: RepairIntakeSignal): string {
  return [
    signal.sourceId,
    signal.trigger,
    signal.healthState,
    signal.providerItemId ?? "",
    signal.providerLineKey ?? "",
    signal.probeKind ?? "",
  ].join(":");
}

function createAutoRepairSignal(finding: SourceHealthFinding, capturedAt: string): RepairIntakeSignal | undefined {
  if (!actionableHealthStates.has(finding.observedState) || finding.observedState === "healthy") {
    return undefined;
  }

  return {
    sourceId: finding.sourceId,
    createdAt: capturedAt,
    healthState: finding.observedState,
    trigger: repairSignalTriggerByHealthState[finding.observedState],
    severity: repairSignalSeverityByHealthState[finding.observedState],
    summary: finding.summary,
    probeKind: finding.probeKind,
    providerItemId: finding.providerItemId,
    providerLineKey: finding.providerLineKey,
    evidence: finding.evidence,
  };
}

export function createRepairIntakePlan(request: CreateRepairIntakePlanRequest): IngestRepairIntakePlan {
  const signalMap = new Map<string, RepairIntakeSignal>();

  for (const signal of request.signals ?? []) {
    signalMap.set(createRepairSignalKey(signal), signal);
  }

  for (const finding of request.findings) {
    const autoSignal = createAutoRepairSignal(finding, request.capturedAt);

    if (autoSignal) {
      signalMap.set(createRepairSignalKey(autoSignal), autoSignal);
    }
  }

  return {
    providerKey: request.providerKey,
    requestId: request.requestId,
    capturedAt: request.capturedAt,
    target: request.target,
    findings: request.findings,
    signals: [...signalMap.values()],
  };
}

export async function ingestProviderPage(
  registry: ProviderRegistry,
  request: IngestPageRequest,
  runtimeOverrides: Partial<ProviderRuntimeContext> = {},
): Promise<IngestPageRunResult> {
  const adapter = registry.get(request.providerKey);
  const context = createIngestContext(request, runtimeOverrides);

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

  const context = createIngestContext(request, runtimeOverrides);

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

export async function ingestProviderSourceRefresh(
  registry: ProviderRegistry,
  request: IngestSourceRefreshRequest,
  runtimeOverrides: Partial<ProviderRuntimeContext> = {},
): Promise<IngestSourceRefreshRunResult> {
  const adapter = registry.get(request.providerKey);

  if (!adapter.refreshSource) {
    throw new BackendError(`Provider adapter '${request.providerKey}' does not implement refreshSource.`, {
      status: 400,
      code: "provider_refresh_source_not_supported",
    });
  }

  const context = createIngestContext(request, runtimeOverrides);

  ingestLogger.info("Starting provider source refresh", {
    providerKey: request.providerKey,
    reason: request.reason,
    sourceId: request.target.sourceId,
    providerItemId: request.target.providerItemId,
    providerLineKey: request.target.providerLineKey,
  });

  const result = await adapter.refreshSource(
    {
      target: request.target,
      reason: request.reason,
    },
    context,
  );

  const repair = createRepairIntakePlan({
    providerKey: request.providerKey,
    requestId: request.requestId,
    capturedAt: result.fetchedAt,
    target: result.target,
    findings: result.findings,
    signals: result.repairSignals,
  });

  if (repair.signals.length > 0) {
    ingestLogger.warn("Provider source refresh emitted repair intake signals", {
      providerKey: request.providerKey,
      sourceId: request.target.sourceId,
      repairSignalCount: repair.signals.length,
    });
  }

  return {
    providerKey: request.providerKey,
    reason: request.reason,
    rawPayloadCount: result.rawPayloads.length,
    findingCount: result.findings.length,
    repairSignalCount: repair.signals.length,
    persistence: {
      providerKey: request.providerKey,
      reason: request.reason,
      fetchedAt: result.fetchedAt,
      requestId: request.requestId,
      request: result.request,
      target: result.target,
      payloads: result.rawPayloads,
      item: result.item,
      findings: result.findings,
      repair,
    },
  };
}

export async function ingestProviderSourceProbe(
  registry: ProviderRegistry,
  request: IngestSourceProbeRequest,
  runtimeOverrides: Partial<ProviderRuntimeContext> = {},
): Promise<IngestSourceProbeRunResult> {
  const adapter = registry.get(request.providerKey);

  if (!adapter.probeSource) {
    throw new BackendError(`Provider adapter '${request.providerKey}' does not implement probeSource.`, {
      status: 400,
      code: "provider_probe_source_not_supported",
    });
  }

  const context = createIngestContext(request, runtimeOverrides);

  ingestLogger.info("Starting provider source probe", {
    providerKey: request.providerKey,
    reason: request.reason,
    probeKind: request.probeKind,
    sourceId: request.target.sourceId,
    providerItemId: request.target.providerItemId,
    providerLineKey: request.target.providerLineKey,
  });

  const result = await adapter.probeSource(
    {
      target: request.target,
      probeKind: request.probeKind,
      reason: request.reason,
    },
    context,
  );

  const repair = createRepairIntakePlan({
    providerKey: request.providerKey,
    requestId: request.requestId,
    capturedAt: result.probedAt,
    target: result.target,
    findings: result.findings,
    signals: result.repairSignals,
  });

  if (repair.signals.length > 0) {
    ingestLogger.warn("Provider source probe emitted repair intake signals", {
      providerKey: request.providerKey,
      sourceId: request.target.sourceId,
      probeKind: request.probeKind,
      repairSignalCount: repair.signals.length,
    });
  }

  return {
    providerKey: request.providerKey,
    reason: request.reason,
    probeKind: request.probeKind,
    rawPayloadCount: result.rawPayloads.length,
    findingCount: result.findings.length,
    repairSignalCount: repair.signals.length,
    persistence: {
      providerKey: request.providerKey,
      reason: request.reason,
      probeKind: request.probeKind,
      probedAt: result.probedAt,
      requestId: request.requestId,
      request: result.request,
      target: result.target,
      payloads: result.rawPayloads,
      findings: result.findings,
      repair,
    },
  };
}
