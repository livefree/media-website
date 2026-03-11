import "server-only";

import type { Prisma } from "@prisma/client";

import type { RepositoryContext } from "../types";
import { BaseRepository, createRepositoryContext } from "../types";
import { requireDb } from "../../client";

import type {
  ProviderMaintenanceReason,
  ProviderRequestMetadata,
  ProviderPayloadFormat,
  RepairSignalSeverity,
  RepairSignalTrigger,
  SourceHealthFinding,
  SourceHealthState,
  SourceProbeKind,
} from "../../../server/provider";
import type {
  AdminRepairQueueItemRecord,
  PersistSourceProbeHealthRequest,
  PersistSourceRefreshHealthRequest,
  RepairQueueQuery,
  RepairQueueEntryRecord,
  RepairQueueStatusUpdateInput,
  RepairQueueStatus,
  SourceProbeRunRecord,
  SourceProbeStatus,
} from "../../../server/health";
import type { SourceHealthRepository as SourceHealthRepositoryContract } from "./types";

const sourceHealthStateMap = {
  healthy: "HEALTHY",
  degraded: "DEGRADED",
  broken: "BROKEN",
  replaced: "REPLACED",
  offline: "OFFLINE",
} as const;

const providerMaintenanceReasonMap = {
  scheduled: "SCHEDULED",
  manual: "MANUAL",
  repair: "REPAIR",
} as const;

const sourceProbeKindMap = {
  availability: "AVAILABILITY",
  manifest: "MANIFEST",
  playback: "PLAYBACK",
  download: "DOWNLOAD",
  subtitle: "SUBTITLE",
  metadata_refresh: "METADATA_REFRESH",
} as const;

const sourceProbeStatusMap = {
  pending: "PENDING",
  running: "RUNNING",
  succeeded: "SUCCEEDED",
  failed: "FAILED",
  cancelled: "CANCELLED",
} as const;

const repairSignalTriggerMap = {
  source_degraded: "SOURCE_DEGRADED",
  source_broken: "SOURCE_BROKEN",
  source_offline: "SOURCE_OFFLINE",
  source_replaced: "SOURCE_REPLACED",
  provider_item_missing: "PROVIDER_ITEM_MISSING",
  provider_line_missing: "PROVIDER_LINE_MISSING",
  provider_payload_mismatch: "PROVIDER_PAYLOAD_MISMATCH",
  manual_followup: "MANUAL_FOLLOWUP",
} as const;

const repairSignalSeverityMap = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "CRITICAL",
} as const;

const repairQueueStatusMap = {
  open: "OPEN",
  in_progress: "IN_PROGRESS",
  waiting_provider: "WAITING_PROVIDER",
  resolved: "RESOLVED",
  dismissed: "DISMISSED",
} as const;

const payloadFormatMap = {
  json: "JSON",
  xml: "XML",
  html: "HTML",
  text: "TEXT",
  other: "OTHER",
} as const;

const payloadScopeMap = {
  page: "PAGE",
  detail: "DETAIL",
  source_refresh: "SOURCE_REFRESH",
  source_probe: "SOURCE_PROBE",
} as const;

