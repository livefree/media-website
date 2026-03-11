import "server-only";

import { Prisma } from "@prisma/client";

import type { RepositoryContext } from "../types";
import { BaseRepository, createRepositoryContext } from "../types";
import { requireDb } from "../../client";

import type { IngestDetailPersistencePlan, IngestMode } from "../../../server/ingest";
import type {
  ProviderCapability,
  ProviderContentTypeHint,
  ProviderPayloadFormat,
  ProviderRawPayloadRecord,
  StagingProviderItem,
} from "../../../server/provider";
import type {
  IngestExecutionStatus,
  IngestJobCreateInput,
  IngestJobStatusUpdateInput,
  IngestRunCreateInput,
  IngestRunScope,
  IngestRunStatusUpdateInput,
  PersistIngestDetailInput,
  PersistIngestPageInput,
  PersistIngestPlanResult,
  PersistedCheckpointRecord,
  PersistedIngestJobRecord,
  PersistedIngestRunRecord,
  PersistedProviderItemRecord,
  PersistedProviderRegistryRecord,
  PersistedRawPayloadRecord,
  PersistedStagingCandidateRecord,
  ProviderItemLifecycleStatus,
  ProviderRegistryType,
  ProviderRegistryUpsertInput,
  StagingCandidatePersistenceStatus,
} from "./types";

const providerTypeMap = {
  catalog: "CATALOG_PROVIDER",
  playback: "PLAYBACK_PROVIDER",
  download: "DOWNLOAD_PROVIDER",
  subtitle: "SUBTITLE_PROVIDER",
  manual_submission: "MANUAL_SUBMISSION_PROVIDER",
} as const;

const providerCapabilityMap = {
  catalog: "CATALOG",
  playback: "PLAYBACK",
  download: "DOWNLOAD",
  subtitle: "SUBTITLE",
  manual_submission: "MANUAL_SUBMISSION",
} as const;

const payloadFormatMap = {
  json: "JSON",
  xml: "XML",
  html: "HTML",
  text: "TEXT",
  other: "OTHER",
} as const;

const contentTypeHintMap = {
  movie: "MOVIE",
  series: "SERIES",
  anime: "ANIME",
  variety: "VARIETY",
  documentary: "DOCUMENTARY",
  special: "SPECIAL",
  unknown: "UNKNOWN",
} as const;

const ingestModeMap = {
  backfill: "BACKFILL",
  incremental: "INCREMENTAL",
  manual: "MANUAL",
} as const;

const ingestStatusMap = {
  pending: "PENDING",
  running: "RUNNING",
  succeeded: "SUCCEEDED",
  failed: "FAILED",
  cancelled: "CANCELLED",
  partial: "PARTIAL",
} as const;

const ingestRunScopeMap = {
  page: "PAGE",
  detail: "DETAIL",
  source_refresh: "SOURCE_REFRESH",
  source_probe: "SOURCE_PROBE",
} as const;

const providerItemStatusMap = {
  discovered: "DISCOVERED",
  detail_fetched: "DETAIL_FETCHED",
  staged: "STAGED",
  error: "ERROR",
  withdrawn: "WITHDRAWN",
} as const;

const stagingCandidateStatusMap = {
  pending: "PENDING",
  parsed: "PARSED",
  ready_for_normalization: "READY_FOR_NORMALIZATION",
  parse_failed: "PARSE_FAILED",
  skipped: "SKIPPED",
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

function mapProviderRegistryType(value: ProviderRegistryType) {
  return providerTypeMap[value];
}

function mapProviderCapabilities(values: ProviderCapability[]) {
  return values.map((value) => providerCapabilityMap[value]);
}

function mapPayloadFormat(value: ProviderPayloadFormat) {
  return payloadFormatMap[value];
}

function mapContentTypeHint(value?: ProviderContentTypeHint) {
  return contentTypeHintMap[value ?? "unknown"];
}

function mapIngestMode(value: IngestMode) {
  return ingestModeMap[value];
}

function mapIngestStatus(value: IngestExecutionStatus) {
  return ingestStatusMap[value];
}

function mapIngestRunStatus(value: IngestExecutionStatus) {
  return ingestStatusMap[value];
}

function mapIngestScope(value: IngestRunScope) {
  return ingestRunScopeMap[value];
}

function mapProviderItemStatus(value: ProviderItemLifecycleStatus) {
  return providerItemStatusMap[value];
}

function mapCandidateStatus(value: StagingCandidatePersistenceStatus) {
  return stagingCandidateStatusMap[value];
}

function unmapProviderRegistryType(value: string): ProviderRegistryType {
  switch (value) {
    case "CATALOG_PROVIDER":
      return "catalog";
    case "PLAYBACK_PROVIDER":
      return "playback";
    case "DOWNLOAD_PROVIDER":
      return "download";
    case "SUBTITLE_PROVIDER":
      return "subtitle";
    case "MANUAL_SUBMISSION_PROVIDER":
      return "manual_submission";
  }

  throw new Error(`Unsupported provider registry type: ${value}`);
}

function unmapProviderCapabilities(values: readonly string[]): ProviderCapability[] {
  return values.map((value) => {
    switch (value) {
      case "CATALOG":
        return "catalog";
      case "PLAYBACK":
        return "playback";
      case "DOWNLOAD":
        return "download";
      case "SUBTITLE":
        return "subtitle";
      case "MANUAL_SUBMISSION":
        return "manual_submission";
    }

    throw new Error(`Unsupported provider capability: ${value}`);
  });
}

function unmapPayloadFormat(value: string): PersistedRawPayloadRecord["payloadFormat"] {
  switch (value) {
    case "JSON":
      return "json";
    case "XML":
      return "xml";
    case "HTML":
      return "html";
    case "TEXT":
      return "text";
    case "OTHER":
      return "other";
  }

  throw new Error(`Unsupported provider payload format: ${value}`);
}

function unmapContentTypeHint(value: string): ProviderContentTypeHint {
  switch (value) {
    case "MOVIE":
      return "movie";
    case "SERIES":
      return "series";
    case "ANIME":
      return "anime";
    case "VARIETY":
      return "variety";
    case "DOCUMENTARY":
      return "documentary";
    case "SPECIAL":
      return "special";
    case "UNKNOWN":
      return "unknown";
  }

  throw new Error(`Unsupported provider content type hint: ${value}`);
}

function unmapIngestMode(value: string): IngestMode {
  switch (value) {
    case "BACKFILL":
      return "backfill";
    case "INCREMENTAL":
      return "incremental";
    case "MANUAL":
      return "manual";
  }

  throw new Error(`Unsupported ingest mode: ${value}`);
}

function unmapIngestStatus(value: string): IngestExecutionStatus {
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
    case "PARTIAL":
      return "partial";
  }

  throw new Error(`Unsupported ingest status: ${value}`);
}

function unmapIngestScope(value: string): IngestRunScope {
  switch (value) {
    case "PAGE":
      return "page";
    case "DETAIL":
      return "detail";
    case "SOURCE_REFRESH":
      return "source_refresh";
    case "SOURCE_PROBE":
      return "source_probe";
  }

  throw new Error(`Unsupported ingest scope: ${value}`);
}

function unmapProviderItemStatus(value: string): ProviderItemLifecycleStatus {
  switch (value) {
    case "DISCOVERED":
      return "discovered";
    case "DETAIL_FETCHED":
      return "detail_fetched";
    case "STAGED":
      return "staged";
    case "ERROR":
      return "error";
    case "WITHDRAWN":
      return "withdrawn";
  }

  throw new Error(`Unsupported provider item status: ${value}`);
}