function toDate(value?: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(value);
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

function fromJsonValue<T>(value: Prisma.JsonValue | null): T | null {
  if (value === null) {
    return null;
  }

  return value as T;
}

function mapSourceHealthState(value: SourceHealthState) {
  return sourceHealthStateMap[value];
}

function mapProviderMaintenanceReason(value: ProviderMaintenanceReason) {
  return providerMaintenanceReasonMap[value];
}

function mapSourceProbeKind(value: SourceProbeKind) {
  return sourceProbeKindMap[value];
}

function mapSourceProbeStatus(value: SourceProbeStatus) {
  return sourceProbeStatusMap[value];
}

function mapRepairSignalTrigger(value: RepairSignalTrigger) {
  return repairSignalTriggerMap[value];
}

function mapRepairSignalSeverity(value: RepairSignalSeverity) {
  return repairSignalSeverityMap[value];
}

function mapRepairQueueStatus(value: RepairQueueStatus) {
  return repairQueueStatusMap[value];
}

function mapPayloadFormat(value: ProviderPayloadFormat) {
  return payloadFormatMap[value];
}

function mapPayloadScope(value: "page" | "detail" | "source_refresh" | "source_probe") {
  return payloadScopeMap[value];
}

function unmapSourceHealthState(value: string): SourceHealthState {
  switch (value) {
    case "HEALTHY":
      return "healthy";
    case "DEGRADED":
      return "degraded";
    case "BROKEN":
      return "broken";
    case "REPLACED":
      return "replaced";
    case "OFFLINE":
      return "offline";
  }

  throw new Error(`Unsupported source health state: ${value}`);
}

function unmapProviderMaintenanceReason(value: string): ProviderMaintenanceReason {
  switch (value) {
    case "SCHEDULED":
      return "scheduled";
    case "MANUAL":
      return "manual";
    case "REPAIR":
      return "repair";
  }

  throw new Error(`Unsupported maintenance reason: ${value}`);
}

function unmapSourceProbeKind(value: string): SourceProbeKind {
  switch (value) {
    case "AVAILABILITY":
      return "availability";
    case "MANIFEST":
      return "manifest";
    case "PLAYBACK":
      return "playback";
    case "DOWNLOAD":
      return "download";
    case "SUBTITLE":
      return "subtitle";
    case "METADATA_REFRESH":
      return "metadata_refresh";
  }

  throw new Error(`Unsupported source probe kind: ${value}`);
}

function unmapSourceProbeStatus(value: string): SourceProbeStatus {
  switch (value) {
    case "PENDING":
      return "pending";
    case "RUNNING":
      return "running";
    case "SUCCEEDED":
      return "succeeded";
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
  }

  throw new Error(`Unsupported source probe status: ${value}`);
}

function unmapRepairSignalTrigger(value: string): RepairSignalTrigger {
  switch (value) {
    case "SOURCE_DEGRADED":
      return "source_degraded";
    case "SOURCE_BROKEN":
      return "source_broken";
    case "SOURCE_OFFLINE":
      return "source_offline";
    case "SOURCE_REPLACED":
      return "source_replaced";
    case "PROVIDER_ITEM_MISSING":
      return "provider_item_missing";
    case "PROVIDER_LINE_MISSING":
      return "provider_line_missing";
    case "PROVIDER_PAYLOAD_MISMATCH":
      return "provider_payload_mismatch";
    case "MANUAL_FOLLOWUP":
      return "manual_followup";
  }

  throw new Error(`Unsupported repair trigger: ${value}`);
}

function unmapRepairSignalSeverity(value: string): RepairSignalSeverity {
  switch (value) {
    case "LOW":
      return "low";
    case "MEDIUM":
      return "medium";
    case "HIGH":
      return "high";
    case "CRITICAL":
      return "critical";
  }

  throw new Error(`Unsupported repair severity: ${value}`);
}

function unmapRepairQueueStatus(value: string): RepairQueueStatus {
  switch (value) {
    case "OPEN":
      return "open";
    case "IN_PROGRESS":
      return "in_progress";
    case "WAITING_PROVIDER":
      return "waiting_provider";
    case "RESOLVED":
      return "resolved";
    case "DISMISSED":
      return "dismissed";
  }

  throw new Error(`Unsupported repair queue status: ${value}`);
}

function mapSourceProbeRunRecord(record: Prisma.SourceProbeRunGetPayload<Record<string, never>>): SourceProbeRunRecord {
  return {
    id: record.id,
    resourceId: record.resourceId,
    providerId: record.providerId,
    providerItemId: record.providerItemId,
    providerLineKey: record.providerLineKey,
    probeKind: unmapSourceProbeKind(record.probeKind),
    maintenanceReason: unmapProviderMaintenanceReason(record.maintenanceReason),
    status: unmapSourceProbeStatus(record.status),
    requestId: record.requestId,
    actorId: record.actorId,
    observedState: record.observedState ? unmapSourceHealthState(record.observedState) : null,
    summary: record.summary,
    failureSummary: record.failureSummary,
    payloadCount: record.payloadCount,
    evidence: fromJsonValue<Record<string, unknown>>(record.evidence),
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapRepairQueueEntryRecord(record: Prisma.RepairQueueEntryGetPayload<Record<string, never>>): RepairQueueEntryRecord {
  return {
    id: record.id,
    resourceId: record.resourceId,
    probeRunId: record.probeRunId,
    providerId: record.providerId,
    providerItemId: record.providerItemId,
    providerLineKey: record.providerLineKey,
    trigger: unmapRepairSignalTrigger(record.trigger),
    severity: unmapRepairSignalSeverity(record.severity),
    currentHealthState: unmapSourceHealthState(record.currentHealthState),
    status: unmapRepairQueueStatus(record.status),
    summary: record.summary,
    evidence: fromJsonValue<Record<string, unknown>>(record.evidence),
    createdAt: record.createdAt,
    lastObservedAt: record.lastObservedAt,
    resolvedAt: record.resolvedAt,
    updatedAt: record.updatedAt,
  };
}

function buildEpisodeLabel(record: {
  resource: {
    episode?: {
      episodeNumber: number | null;
      title: string;
    } | null;
  };
}) {
  if (!record.resource.episode) {
    return null;
  }

  if (record.resource.episode.episodeNumber) {
    return `E${String(record.resource.episode.episodeNumber).padStart(2, "0")} · ${record.resource.episode.title}`;
  }

  return record.resource.episode.title;
}

function buildRepairQueueWhere(query?: RepairQueueQuery): Prisma.RepairQueueEntryWhereInput {
  const search = query?.search?.trim();

  return {
    providerId: query?.providerId,
    status: query?.statuses?.length
      ? {
          in: query.statuses.map((status) => mapRepairQueueStatus(status)),
        }
      : undefined,
    severity: query?.severities?.length
      ? {
          in: query.severities.map((severity) => mapRepairSignalSeverity(severity)),
        }
      : undefined,
    currentHealthState: query?.healthStates?.length
      ? {
          in: query.healthStates.map((state) => mapSourceHealthState(state)),
        }
      : undefined,
    OR: search
      ? [
          {
            summary: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            resource: {
              label: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            resource: {
              media: {
                OR: [
                  {
                    title: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    originalTitle: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                ],
              },
            },
          },
          {
            resource: {
              episode: {
                title: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            providerRegistry: {
              displayName: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ]
      : undefined,
  };
}

function mapAdminRepairQueueItemRecord(
  record: Prisma.RepairQueueEntryGetPayload<{
    include: {
      resource: {
        include: {
          media: {
            select: {
              publicId: true;
              title: true;
              slug: true;
            };
          };
          episode: {
            select: {
              publicId: true;
              title: true;
              episodeNumber: true;
            };
          };
        };
      };
      providerRegistry: {
        select: {
          adapterKey: true;
          displayName: true;
        };
      };
      probeRun: {
        select: {
          probeKind: true;
          summary: true;
        };
      };
    };
  }>,
): AdminRepairQueueItemRecord {
  const base = mapRepairQueueEntryRecord(record);

  return {
    ...base,
    resourcePublicId: record.resource.publicId,
    resourceKind: record.resource.kind.toLowerCase() as AdminRepairQueueItemRecord["resourceKind"],
    resourceLabel: record.resource.label,
    mediaPublicId: record.resource.media.publicId,
    mediaTitle: record.resource.media.title,
    mediaSlug: record.resource.media.slug,
    episodePublicId: record.resource.episode?.publicId ?? null,
    episodeTitle: record.resource.episode?.title ?? null,
    episodeLabel: buildEpisodeLabel(record),
    providerAdapterKey: record.providerRegistry?.adapterKey ?? null,
    providerDisplayName: record.providerRegistry?.displayName ?? null,
    probeKind: record.probeRun ? unmapSourceProbeKind(record.probeRun.probeKind) : null,
    probeSummary: record.probeRun?.summary ?? null,
  };
}

function rankHealthState(value: SourceHealthState): number {
  switch (value) {
    case "healthy":
      return 0;
    case "degraded":
      return 1;
    case "broken":
      return 2;
    case "replaced":
      return 3;
    case "offline":
      return 4;
  }
}

function resolveObservedState(findings: SourceHealthFinding[]): SourceHealthState {
  if (findings.length === 0) {
    return "healthy";
  }

  return [...findings].sort((left, right) => rankHealthState(right.observedState) - rankHealthState(left.observedState))[0]!
    .observedState;
}

function summarizeFindings(findings: SourceHealthFinding[], fallback: string): string {
  if (findings.length === 0) {
    return fallback;
  }

  return findings
    .map((finding) => finding.summary.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" | ");
}

function buildProbeEvidence(request: {
  request: ProviderRequestMetadata;
  target: {
    sourceId: string;
    providerItemId: string;
    sourceKind: string;
    providerLineKey?: string;
    urls: string[];
    metadata?: Record<string, unknown>;
  };
  findings: SourceHealthFinding[];
}) {
  return {
    request: request.request,
    target: {
      sourceId: request.target.sourceId,
      providerItemId: request.target.providerItemId,
      sourceKind: request.target.sourceKind,
      providerLineKey: request.target.providerLineKey ?? null,
      urls: request.target.urls,
      metadata: request.target.metadata ?? null,
    },
    findings: request.findings.map((finding) => ({
      sourceId: finding.sourceId,
      observedAt: finding.observedAt,
      observedState: finding.observedState,
      probeKind: finding.probeKind,
      summary: finding.summary,
      code: finding.code ?? null,
      providerItemId: finding.providerItemId ?? null,
      providerLineKey: finding.providerLineKey ?? null,
      evidence: finding.evidence ?? null,
    })),
  };
}

export class SourceHealthRepository extends BaseRepository implements SourceHealthRepositoryContract {
  public constructor(context: RepositoryContext) {
    super(context);
  }

  async recordSourceRefreshHealth(
    request: PersistSourceRefreshHealthRequest,
  ): Promise<{ probeRun: SourceProbeRunRecord; repairQueue: RepairQueueEntryRecord[] }> {
    return this.persistSourceHealth({
      providerKey: request.providerKey,
      actorId: request.actorId,
      requestId: request.requestId,
      kind: "metadata_refresh",
      observedAt: request.persistence.fetchedAt,
      reason: request.persistence.reason,
      requestMetadata: request.persistence.request,
      target: request.persistence.target,
      payloads: request.persistence.payloads,
      findings: request.persistence.findings,
      repairSignals: request.persistence.repair.signals,
    });
  }

  async recordSourceProbeHealth(
    request: PersistSourceProbeHealthRequest,
  ): Promise<{ probeRun: SourceProbeRunRecord; repairQueue: RepairQueueEntryRecord[] }> {
    return this.persistSourceHealth({
      providerKey: request.providerKey,
      actorId: request.actorId,
      requestId: request.requestId,
      kind: request.persistence.probeKind,
      observedAt: request.persistence.probedAt,
      reason: request.persistence.reason,
      requestMetadata: request.persistence.request,
      target: request.persistence.target,
      payloads: request.persistence.payloads,
      findings: request.persistence.findings,
      repairSignals: request.persistence.repair.signals,
    });
  }

  async listRepairQueue(statuses?: RepairQueueStatus[]): Promise<RepairQueueEntryRecord[]> {
    const records = await this.db.repairQueueEntry.findMany({
      where: statuses?.length
        ? {
            status: {
              in: statuses.map((status) => mapRepairQueueStatus(status)),
            },
          }
        : undefined,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    });

    return records.map((record) => mapRepairQueueEntryRecord(record));
  }

  async listAdminRepairQueue(query?: RepairQueueQuery): Promise<AdminRepairQueueItemRecord[]> {
    const records = await this.db.repairQueueEntry.findMany({
      where: buildRepairQueueWhere(query),
      include: {
        resource: {
          include: {
            media: {
              select: {
                publicId: true,
                title: true,
                slug: true,
              },
            },
            episode: {
              select: {
                publicId: true,
                title: true,
                episodeNumber: true,
              },
            },
          },
        },
        providerRegistry: {
          select: {
            adapterKey: true,
            displayName: true,
          },
        },
        probeRun: {
          select: {
            probeKind: true,
            summary: true,
          },
        },
      },
      orderBy: [{ severity: "desc" }, { lastObservedAt: "desc" }, { createdAt: "desc" }],
    });

    return records.map((record) => mapAdminRepairQueueItemRecord(record));
  }

  async updateRepairQueueEntryStatus(entryId: string, input: RepairQueueStatusUpdateInput): Promise<RepairQueueEntryRecord> {
    const resolvedAt =
      input.status === "resolved" || input.status === "dismissed"
        ? toDate(input.resolvedAt) ?? new Date()
        : input.status === "open" || input.status === "in_progress" || input.status === "waiting_provider"
          ? null
          : undefined;

    const record = await this.db.repairQueueEntry.update({
      where: {
        id: entryId,
      },
      data: {
        status: mapRepairQueueStatus(input.status),
        resolvedAt,
        lastObservedAt: new Date(),
      },
    });

    return mapRepairQueueEntryRecord(record);
  }

  private async persistSourceHealth(input: {
    providerKey: string;
    actorId?: string;
    requestId?: string;
    kind: SourceProbeKind;
    observedAt: string;
    reason: ProviderMaintenanceReason;
    requestMetadata: ProviderRequestMetadata;
    target: {
      sourceId: string;
      providerItemId: string;
      sourceKind: string;
      providerLineKey?: string;
      urls: string[];
      metadata?: Record<string, unknown>;
    };
    payloads: Array<{
      providerKey: string;
      providerItemId?: string;
      payloadFormat: ProviderPayloadFormat;
      scope: "page" | "detail" | "source_refresh" | "source_probe";
      body: string | Record<string, unknown>;
      fetchedAt: string;
      request: {
        requestUrl?: string;
        method?: "GET" | "POST";
        cursor?: string;
        page?: number;
      };
    }>;
    findings: SourceHealthFinding[];
    repairSignals: Array<{
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
    }>;
  }): Promise<{ probeRun: SourceProbeRunRecord; repairQueue: RepairQueueEntryRecord[] }> {
    const provider = await this.db.providerRegistry.findUnique({
      where: {
        adapterKey: input.providerKey,
      },
    });

    if (!provider) {
      throw new Error(`Provider '${input.providerKey}' is not registered.`);
    }

    const resource = await this.db.resource.findFirst({
      where: {
        OR: [{ publicId: input.target.sourceId }, { id: input.target.sourceId }],
      },
    });

    if (!resource) {
      throw new Error(`Resource '${input.target.sourceId}' was not found.`);
    }

    const providerItem = await this.db.providerItem.findFirst({
      where: {
        providerId: provider.id,
        externalId: input.target.providerItemId,
      },
    });

    const observedState = resolveObservedState(input.findings);
    const summary = summarizeFindings(input.findings, `Source ${input.kind.replace(/_/g, " ")} completed with no issues.`);
    const observedAt = new Date(input.observedAt);
    const evidence = buildProbeEvidence({
      request: input.requestMetadata,
      target: input.target,
      findings: input.findings,
    });

    const probeRun = await this.db.sourceProbeRun.create({
      data: {
        resourceId: resource.id,
        providerId: provider.id,
        providerItemId: providerItem?.id ?? resource.providerItemId ?? null,
        providerLineKey: input.target.providerLineKey ?? null,
        probeKind: mapSourceProbeKind(input.kind),
        maintenanceReason: mapProviderMaintenanceReason(input.reason),
        status: mapSourceProbeStatus("succeeded"),
        requestId: input.requestId,
        actorId: input.actorId,
        observedState: mapSourceHealthState(observedState),
        summary,
        payloadCount: input.payloads.length,
        evidence: toJsonValue(evidence),
        startedAt: observedAt,
        completedAt: observedAt,
      },
    });

    if (input.payloads.length > 0) {
      await this.db.providerRawPayload.createMany({
        data: input.payloads.map((payload) => ({
          providerId: provider.id,
          providerItemId: providerItem?.id ?? null,
          externalItemId: payload.providerItemId ?? input.target.providerItemId,
          payloadFormat: mapPayloadFormat(payload.payloadFormat),
          scope: mapPayloadScope(payload.scope),
          requestUrl: payload.request.requestUrl ?? null,
          requestMethod: payload.request.method ?? null,
          requestCursor: payload.request.cursor ?? null,
          requestPage: payload.request.page ?? null,
          body: typeof payload.body === "string" ? ({ text: payload.body } as Prisma.InputJsonValue) : (payload.body as Prisma.InputJsonValue),
          fetchedAt: toDate(payload.fetchedAt) ?? observedAt,
        })),
      });
    }

    await this.db.resource.update({
      where: {
        id: resource.id,
      },
      data: {
        providerId: provider.id,
        providerItemId: providerItem?.id ?? resource.providerItemId ?? null,
        providerLineKey: input.target.providerLineKey ?? resource.providerLineKey ?? null,
        healthState: mapSourceHealthState(observedState),
        healthSummary: summary,
        lastCheckedAt: observedAt,
        lastHealthyAt: observedState === "healthy" ? observedAt : resource.lastHealthyAt,
        failureCount: observedState === "healthy" ? 0 : { increment: 1 },
        status:
          observedState === "healthy"
            ? "ONLINE"
            : observedState === "degraded"
              ? "DEGRADED"
              : "OFFLINE",
      },
    });

    if (observedState === "healthy") {
      await this.db.repairQueueEntry.updateMany({
        where: {
          resourceId: resource.id,
          status: {
            in: ["OPEN", "IN_PROGRESS", "WAITING_PROVIDER"],
          },
        },
        data: {
          status: "RESOLVED",
          resolvedAt: observedAt,
          lastObservedAt: observedAt,
        },
      });
    }

    const repairQueueRecords: RepairQueueEntryRecord[] = [];

    for (const signal of input.repairSignals) {
      const existing = await this.db.repairQueueEntry.findFirst({
        where: {
          resourceId: resource.id,
          trigger: mapRepairSignalTrigger(signal.trigger),
          status: {
            in: ["OPEN", "IN_PROGRESS", "WAITING_PROVIDER"],
          },
          providerLineKey: signal.providerLineKey ?? input.target.providerLineKey ?? null,
        },
      });

      const record = existing
        ? await this.db.repairQueueEntry.update({
            where: { id: existing.id },
            data: {
              probeRunId: probeRun.id,
              providerId: provider.id,
              providerItemId: providerItem?.id ?? resource.providerItemId ?? null,
              providerLineKey: signal.providerLineKey ?? input.target.providerLineKey ?? null,
              severity: mapRepairSignalSeverity(signal.severity),
              currentHealthState: mapSourceHealthState(signal.healthState),
              summary: signal.summary,
              evidence: toJsonValue({
                ...(signal.evidence ?? {}),
                probeKind: signal.probeKind ?? input.kind,
              }),
              lastObservedAt: toDate(signal.createdAt) ?? observedAt,
            },
          })
        : await this.db.repairQueueEntry.create({
            data: {
              resourceId: resource.id,
              probeRunId: probeRun.id,
              providerId: provider.id,
              providerItemId: providerItem?.id ?? resource.providerItemId ?? null,
              providerLineKey: signal.providerLineKey ?? input.target.providerLineKey ?? null,
              trigger: mapRepairSignalTrigger(signal.trigger),
              severity: mapRepairSignalSeverity(signal.severity),
              currentHealthState: mapSourceHealthState(signal.healthState),
              status: mapRepairQueueStatus("open"),
              summary: signal.summary,
              evidence: toJsonValue({
                ...(signal.evidence ?? {}),
                probeKind: signal.probeKind ?? input.kind,
              }),
              createdAt: toDate(signal.createdAt) ?? observedAt,
              lastObservedAt: toDate(signal.createdAt) ?? observedAt,
            },
          });

      repairQueueRecords.push(mapRepairQueueEntryRecord(record));
    }

    return {
      probeRun: mapSourceProbeRunRecord(probeRun),
      repairQueue: repairQueueRecords,
    };
  }
}

export function createSourceHealthRepository(context: RepositoryContext) {
  return new SourceHealthRepository(context);
}

export function createDefaultSourceHealthRepository() {
  return createSourceHealthRepository(createRepositoryContext(requireDb()));
}

export * from "./types";