function unmapCandidateStatus(value: string): StagingCandidatePersistenceStatus {
  switch (value) {
    case "PENDING":
      return "pending";
    case "PARSED":
      return "parsed";
    case "READY_FOR_NORMALIZATION":
      return "ready_for_normalization";
    case "PARSE_FAILED":
      return "parse_failed";
    case "SKIPPED":
      return "skipped";
  }

  throw new Error(`Unsupported staging candidate status: ${value}`);
}

function mapProviderRecord(record: Prisma.ProviderRegistryGetPayload<Record<string, never>>): PersistedProviderRegistryRecord {
  return {
    id: record.id,
    adapterKey: record.adapterKey,
    displayName: record.displayName,
    providerType: unmapProviderRegistryType(record.providerType),
    capabilities: unmapProviderCapabilities(record.capabilities),
    enabled: record.enabled,
    baseUrl: record.baseUrl,
    lastSuccessfulSyncAt: record.lastSuccessfulSyncAt,
  };
}

function mapIngestJobRecord(record: Prisma.IngestJobGetPayload<Record<string, never>>): PersistedIngestJobRecord {
  return {
    id: record.id,
    providerId: record.providerId,
    mode: unmapIngestMode(record.mode),
    status: unmapIngestStatus(record.status),
    requestId: record.requestId,
    actorId: record.actorId,
    attemptCount: record.attemptCount,
    startedAt: record.startedAt,
    finishedAt: record.finishedAt,
    lastErrorSummary: record.lastErrorSummary,
  };
}

function mapIngestRunRecord(record: Prisma.IngestRunGetPayload<Record<string, never>>): PersistedIngestRunRecord {
  return {
    id: record.id,
    ingestJobId: record.ingestJobId,
    providerId: record.providerId,
    mode: unmapIngestMode(record.mode),
    scope: unmapIngestScope(record.scope),
    status: unmapIngestStatus(record.status),
    providerItemId: record.providerItemId,
    requestId: record.requestId,
    actorId: record.actorId,
    itemCount: record.itemCount,
    rawPayloadCount: record.rawPayloadCount,
    warningCount: record.warningCount,
    startedAt: record.startedAt,
    finishedAt: record.finishedAt,
    lastErrorSummary: record.lastErrorSummary,
  };
}

function mapCheckpointRecord(record: Prisma.IngestCheckpointGetPayload<Record<string, never>>): PersistedCheckpointRecord {
  return {
    id: record.id,
    providerId: record.providerId,
    ingestJobId: record.ingestJobId,
    ingestRunId: record.ingestRunId,
    cursor: record.cursor,
    page: record.page,
    updatedAfter: record.updatedAfter,
    updatedBefore: record.updatedBefore,
    providerUpdatedAt: record.providerUpdatedAt,
    recordedAt: record.recordedAt,
  };
}

function mapProviderItemRecord(record: Prisma.ProviderItemGetPayload<Record<string, never>>): PersistedProviderItemRecord {
  return {
    id: record.id,
    providerId: record.providerId,
    externalId: record.externalId,
    titleSnapshot: record.titleSnapshot,
    originalTitleSnapshot: record.originalTitleSnapshot,
    typeHint: unmapContentTypeHint(record.typeHint),
    latestStatus: unmapProviderItemStatus(record.latestStatus),
    providerUpdatedAt: record.providerUpdatedAt,
    lastSeenAt: record.lastSeenAt,
  };
}

function mapRawPayloadRecord(record: Prisma.ProviderRawPayloadGetPayload<Record<string, never>>): PersistedRawPayloadRecord {
  return {
    id: record.id,
    providerId: record.providerId,
    ingestJobId: record.ingestJobId,
    ingestRunId: record.ingestRunId,
    providerItemId: record.providerItemId,
    externalItemId: record.externalItemId,
    fetchedAt: record.fetchedAt,
    payloadFormat: unmapPayloadFormat(record.payloadFormat),
    scope: unmapIngestScope(record.scope),
  };
}

function mapCandidateRecord(record: Prisma.StagingCandidateGetPayload<Record<string, never>>): PersistedStagingCandidateRecord {
  return {
    id: record.id,
    providerId: record.providerId,
    providerItemId: record.providerItemId,
    ingestJobId: record.ingestJobId,
    ingestRunId: record.ingestRunId,
    status: unmapCandidateStatus(record.status),
    title: record.title,
    originalTitle: record.originalTitle,
    typeHint: unmapContentTypeHint(record.typeHint),
    warningCount: record.warnings.length,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function createRawPayloadRecord(
  context: RepositoryContext["db"],
  input: {
    providerId: string;
    ingestJobId: string;
    ingestRunId: string;
    providerItemId?: string;
    payload: ProviderRawPayloadRecord;
  },
) {
  return context.providerRawPayload.create({
    data: {
      providerId: input.providerId,
      ingestJobId: input.ingestJobId,
      ingestRunId: input.ingestRunId,
      providerItemId: input.providerItemId,
      externalItemId: input.payload.providerItemId,
      payloadFormat: mapPayloadFormat(input.payload.payloadFormat),
      scope: input.payload.scope === "detail" ? "DETAIL" : "PAGE",
      requestUrl: input.payload.request.requestUrl,
      requestMethod: input.payload.request.method,
      requestCursor: input.payload.request.cursor,
      requestPage: input.payload.request.page,
      body: toJsonValue(input.payload.body) ?? Prisma.JsonNull,
      fetchedAt: toDate(input.payload.fetchedAt) ?? new Date(),
    },
  });
}

export class StagingPersistenceRepository extends BaseRepository {
  public constructor(context: RepositoryContext) {
    super(context);
  }

  async upsertProviderRegistry(input: ProviderRegistryUpsertInput): Promise<PersistedProviderRegistryRecord> {
    const record = await this.db.providerRegistry.upsert({
      where: {
        adapterKey: input.adapterKey,
      },
      create: {
        adapterKey: input.adapterKey,
        displayName: input.displayName,
        providerType: mapProviderRegistryType(input.providerType),
        capabilities: mapProviderCapabilities(input.capabilities),
        baseUrl: input.baseUrl,
        enabled: input.enabled ?? true,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
      update: {
        displayName: input.displayName,
        providerType: mapProviderRegistryType(input.providerType),
        capabilities: mapProviderCapabilities(input.capabilities),
        baseUrl: input.baseUrl,
        enabled: input.enabled ?? true,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    return mapProviderRecord(record);
  }

  async createIngestJob(input: IngestJobCreateInput): Promise<PersistedIngestJobRecord> {
    const record = await this.db.ingestJob.create({
      data: {
        providerId: input.providerId,
        mode: mapIngestMode(input.mode),
        status: mapIngestStatus(input.status ?? "pending"),
        requestId: input.requestId,
        actorId: input.actorId,
        startedAt: toDate(input.startedAt),
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    return mapIngestJobRecord(record);
  }

  async updateIngestJobStatus(jobId: string, input: IngestJobStatusUpdateInput): Promise<PersistedIngestJobRecord> {
    const record = await this.db.ingestJob.update({
      where: { id: jobId },
      data: {
        status: mapIngestStatus(input.status),
        finishedAt: toDate(input.finishedAt),
        attemptCount: input.attemptCount,
        lastErrorSummary: input.lastErrorSummary,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    return mapIngestJobRecord(record);
  }

  async createIngestRun(input: IngestRunCreateInput): Promise<PersistedIngestRunRecord> {
    const record = await this.db.ingestRun.create({
      data: {
        ingestJobId: input.ingestJobId,
        providerId: input.providerId,
        mode: mapIngestMode(input.mode),
        scope: mapIngestScope(input.scope),
        status: mapIngestRunStatus(input.status ?? "pending"),
        requestId: input.requestId,
        actorId: input.actorId,
        providerItemId: input.providerItemId,
        startedAt: toDate(input.startedAt),
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    return mapIngestRunRecord(record);
  }

  async updateIngestRunStatus(runId: string, input: IngestRunStatusUpdateInput): Promise<PersistedIngestRunRecord> {
    const record = await this.db.ingestRun.update({
      where: { id: runId },
      data: {
        status: mapIngestRunStatus(input.status),
        finishedAt: toDate(input.finishedAt),
        itemCount: input.itemCount,
        rawPayloadCount: input.rawPayloadCount,
        warningCount: input.warningCount,
        lastErrorSummary: input.lastErrorSummary,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    if (input.status === "succeeded" || input.status === "partial") {
      await this.db.providerRegistry.update({
        where: { id: record.providerId },
        data: {
          lastSuccessfulSyncAt: record.finishedAt ?? new Date(),
          lastErrorAt: null,
          lastErrorSummary: null,
        },
      });
    }

    if (input.status === "failed") {
      await this.db.providerRegistry.update({
        where: { id: record.providerId },
        data: {
          lastErrorAt: record.finishedAt ?? new Date(),
          lastErrorSummary: input.lastErrorSummary,
        },
      });
    }

    return mapIngestRunRecord(record);
  }

  async recordCheckpoint(input: {
    providerId: string;
    ingestJobId?: string;
    ingestRunId?: string;
    checkpoint: PersistIngestPageInput["plan"]["checkpoint"];
  }): Promise<PersistedCheckpointRecord | undefined> {
    if (!input.checkpoint) {
      return undefined;
    }

    const record = await this.db.ingestCheckpoint.create({
      data: {
        providerId: input.providerId,
        ingestJobId: input.ingestJobId,
        ingestRunId: input.ingestRunId,
        cursor: input.checkpoint.cursor,
        page: input.checkpoint.page,
        updatedAfter: toDate(input.checkpoint.updatedAfter),
        updatedBefore: toDate(input.checkpoint.updatedBefore),
        providerUpdatedAt: toDate(input.checkpoint.providerUpdatedAt),
      },
    });

    return mapCheckpointRecord(record);
  }

  async persistPagePlan(input: PersistIngestPageInput): Promise<PersistIngestPlanResult> {
    const itemStatus = input.itemStatus ?? "staged";
    const candidateStatus = input.candidateStatus ?? "ready_for_normalization";
    const itemMap = new Map<string, PersistedProviderItemRecord>();
    const providerItems: PersistedProviderItemRecord[] = [];
    const candidates: PersistedStagingCandidateRecord[] = [];

    for (const item of input.plan.items) {
      const providerItem = await this.upsertProviderItem({
        providerId: input.providerId,
        item,
        seenAt: input.plan.fetchedAt,
        itemStatus,
        candidateStatus,
      });

      itemMap.set(item.providerItemId, providerItem);
      providerItems.push(providerItem);

      const candidate = await this.db.stagingCandidate.create({
        data: {
          providerId: input.providerId,
          providerItemId: providerItem.id,
          ingestJobId: input.ingestJobId,
          ingestRunId: input.ingestRunId,
          status: mapCandidateStatus(candidateStatus),
          title: item.title,
          originalTitle: item.originalTitle,
          summary: item.summary,
          releaseYear: item.releaseYear,
          region: item.region,
          language: item.language,
          rawCategory: item.rawCategory,
          rawEpisodeText: item.rawEpisodeText,
          typeHint: mapContentTypeHint(item.typeHint),
          providerUpdatedAt: toDate(item.providerUpdatedAt),
          sourceFragmentSummary: toJsonValue(item.sourceFragments),
          warnings: item.warnings,
        },
      });

      candidates.push(mapCandidateRecord(candidate));
    }

    const rawPayloads: PersistedRawPayloadRecord[] = [];

    for (const payload of input.plan.payloads) {
      const linkedItem = payload.providerItemId ? itemMap.get(payload.providerItemId) : undefined;
      const rawPayload = await createRawPayloadRecord(this.db, {
        providerId: input.providerId,
        ingestJobId: input.ingestJobId,
        ingestRunId: input.ingestRunId,
        providerItemId: linkedItem?.id,
        payload,
      });
      rawPayloads.push(mapRawPayloadRecord(rawPayload));
    }

    const checkpoint = await this.recordCheckpoint({
      providerId: input.providerId,
      ingestJobId: input.ingestJobId,
      ingestRunId: input.ingestRunId,
      checkpoint: input.plan.checkpoint,
    });

    await this.db.ingestRun.update({
      where: { id: input.ingestRunId },
      data: {
        itemCount: providerItems.length,
        rawPayloadCount: rawPayloads.length,
        warningCount: candidates.reduce((count, candidate) => count + candidate.warningCount, 0),
      },
    });

    return {
      providerItems,
      rawPayloads,
      candidates,
      checkpoint,
    };
  }

  async persistDetailPlan(input: PersistIngestDetailInput): Promise<PersistIngestPlanResult> {
    const pageLikePlan: PersistIngestPageInput = {
      providerId: input.providerId,
      ingestJobId: input.ingestJobId,
      ingestRunId: input.ingestRunId,
      itemStatus: input.itemStatus ?? "detail_fetched",
      candidateStatus: input.candidateStatus ?? "ready_for_normalization",
      plan: {
        providerKey: input.plan.providerKey,
        mode: input.plan.mode,
        fetchedAt: input.plan.fetchedAt,
        requestId: input.plan.requestId,
        payloads: input.plan.payloads,
        items: [input.plan.item],
      },
    };

    return this.persistPagePlan(pageLikePlan);
  }

  private async upsertProviderItem(input: {
    providerId: string;
    item: StagingProviderItem;
    seenAt: string;
    itemStatus: ProviderItemLifecycleStatus;
    candidateStatus: StagingCandidatePersistenceStatus;
  }): Promise<PersistedProviderItemRecord> {
    const record = await this.db.providerItem.upsert({
      where: {
        providerId_externalId: {
          providerId: input.providerId,
          externalId: input.item.providerItemId,
        },
      },
      create: {
        providerId: input.providerId,
        externalId: input.item.providerItemId,
        titleSnapshot: input.item.title,
        originalTitleSnapshot: input.item.originalTitle,
        latestStatus: mapProviderItemStatus(input.itemStatus),
        typeHint: mapContentTypeHint(input.item.typeHint),
        providerUpdatedAt: toDate(input.item.providerUpdatedAt),
        lastSeenAt: toDate(input.seenAt) ?? new Date(),
        latestRawPayloadAt: toDate(input.seenAt),
        latestCandidateStatus: mapCandidateStatus(input.candidateStatus),
        latestCandidateAt: toDate(input.seenAt) ?? new Date(),
      },
      update: {
        titleSnapshot: input.item.title,
        originalTitleSnapshot: input.item.originalTitle,
        latestStatus: mapProviderItemStatus(input.itemStatus),
        typeHint: mapContentTypeHint(input.item.typeHint),
        providerUpdatedAt: toDate(input.item.providerUpdatedAt),
        lastSeenAt: toDate(input.seenAt) ?? new Date(),
        latestRawPayloadAt: toDate(input.seenAt),
        latestCandidateStatus: mapCandidateStatus(input.candidateStatus),
        latestCandidateAt: toDate(input.seenAt) ?? new Date(),
      },
    });

    return mapProviderItemRecord(record);
  }
}

export function createStagingPersistenceRepository(context: RepositoryContext) {
  return new StagingPersistenceRepository(context);
}

export function createDefaultStagingPersistenceRepository() {
  return createStagingPersistenceRepository(createRepositoryContext(requireDb()));
}
