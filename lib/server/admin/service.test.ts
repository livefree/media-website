import test from "node:test";
import assert from "node:assert/strict";

import {
  acknowledgeAdminModerationReport,
  createAdminManualSourceSubmission,
  createAdminManualTitleSubmission,
  clearAdminScheduledReviewPublication,
  hideAdminPublishedCatalogRecord,
  getAdminMigrationSafetyPage,
  dismissAdminModerationReport,
  getAdminManualSourceSubmissionDetailByPublicId,
  getAdminManualSourceSubmissionPage,
  getAdminManualTitleSubmissionDetailByPublicId,
  getAdminManualTitleSubmissionPage,
  getAdminModerationQueuePage,
  getAdminModerationReportDetailByPublicId,
  getAdminPublishedCatalogManagementDetailByPublicId,
  getAdminPublishedCatalogManagementPage,
  acknowledgeAdminRepairQueueEntry,
  getAdminQueueFailureMonitoringPage,
  getAdminRepairQueuePage,
  getAdminSourceInventoryPage,
  reorderAdminPublishedSources,
  replaceAdminPublishedSource,
  restoreAdminPublishedCatalogVisibility,
  resolveAdminModerationReport,
  resolveAdminRepairQueueEntry,
  scheduleAdminReviewPublication,
  unpublishAdminPublishedCatalogRecord,
  updateAdminManualSourceSubmissionStatus,
  updateAdminManualTitleSubmissionStatus,
  updateAdminSourceOrdering,
} from "./service";

import type { AdminBackendDependencies } from "./types";
import type { AdminQueueFailureItemRecord, AdminRepairQueueItemRecord } from "../health";
import type { AdminSourceInventoryItemRecord, ManualSourceSubmissionDetailRecord, ManualSourceSubmissionRecord } from "../source";
import type { ManualTitleSubmissionDetailRecord, ManualTitleSubmissionRecord, ModerationReportDetailRecord, ModerationReportRecord } from "../review";
import type {
  AdminPublishedCatalogDetailRecord,
  AdminPublishedCatalogListItemRecord,
} from "./types";

process.env.ADMIN_ACCESS_STUB_ROLE = "operator";
process.env.ADMIN_ACCESS_STUB_ACTOR_ID = "operator-test";

async function withAdminAccessStub<T>(role: string | undefined, fn: () => Promise<T>) {
  const previousRole = process.env.ADMIN_ACCESS_STUB_ROLE;
  const previousActorId = process.env.ADMIN_ACCESS_STUB_ACTOR_ID;

  if (role) {
    process.env.ADMIN_ACCESS_STUB_ROLE = role;
    process.env.ADMIN_ACCESS_STUB_ACTOR_ID = `${role}-test`;
  } else {
    delete process.env.ADMIN_ACCESS_STUB_ROLE;
    delete process.env.ADMIN_ACCESS_STUB_ACTOR_ID;
  }

  try {
    return await fn();
  } finally {
    if (previousRole) {
      process.env.ADMIN_ACCESS_STUB_ROLE = previousRole;
    } else {
      delete process.env.ADMIN_ACCESS_STUB_ROLE;
    }

    if (previousActorId) {
      process.env.ADMIN_ACCESS_STUB_ACTOR_ID = previousActorId;
    } else {
      delete process.env.ADMIN_ACCESS_STUB_ACTOR_ID;
    }
  }
}

function createSourceItem(overrides: Partial<AdminSourceInventoryItemRecord> = {}): AdminSourceInventoryItemRecord {
  return {
    id: "resource-1",
    publicId: "src_public_1",
    mediaId: "media-1",
    mediaPublicId: "med_public_1",
    mediaTitle: "Northline Station",
    mediaSlug: "northline-station",
    episodeId: "episode-1",
    episodePublicId: "ep_public_1",
    episodeTitle: "Episode 1",
    episodeLabel: "E01 · Episode 1",
    providerId: "provider-1",
    providerItemId: "provider-item-1",
    providerLineKey: "main",
    providerAdapterKey: "jszyapi_vod_json",
    providerDisplayName: "jszyapi Base VOD JSON",
    kind: "stream",
    provider: "m3u8",
    format: "hls",
    label: "Main line",
    quality: "1080p",
    url: "https://example.com/master.m3u8",
    maskedUrl: null,
    accessCode: null,
    status: "online",
    healthState: "healthy",
    healthSummary: null,
    priority: 10,
    mirrorOrder: 0,
    isPreferred: true,
    orderingOrigin: "manual",
    isActive: true,
    isPublic: true,
    replacementResourceId: null,
    replacementPublicId: null,
    lastCheckedAt: new Date("2026-03-11T10:00:00.000Z"),
    lastHealthyAt: new Date("2026-03-11T09:00:00.000Z"),
    failureCount: 0,
    repairOpenCount: 0,
    createdAt: new Date("2026-03-10T09:00:00.000Z"),
    updatedAt: new Date("2026-03-11T10:00:00.000Z"),
    ...overrides,
  };
}

function createRepairItem(overrides: Partial<AdminRepairQueueItemRecord> = {}): AdminRepairQueueItemRecord {
  return {
    id: "repair-1",
    resourceId: "resource-1",
    resourcePublicId: "src_public_1",
    resourceKind: "stream",
    resourceLabel: "Main line",
    probeRunId: "probe-1",
    providerId: "provider-1",
    providerItemId: "provider-item-1",
    providerLineKey: "main",
    providerAdapterKey: "jszyapi_vod_json",
    providerDisplayName: "jszyapi Base VOD JSON",
    mediaPublicId: "med_public_1",
    mediaTitle: "Northline Station",
    mediaSlug: "northline-station",
    episodePublicId: "ep_public_1",
    episodeTitle: "Episode 1",
    episodeLabel: "E01 · Episode 1",
    trigger: "source_broken",
    severity: "high",
    currentHealthState: "broken",
    status: "open",
    summary: "Manifest probe failed.",
    evidence: null,
    probeKind: "manifest",
    probeSummary: "Manifest request returned 404.",
    createdAt: new Date("2026-03-11T08:00:00.000Z"),
    lastObservedAt: new Date("2026-03-11T09:00:00.000Z"),
    resolvedAt: null,
    updatedAt: new Date("2026-03-11T09:00:00.000Z"),
    ...overrides,
  };
}

function createQueueFailureItem(overrides: Partial<AdminQueueFailureItemRecord> = {}): AdminQueueFailureItemRecord {
  return {
    jobId: "job-1",
    runId: "run-1",
    providerId: "provider-1",
    providerKey: "jszyapi_vod_json",
    providerDisplayName: "jszyapi Base VOD JSON",
    visibilityState: "failed",
    status: "failed",
    jobType: "provider_page_ingest",
    scope: "page",
    mode: "incremental",
    requestId: "req-queue-1",
    actorId: "system",
    providerItemId: "provider-item-1",
    attemptCount: 3,
    retryState: "terminal_failure",
    startedAt: new Date("2026-03-11T08:00:00.000Z"),
    finishedAt: new Date("2026-03-11T08:05:00.000Z"),
    durationMs: 300000,
    lastErrorSummary: "Provider returned HTTP 500.",
    failure: {
      category: "provider_response",
      code: "http_500",
      status: 500,
      retryable: true,
      errorName: "ProviderHttpError",
    },
    target: {
      sourceId: "source-1",
      providerItemId: "provider-item-1",
      sourceKind: "stream",
      providerLineKey: "main",
      urls: ["https://provider.example.com/item/1"],
    },
    request: {
      page: 4,
      pageSize: 24,
      cursor: "cursor-4",
      updatedAfter: "2026-03-10T00:00:00.000Z",
      updatedBefore: "2026-03-11T00:00:00.000Z",
    },
    checkpoint: {
      cursor: "cursor-3",
      page: 3,
    },
    counts: {
      itemCount: 12,
      rawPayloadCount: 12,
      warningCount: 1,
    },
    ...overrides,
  };
}

function createPublishedCatalogListItem(
  overrides: Partial<AdminPublishedCatalogListItemRecord> = {},
): AdminPublishedCatalogListItemRecord {
  return {
    id: "media-1",
    publicId: "med_public_1",
    slug: "northline-station",
    title: "Northline Station",
    originalTitle: "Northline Station",
    type: "series",
    status: "completed",
    releaseYear: 2025,
    endYear: null,
    originCountry: "Japan",
    language: "ja",
    posterUrl: "https://images.example.com/northline-poster.jpg",
    backdropUrl: "https://images.example.com/northline-backdrop.jpg",
    seasonCount: 1,
    episodeCount: 12,
    visibilityState: "visible",
    publishedAt: "2026-03-11T10:00:00.000Z",
    updatedAt: "2026-03-11T11:00:00.000Z",
    streamCount: 3,
    healthyStreamCount: 2,
    degradedStreamCount: 1,
    downloadCount: 1,
    subtitleCount: 2,
    openRepairCount: 1,
    canonicalWatchHref: "/watch?v=med_public_1",
    compatibilityHref: "/media/northline-station",
    ...overrides,
  };
}

function createPublishedCatalogDetail(
  overrides: Partial<AdminPublishedCatalogDetailRecord> = {},
): AdminPublishedCatalogDetailRecord {
  return {
    media: {
      id: "media-1",
      publicId: "med_public_1",
      slug: "northline-station",
      title: "Northline Station",
      originalTitle: "Northline Station",
      summary: "A station under pressure.",
      description: "Operator-facing published detail view.",
      tagline: "All lines in motion.",
      type: "series",
      status: "completed",
      releaseYear: 2025,
      endYear: null,
      originCountry: "Japan",
      language: "ja",
      runtimeMinutes: null,
      episodeRuntimeMinutes: 24,
      seasonCount: 1,
      episodeCount: 12,
      visibilityState: "visible",
      posterUrl: "https://images.example.com/northline-poster.jpg",
      backdropUrl: "https://images.example.com/northline-backdrop.jpg",
      canonicalWatchHref: "/watch?v=med_public_1",
      compatibilityHref: "/media/northline-station",
      publishedAt: "2026-03-11T10:00:00.000Z",
      updatedAt: "2026-03-11T11:00:00.000Z",
    },
    seasons: [
      {
        id: "season-1",
        seasonNumber: 1,
        title: "Season 1",
        releaseYear: 2025,
        episodeCount: 12,
        episodes: [],
      },
    ],
    streamResources: [
      {
        id: "resource-1",
        publicId: "src_public_1",
        mediaPublicId: "med_public_1",
        kind: "stream",
        provider: "m3u8",
        format: "hls",
        label: "Main line",
        quality: "1080p",
        status: "online",
        healthState: "healthy",
        healthSummary: null,
        priority: 10,
        mirrorOrder: 0,
        isPreferred: true,
        isUsable: true,
        replacementPublicId: null,
        url: "https://example.com/master.m3u8",
        maskedUrl: null,
        accessCode: null,
        canonicalWatchHref: "/watch?v=med_public_1&r=src_public_1",
        watchQuery: {
          mediaPublicId: "med_public_1",
          resourcePublicId: "src_public_1",
        },
        openRepairCount: 1,
        providerDisplayName: "jszyapi Base VOD JSON",
      },
    ],
    downloadResources: [],
    subtitleResources: [],
    sourceSummary: {
      totalResources: 3,
      streamCount: 3,
      healthyStreamCount: 2,
      degradedStreamCount: 1,
      brokenOrOfflineCount: 0,
      downloadCount: 1,
      subtitleCount: 2,
      openRepairCount: 1,
    },
    episodeDiagnostics: [
      {
        episodePublicId: "ep_public_1",
        seasonNumber: 1,
        episodeNumber: 1,
        title: "Episode 1",
        streamCount: 2,
        healthyStreamCount: 1,
        openRepairCount: 1,
      },
    ],
    recentAudits: [
      {
        action: "publish_succeeded",
        actionSummary: "Published canonical media.",
        actorId: "operator-1",
        createdAt: "2026-03-11T10:00:00.000Z",
      },
    ],
    reviewContext: {
      queueEntryId: "queue-1",
      status: "published",
      latestDecisionType: "approve",
      latestDecisionSummary: "Approved for publish.",
      scheduledPublishAt: null,
      updatedAt: "2026-03-11T10:00:00.000Z",
    },
    ...overrides,
  };
}

function createModerationReport(overrides: Partial<ModerationReportRecord> = {}): ModerationReportRecord {
  return {
    id: "moderation-1",
    publicId: "modr_public_1",
    kind: "broken_source",
    status: "open",
    title: "Broken stream report",
    summary: "Main line returns 404.",
    detail: "Operator reproduced the failure.",
    reporterName: "Operator One",
    reporterEmail: "operator@example.com",
    sourceUrl: null,
    mediaId: "media-1",
    mediaPublicId: "med_public_1",
    mediaTitle: "Northline Station",
    mediaSlug: "northline-station",
    resourceId: "resource-1",
    resourcePublicId: "src_public_1",
    resourceLabel: "Main line",
    resourceKind: "stream",
    episodePublicId: "ep_public_1",
    episodeTitle: "Episode 1",
    repairQueueEntryId: "repair-1",
    repairQueueStatus: "open",
    latestActionSummary: "Waiting for moderation.",
    createdAt: new Date("2026-03-11T07:00:00.000Z"),
    updatedAt: new Date("2026-03-11T08:00:00.000Z"),
    queuedAt: new Date("2026-03-11T07:00:00.000Z"),
    resolvedAt: null,
    dismissedAt: null,
    ...overrides,
  };
}

function createModerationDetail(
  overrides: Partial<ModerationReportDetailRecord> = {},
): ModerationReportDetailRecord {
  return {
    report: createModerationReport(),
    actions: [
      {
        id: "moderation-action-1",
        reportId: "moderation-1",
        actorId: "operator-1",
        actionType: "submitted",
        summary: "Moderation report created.",
        notes: null,
        statusAfter: "open",
        linkedRepairQueueEntryId: null,
        createdAt: new Date("2026-03-11T07:00:00.000Z"),
      },
    ],
    ...overrides,
  };
}

function createManualTitleSubmission(
  overrides: Partial<ManualTitleSubmissionRecord> = {},
): ManualTitleSubmissionRecord {
  return {
    id: "manual-title-1",
    publicId: "mts_public_1",
    status: "submitted",
    title: "Glass Harbor",
    originalTitle: null,
    typeHint: "movie",
    releaseYear: 2025,
    originCountry: "Japan",
    language: "ja",
    summary: "A candidate title from operator intake.",
    notes: "Needs metadata confirmation.",
    sourceUrl: "https://example.com/title-note",
    canonicalMediaId: null,
    canonicalMediaPublicId: null,
    canonicalMediaTitle: null,
    reviewQueueEntryId: null,
    submittedByName: "Operator One",
    submittedByEmail: "operator@example.com",
    latestActionSummary: "Manual title submission created.",
    createdAt: new Date("2026-03-11T07:30:00.000Z"),
    updatedAt: new Date("2026-03-11T07:30:00.000Z"),
    reviewedAt: null,
    ...overrides,
  };
}

function createManualTitleSubmissionDetail(
  overrides: Partial<ManualTitleSubmissionDetailRecord> = {},
): ManualTitleSubmissionDetailRecord {
  return {
    submission: createManualTitleSubmission(),
    actions: [
      {
        id: "manual-title-action-1",
        submissionId: "manual-title-1",
        actorId: "operator-1",
        actionType: "submitted",
        summary: "Manual title submission created.",
        notes: "Needs metadata confirmation.",
        statusAfter: "submitted",
        createdAt: new Date("2026-03-11T07:30:00.000Z"),
      },
    ],
    ...overrides,
  };
}

function createManualSourceSubmission(
  overrides: Partial<ManualSourceSubmissionRecord> = {},
): ManualSourceSubmissionRecord {
  return {
    id: "manual-source-1",
    publicId: "mss_public_1",
    status: "submitted",
    mediaId: "media-1",
    mediaPublicId: "med_public_1",
    mediaTitle: "Northline Station",
    mediaSlug: "northline-station",
    episodeId: "episode-1",
    episodePublicId: "ep_public_1",
    episodeTitle: "Episode 1",
    targetTitleText: null,
    targetEpisodeText: null,
    kind: "stream",
    provider: "m3u8",
    format: "hls",
    label: "Operator backup line",
    quality: "1080p",
    url: "https://example.com/operator.m3u8",
    maskedUrl: null,
    accessCode: null,
    notes: "Manual replacement line.",
    sourceUrl: "https://example.com/source-note",
    submittedByName: "Operator One",
    submittedByEmail: "operator@example.com",
    linkedResourceId: null,
    linkedResourcePublicId: null,
    linkedRepairQueueEntryId: null,
    latestActionSummary: "Manual source submission created.",
    createdAt: new Date("2026-03-11T08:30:00.000Z"),
    updatedAt: new Date("2026-03-11T08:30:00.000Z"),
    reviewedAt: null,
    ...overrides,
  };
}

function createManualSourceSubmissionDetail(
  overrides: Partial<ManualSourceSubmissionDetailRecord> = {},
): ManualSourceSubmissionDetailRecord {
  return {
    submission: createManualSourceSubmission(),
    actions: [
      {
        id: "manual-source-action-1",
        submissionId: "manual-source-1",
        actorId: "operator-1",
        actionType: "submitted",
        summary: "Manual source submission created.",
        notes: "Manual replacement line.",
        statusAfter: "submitted",
        createdAt: new Date("2026-03-11T08:30:00.000Z"),
      },
    ],
    ...overrides,
  };
}

function createDependencies() {
  const calls = {
    getPublishedCatalogMigrationPreflight: 0,
    queryAdminPublishedCatalog: [] as Array<Record<string, unknown> | undefined>,
    getAdminPublishedCatalogDetailByPublicId: [] as string[],
    unpublishPublishedCatalogRecord: [] as Array<Record<string, unknown>>,
    hidePublishedCatalogRecord: [] as Array<Record<string, unknown>>,
    restorePublishedCatalogVisibility: [] as Array<Record<string, unknown>>,
    listModerationReports: [] as Array<Record<string, unknown> | undefined>,
    getModerationReportDetailByPublicId: [] as string[],
    updateModerationReportStatus: [] as Array<{ publicId: string; input: Record<string, unknown> }>,
    listManualTitleSubmissions: [] as Array<Record<string, unknown> | undefined>,
    getManualTitleSubmissionDetailByPublicId: [] as string[],
    createManualTitleSubmission: [] as Array<Record<string, unknown>>,
    updateManualTitleSubmissionStatus: [] as Array<{ publicId: string; input: Record<string, unknown> }>,
    scheduleReviewPublication: [] as Array<Record<string, unknown>>,
    clearScheduledReviewPublication: [] as Array<Record<string, unknown>>,
    listAdminSourceInventory: [] as Array<Record<string, unknown> | undefined>,
    updateSourceOrdering: [] as Array<Record<string, unknown>>,
    reorderPublishedSources: [] as Array<Record<string, unknown>>,
    replacePublishedSource: [] as Array<Record<string, unknown>>,
    listManualSourceSubmissions: [] as Array<Record<string, unknown> | undefined>,
    getManualSourceSubmissionDetailByPublicId: [] as string[],
    createManualSourceSubmission: [] as Array<Record<string, unknown>>,
    updateManualSourceSubmissionStatus: [] as Array<{ publicId: string; input: Record<string, unknown> }>,
    listAdminQueueFailures: [] as Array<Record<string, unknown> | undefined>,
    listAdminRepairQueue: [] as Array<Record<string, unknown> | undefined>,
    updateRepairQueueEntryStatus: [] as Array<{ entryId: string; input: Record<string, unknown> }>,
  };

  const dependencies: AdminBackendDependencies = {
    catalog: {
      async getPublishedCatalogMigrationPreflight() {
        calls.getPublishedCatalogMigrationPreflight += 1;
        return {
          target: "published_catalog_runtime",
          status: "ready",
          reasonCode: "ready",
          summary: "Published catalog runtime is ready.",
          expectedSchemaDigest: "digest-123",
          checkedAt: new Date("2026-03-11T12:00:00.000Z"),
          metadata: {
            target: "published_catalog_runtime",
            schemaDigest: "digest-123",
            rolloutState: "ready",
            summary: "Published catalog runtime is ready.",
            updatedBy: "operator-1",
            metadata: {
              rolloutTicket: "ops-123",
            },
            createdAt: new Date("2026-03-11T10:00:00.000Z"),
            updatedAt: new Date("2026-03-11T11:00:00.000Z"),
          },
        };
      },
      async queryAdminPublishedCatalog(query) {
        calls.queryAdminPublishedCatalog.push(query);
        return {
          title: "Published Catalog",
          description: "Operator view of published titles.",
          appliedFilters: query ?? {},
          page: 1,
          pageSize: 24,
          summary: {
            totalItems: 2,
            totalPages: 1,
            titlesWithRepairs: 1,
            titlesWithHealthyStreams: 2,
            episodicTitles: 1,
          },
          items: [
            createPublishedCatalogListItem(),
            createPublishedCatalogListItem({
              id: "media-2",
              publicId: "med_public_2",
              slug: "glass-harbor",
              title: "Glass Harbor",
              type: "movie",
              seasonCount: null,
              episodeCount: null,
              streamCount: 1,
              healthyStreamCount: 1,
              degradedStreamCount: 0,
              openRepairCount: 0,
            }),
          ],
        };
      },
      async getAdminPublishedCatalogDetailByPublicId(publicId) {
        calls.getAdminPublishedCatalogDetailByPublicId.push(publicId);
        return publicId === "missing" ? null : createPublishedCatalogDetail();
      },
      async unpublishPublishedCatalogRecord(input) {
        calls.unpublishPublishedCatalogRecord.push(input as Record<string, unknown>);
        return {
          auditId: "audit-unpublish-1",
          summary: "Unpublished catalog record 'Northline Station'.",
          recordedAt: "2026-03-11T12:30:00.000Z",
          mediaId: "media-1",
          mediaPublicId: input.mediaPublicId,
          status: "archived",
        };
      },
      async hidePublishedCatalogRecord(input) {
        calls.hidePublishedCatalogRecord.push(input as Record<string, unknown>);
        return {
          auditId: "audit-hide-1",
          summary: "Hidden catalog record 'Northline Station'.",
          recordedAt: "2026-03-11T12:35:00.000Z",
          mediaId: "media-1",
          mediaPublicId: input.mediaPublicId,
          visibilityState: "hidden",
        };
      },
      async restorePublishedCatalogVisibility(input) {
        calls.restorePublishedCatalogVisibility.push(input as Record<string, unknown>);
        return {
          auditId: "audit-restore-1",
          summary: "Restored catalog record 'Northline Station'.",
          recordedAt: "2026-03-11T12:40:00.000Z",
          mediaId: "media-1",
          mediaPublicId: input.mediaPublicId,
          visibilityState: "visible",
        };
      },
    },
    review: {
      async listModerationReports(query) {
        calls.listModerationReports.push(query);
        return [
          createModerationReport(),
          createModerationReport({
            id: "moderation-2",
            publicId: "modr_public_2",
            kind: "closely_related",
            status: "in_review",
            title: "Related-title report",
            summary: "This title may be a duplicate listing.",
            resourceId: null,
            resourcePublicId: null,
            resourceLabel: null,
            resourceKind: null,
            repairQueueEntryId: null,
            repairQueueStatus: null,
          }),
          createModerationReport({
            id: "moderation-3",
            publicId: "modr_public_3",
            status: "resolved",
            latestActionSummary: "Linked to repair queue.",
            resolvedAt: new Date("2026-03-11T10:00:00.000Z"),
          }),
        ];
      },
      async getModerationReportDetailByPublicId(publicId) {
        calls.getModerationReportDetailByPublicId.push(publicId);
        return publicId === "missing"
          ? null
          : createModerationDetail({
              report: createModerationReport({ publicId }),
            });
      },
      async updateModerationReportStatus(publicId, input) {
        calls.updateModerationReportStatus.push({ publicId, input: input as Record<string, unknown> });
        return createModerationDetail({
          report: createModerationReport({
            publicId,
            status: input.status,
            repairQueueEntryId: input.linkedRepairQueueEntryId ?? null,
          }),
        });
      },
      async listManualTitleSubmissions(query) {
        calls.listManualTitleSubmissions.push(query);
        return [
          createManualTitleSubmission(),
          createManualTitleSubmission({
            id: "manual-title-2",
            publicId: "mts_public_2",
            status: "in_review",
          }),
          createManualTitleSubmission({
            id: "manual-title-3",
            publicId: "mts_public_3",
            status: "accepted",
            canonicalMediaPublicId: "med_public_2",
            canonicalMediaTitle: "Glass Harbor",
          }),
        ];
      },
      async getManualTitleSubmissionDetailByPublicId(publicId) {
        calls.getManualTitleSubmissionDetailByPublicId.push(publicId);
        return publicId === "missing"
          ? null
          : createManualTitleSubmissionDetail({
              submission: createManualTitleSubmission({ publicId }),
            });
      },
      async createManualTitleSubmission(input) {
        calls.createManualTitleSubmission.push(input as Record<string, unknown>);
        return createManualTitleSubmissionDetail({
          submission: createManualTitleSubmission({
            title: input.title,
            originalTitle: input.originalTitle ?? null,
            typeHint: input.typeHint ?? "unknown",
            submittedByName: input.submittedByName ?? null,
            submittedByEmail: input.submittedByEmail ?? null,
          }),
        });
      },
      async updateManualTitleSubmissionStatus(publicId, input) {
        calls.updateManualTitleSubmissionStatus.push({ publicId, input: input as Record<string, unknown> });
        return createManualTitleSubmissionDetail({
          submission: createManualTitleSubmission({
            publicId,
            status: input.status,
            canonicalMediaId: input.canonicalMediaId ?? null,
            reviewQueueEntryId: input.reviewQueueEntryId ?? null,
          }),
        });
      },
      async scheduleReviewPublication(input) {
        calls.scheduleReviewPublication.push(input as Record<string, unknown>);
        return {
          id: input.queueEntryId,
          normalizedCandidateId: "normalized-1",
          canonicalMediaId: "media-1",
          status: "approved_for_publish",
          latestDecisionType: "approve",
          latestDecisionSummary: "Approved for publish.",
          scheduledPublishAt: new Date(input.publishAt),
          queuedAt: new Date("2026-03-11T09:00:00.000Z"),
          startedAt: new Date("2026-03-11T09:10:00.000Z"),
          reviewedAt: new Date("2026-03-11T09:30:00.000Z"),
          createdAt: new Date("2026-03-11T09:00:00.000Z"),
          updatedAt: new Date("2026-03-11T12:00:00.000Z"),
        };
      },
      async clearScheduledReviewPublication(input) {
        calls.clearScheduledReviewPublication.push(input as Record<string, unknown>);
        return {
          id: input.queueEntryId,
          normalizedCandidateId: "normalized-1",
          canonicalMediaId: "media-1",
          status: "approved_for_publish",
          latestDecisionType: "approve",
          latestDecisionSummary: "Approved for publish.",
          scheduledPublishAt: null,
          queuedAt: new Date("2026-03-11T09:00:00.000Z"),
          startedAt: new Date("2026-03-11T09:10:00.000Z"),
          reviewedAt: new Date("2026-03-11T09:30:00.000Z"),
          createdAt: new Date("2026-03-11T09:00:00.000Z"),
          updatedAt: new Date("2026-03-11T12:05:00.000Z"),
        };
      },
    },
    source: {
      async listAdminSourceInventory(query) {
        calls.listAdminSourceInventory.push(query);
        return [
          createSourceItem(),
          createSourceItem({
            id: "resource-2",
            publicId: "src_public_2",
            label: "Backup line",
            isPreferred: false,
            priority: 5,
            healthState: "degraded",
            status: "degraded",
            repairOpenCount: 1,
          }),
          createSourceItem({
            id: "resource-3",
            publicId: "src_public_3",
            kind: "subtitle",
            label: "Chinese subtitles",
            provider: "other",
            format: "text",
            isActive: false,
            isPublic: false,
            healthState: "offline",
            status: "offline",
            repairOpenCount: 0,
          }),
        ];
      },
      async updateSourceOrdering(updates) {
        calls.updateSourceOrdering.push({ updates });
        return updates;
      },
      async reorderPublishedSources(input) {
        calls.reorderPublishedSources.push(input as Record<string, unknown>);
        return {
          auditId: "audit-reorder-1",
          summary: "Reordered 2 published sources.",
          recordedAt: "2026-03-11T12:15:00.000Z",
          resources: [
            createSourceItem({
              id: "resource-2",
              publicId: "src_public_2",
              label: "Backup line",
              priority: 20,
              mirrorOrder: 0,
              isPreferred: true,
              orderingOrigin: "manual",
            }),
            createSourceItem({
              id: "resource-1",
              publicId: "src_public_1",
              label: "Main line",
              priority: 10,
              mirrorOrder: 1,
              isPreferred: false,
              orderingOrigin: "manual",
            }),
          ],
        };
      },
      async replacePublishedSource(input) {
        calls.replacePublishedSource.push(input as Record<string, unknown>);
        return {
          auditId: "audit-replace-1",
          summary: "Replaced published source 'src_public_1'.",
          recordedAt: "2026-03-11T12:20:00.000Z",
          replacedSource: createSourceItem({
            publicId: input.sourcePublicId,
            status: "offline",
            healthState: "replaced",
            isPreferred: false,
            isActive: false,
            isPublic: false,
            replacementPublicId: input.replacementPublicId,
          }),
          replacementSource: createSourceItem({
            id: "resource-9",
            publicId: input.replacementPublicId,
            label: "Operator replacement line",
            isPreferred: true,
            isActive: true,
            isPublic: true,
          }),
        };
      },
      async listManualSourceSubmissions(query) {
        calls.listManualSourceSubmissions.push(query);
        return [
          createManualSourceSubmission(),
          createManualSourceSubmission({
            id: "manual-source-2",
            publicId: "mss_public_2",
            status: "needs_followup",
            targetTitleText: "Unknown title",
            mediaId: null,
            mediaPublicId: null,
            mediaTitle: null,
            mediaSlug: null,
            episodeId: null,
            episodePublicId: null,
            episodeTitle: null,
          }),
        ];
      },
      async getManualSourceSubmissionDetailByPublicId(publicId) {
        calls.getManualSourceSubmissionDetailByPublicId.push(publicId);
        return publicId === "missing"
          ? null
          : createManualSourceSubmissionDetail({
              submission: createManualSourceSubmission({ publicId }),
            });
      },
      async createManualSourceSubmission(input) {
        calls.createManualSourceSubmission.push(input as Record<string, unknown>);
        return createManualSourceSubmissionDetail({
          submission: createManualSourceSubmission({
            targetTitleText: input.targetTitleText ?? null,
            label: input.label,
            url: input.url,
            submittedByName: input.submittedByName ?? null,
            submittedByEmail: input.submittedByEmail ?? null,
          }),
        });
      },
      async updateManualSourceSubmissionStatus(publicId, input) {
        calls.updateManualSourceSubmissionStatus.push({ publicId, input: input as Record<string, unknown> });
        return createManualSourceSubmissionDetail({
          submission: createManualSourceSubmission({
            publicId,
            status: input.status,
            linkedResourceId: input.linkedResourceId ?? null,
            linkedRepairQueueEntryId: input.linkedRepairQueueEntryId ?? null,
          }),
        });
      },
    },
    health: {
      async listAdminQueueFailures(query) {
        calls.listAdminQueueFailures.push(query);
        return [
          createQueueFailureItem(),
          createQueueFailureItem({
            jobId: "job-2",
            runId: "run-2",
            visibilityState: "retrying",
            status: "running",
            jobType: "scheduled_source_refresh",
            scope: "source_refresh",
            attemptCount: 2,
            retryState: "retrying",
            lastErrorSummary: "Retry scheduled after upstream timeout.",
            failure: {
              category: "upstream_timeout",
              code: "timeout",
              status: 504,
              retryable: true,
              errorName: "TimeoutError",
            },
          }),
          createQueueFailureItem({
            jobId: "job-3",
            runId: "run-3",
            visibilityState: "failed",
            status: "failed",
            jobType: "scheduled_source_probe",
            scope: "source_probe",
            target: {
              sourceId: "source-9",
              providerItemId: "provider-item-9",
              sourceKind: "subtitle",
              providerLineKey: "sub-zh",
              urls: ["https://provider.example.com/sub/9"],
            },
          }),
        ];
      },
      async listAdminRepairQueue(query) {
        calls.listAdminRepairQueue.push(query);
        return [
          createRepairItem(),
          createRepairItem({
            id: "repair-2",
            status: "in_progress",
            severity: "medium",
            currentHealthState: "degraded",
            summary: "Source is being checked manually.",
          }),
          createRepairItem({
            id: "repair-3",
            status: "resolved",
            severity: "low",
            currentHealthState: "healthy",
            resolvedAt: new Date("2026-03-11T11:00:00.000Z"),
            summary: "Probe recovered.",
          }),
        ];
      },
      async updateRepairQueueEntryStatus(entryId, input) {
        calls.updateRepairQueueEntryStatus.push({ entryId, input });
        return createRepairItem({
          id: entryId,
          status: input.status as AdminRepairQueueItemRecord["status"],
          resolvedAt: input.status === "resolved" ? new Date("2026-03-11T12:00:00.000Z") : null,
        });
      },
    },
  };

  return {
    calls,
    dependencies,
  };
}

test("getAdminSourceInventoryPage builds operator summaries from joined source rows", async () => {
  const { calls, dependencies } = createDependencies();
  const page = await getAdminSourceInventoryPage(
    {
      search: "northline",
      includeInactive: true,
    },
    dependencies,
  );

  assert.equal(calls.listAdminSourceInventory.length, 1);
  assert.equal(page.title, "Source Inventory");
  assert.equal(page.summary.totalItems, 3);
  assert.equal(page.summary.activeItems, 2);
  assert.equal(page.summary.privateItems, 1);
  assert.equal(page.summary.unhealthyItems, 2);
  assert.equal(page.summary.openRepairItems, 1);
});

test("getAdminPublishedCatalogManagementPage returns operator-facing published catalog data", async () => {
  const { calls, dependencies } = createDependencies();
  const page = await getAdminPublishedCatalogManagementPage(
    {
      q: "northline",
      type: "series",
      sort: "updated_at",
    },
    dependencies,
  );

  assert.equal(calls.queryAdminPublishedCatalog.length, 1);
  assert.equal(page.title, "Published Catalog");
  assert.equal(page.summary.totalItems, 2);
  assert.equal(page.summary.titlesWithRepairs, 1);
  assert.equal(page.items[0]?.publicId, "med_public_1");
});

test("getAdminMigrationSafetyPage exposes privileged migration preflight visibility", async () => {
  const { calls, dependencies } = createDependencies();
  const page = await getAdminMigrationSafetyPage(dependencies);

  assert.equal(calls.getPublishedCatalogMigrationPreflight, 1);
  assert.equal(page.title, "Migration Safety");
  assert.equal(page.preflight.status, "ready");
  assert.equal(page.preflight.metadata?.rolloutState, "ready");
  assert.equal(page.preflight.metadata?.metadata?.rolloutTicket, "ops-123");
});

test("getAdminPublishedCatalogManagementDetailByPublicId returns operator detail or null", async () => {
  const { calls, dependencies } = createDependencies();
  const detail = await getAdminPublishedCatalogManagementDetailByPublicId("med_public_1", dependencies);
  const missing = await getAdminPublishedCatalogManagementDetailByPublicId("missing", dependencies);

  assert.deepEqual(calls.getAdminPublishedCatalogDetailByPublicId, ["med_public_1", "missing"]);
  assert.equal(detail?.media.publicId, "med_public_1");
  assert.equal(detail?.sourceSummary.openRepairCount, 1);
  assert.equal(detail?.recentAudits[0]?.action, "publish_succeeded");
  assert.equal(missing, null);
});

test("getAdminRepairQueuePage builds operator summaries from durable repair records", async () => {
  const { calls, dependencies } = createDependencies();
  const page = await getAdminRepairQueuePage(
    {
      statuses: ["open", "in_progress"],
    },
    dependencies,
  );

  assert.equal(calls.listAdminRepairQueue.length, 1);
  assert.equal(page.title, "Repair Queue");
  assert.equal(page.summary.totalItems, 3);
  assert.equal(page.summary.openItems, 1);
  assert.equal(page.summary.inProgressItems, 1);
  assert.equal(page.summary.resolvedItems, 1);
});

test("getAdminQueueFailureMonitoringPage returns privileged triage records for failed and retrying jobs", async () => {
  const { calls, dependencies } = createDependencies();
  const page = await getAdminQueueFailureMonitoringPage(
    {
      visibilityStates: ["failed", "retrying"],
      providerKeys: ["jszyapi_vod_json"],
      limit: 20,
    },
    dependencies,
  );

  assert.equal(calls.listAdminQueueFailures.length, 1);
  assert.equal(page.title, "Queue Failures");
  assert.equal(page.summary.totalItems, 3);
  assert.equal(page.summary.failedItems, 2);
  assert.equal(page.summary.retryingItems, 1);
  assert.equal(page.summary.providerPageIngestItems, 1);
  assert.equal(page.summary.sourceRefreshItems, 1);
  assert.equal(page.summary.sourceProbeItems, 1);
  assert.equal(page.items[0]?.failure?.code, "http_500");
  assert.equal(page.items[0]?.target?.providerLineKey, "main");
  assert.equal(page.items[0]?.request?.page, 4);
  assert.equal(page.items[0]?.checkpoint?.page, 3);
  assert.equal(page.items[1]?.visibilityState, "retrying");
});

test("getAdminModerationQueuePage builds operator summaries for moderation reports", async () => {
  const { calls, dependencies } = createDependencies();
  const page = await getAdminModerationQueuePage(
    {
      q: "broken",
      statuses: ["open", "in_review"],
    },
    dependencies,
  );

  assert.equal(calls.listModerationReports.length, 1);
  assert.equal(page.title, "Moderation Reports");
  assert.equal(page.summary.totalItems, 3);
  assert.equal(page.summary.openItems, 1);
  assert.equal(page.summary.inReviewItems, 1);
  assert.equal(page.summary.resolvedItems, 1);
});

test("moderation detail and status actions stay inside the review backend boundary", async () => {
  const { calls, dependencies } = createDependencies();
  const detail = await getAdminModerationReportDetailByPublicId("modr_public_1", dependencies);
  await acknowledgeAdminModerationReport(
    {
      publicId: "modr_public_1",
      actorId: "operator-ui",
      requestId: "mod-ack-1",
      notes: "Checking the source.",
      linkedRepairQueueEntryId: "repair-1",
    },
    dependencies,
  );
  await resolveAdminModerationReport(
    {
      publicId: "modr_public_1",
      actorId: "operator-ui",
      requestId: "mod-resolve-1",
      notes: "Replacement source linked.",
    },
    dependencies,
  );
  await dismissAdminModerationReport(
    {
      publicId: "modr_public_2",
      actorId: "operator-ui",
      requestId: "mod-dismiss-1",
      notes: "No action required.",
    },
    dependencies,
  );

  assert.equal(detail?.report.publicId, "modr_public_1");
  assert.deepEqual(calls.getModerationReportDetailByPublicId, ["modr_public_1"]);
  assert.deepEqual(calls.updateModerationReportStatus, [
    {
      publicId: "modr_public_1",
      input: {
        status: "in_review",
        actorId: "operator-ui",
        requestId: "mod-ack-1",
        notes: "Checking the source.",
        linkedRepairQueueEntryId: "repair-1",
      },
    },
    {
      publicId: "modr_public_1",
      input: {
        status: "resolved",
        actorId: "operator-ui",
        requestId: "mod-resolve-1",
        notes: "Replacement source linked.",
        linkedRepairQueueEntryId: undefined,
      },
    },
    {
      publicId: "modr_public_2",
      input: {
        status: "dismissed",
        actorId: "operator-ui",
        requestId: "mod-dismiss-1",
        notes: "No action required.",
      },
    },
  ]);
});

test("manual title submission admin flows expose list, detail, create, and status updates", async () => {
  const { calls, dependencies } = createDependencies();
  const page = await getAdminManualTitleSubmissionPage(
    {
      statuses: ["submitted", "in_review"],
    },
    dependencies,
  );
  const detail = await getAdminManualTitleSubmissionDetailByPublicId("mts_public_1", dependencies);
  const created = await createAdminManualTitleSubmission(
    {
      title: "New Harbor",
      typeHint: "movie",
      submittedByName: "Operator Two",
      submittedByEmail: "two@example.com",
    },
    dependencies,
  );
  await updateAdminManualTitleSubmissionStatus(
    "mts_public_1",
    {
      status: "accepted",
      actorId: "operator-ui",
      requestId: "title-accept-1",
      canonicalMediaId: "media-2",
      reviewQueueEntryId: "queue-22",
    },
    dependencies,
  );

  assert.equal(page.title, "Manual Title Submissions");
  assert.equal(page.summary.totalItems, 3);
  assert.equal(page.summary.submittedItems, 1);
  assert.equal(page.summary.inReviewItems, 1);
  assert.equal(page.summary.acceptedItems, 1);
  assert.equal(detail?.submission.publicId, "mts_public_1");
  assert.equal(created.submission.title, "New Harbor");
  assert.equal(calls.createManualTitleSubmission.length, 1);
  assert.deepEqual(calls.updateManualTitleSubmissionStatus[0], {
    publicId: "mts_public_1",
    input: {
      status: "accepted",
      actorId: "operator-ui",
      requestId: "title-accept-1",
      canonicalMediaId: "media-2",
      reviewQueueEntryId: "queue-22",
    },
  });
});

test("manual source submission admin flows expose list, detail, create, and status updates", async () => {
  const { calls, dependencies } = createDependencies();
  const page = await getAdminManualSourceSubmissionPage(
    {
      statuses: ["submitted", "needs_followup"],
    },
    dependencies,
  );
  const detail = await getAdminManualSourceSubmissionDetailByPublicId("mss_public_1", dependencies);
  const created = await createAdminManualSourceSubmission(
    {
      targetTitleText: "Northline Station",
      kind: "stream",
      provider: "m3u8",
      format: "hls",
      label: "Operator backup line",
      url: "https://example.com/backup.m3u8",
      submittedByName: "Operator Three",
      submittedByEmail: "three@example.com",
    },
    dependencies,
  );
  await updateAdminManualSourceSubmissionStatus(
    "mss_public_1",
    {
      status: "accepted",
      actorId: "operator-ui",
      requestId: "source-accept-1",
      linkedResourceId: "resource-4",
      linkedRepairQueueEntryId: "repair-1",
    },
    dependencies,
  );

  assert.equal(page.title, "Manual Source Submissions");
  assert.equal(page.summary.totalItems, 2);
  assert.equal(page.summary.submittedItems, 1);
  assert.equal(page.summary.followupItems, 1);
  assert.equal(detail?.submission.publicId, "mss_public_1");
  assert.equal(created.submission.label, "Operator backup line");
  assert.equal(calls.createManualSourceSubmission.length, 1);
  assert.deepEqual(calls.updateManualSourceSubmissionStatus[0], {
    publicId: "mss_public_1",
    input: {
      status: "accepted",
      actorId: "operator-ui",
      requestId: "source-accept-1",
      linkedResourceId: "resource-4",
      linkedRepairQueueEntryId: "repair-1",
    },
  });
});

test("admin repair queue actions use backend-owned status transitions", async () => {
  const { calls, dependencies } = createDependencies();

  await acknowledgeAdminRepairQueueEntry(
    {
      entryId: "repair-1",
      actorId: "operator-ui",
      requestId: "ack-1",
    },
    dependencies,
  );
  await resolveAdminRepairQueueEntry(
    {
      entryId: "repair-1",
      actorId: "operator-ui",
      requestId: "resolve-1",
    },
    dependencies,
  );

  assert.equal(calls.updateRepairQueueEntryStatus.length, 2);
  assert.deepEqual(calls.updateRepairQueueEntryStatus[0], {
    entryId: "repair-1",
    input: {
      status: "in_progress",
      actorId: "operator-ui",
      requestId: "ack-1",
    },
  });
  assert.deepEqual(calls.updateRepairQueueEntryStatus[1], {
    entryId: "repair-1",
    input: {
      status: "resolved",
      actorId: "operator-ui",
      requestId: "resolve-1",
    },
  });
});

test("updateAdminSourceOrdering forwards the existing backend ordering boundary", async () => {
  const { calls, dependencies } = createDependencies();

  await updateAdminSourceOrdering(
    [
      {
        resourceId: "resource-1",
        priority: 20,
        mirrorOrder: 0,
        isPreferred: true,
        orderingOrigin: "manual",
      },
    ],
    dependencies,
  );

  assert.equal(calls.updateSourceOrdering.length, 1);
});

test("reorderAdminPublishedSources forwards the bounded published-source reorder workflow", async () => {
  const { calls, dependencies } = createDependencies();

  const result = await reorderAdminPublishedSources(
    {
      actorId: "operator-ui",
      requestId: "reorder-1",
      notes: "Promote backup line ahead of the primary line.",
      updates: [
        {
          resourceId: "resource-2",
          priority: 20,
          mirrorOrder: 0,
          isPreferred: true,
          orderingOrigin: "manual",
        },
        {
          resourceId: "resource-1",
          priority: 10,
          mirrorOrder: 1,
          isPreferred: false,
          orderingOrigin: "manual",
        },
      ],
    },
    dependencies,
  );

  assert.equal(calls.reorderPublishedSources.length, 1);
  assert.equal(result.auditId, "audit-reorder-1");
  assert.equal(result.resources[0]?.publicId, "src_public_2");
});

test("replaceAdminPublishedSource forwards the bounded replacement workflow", async () => {
  const { calls, dependencies } = createDependencies();

  const result = await replaceAdminPublishedSource(
    {
      sourcePublicId: "src_public_1",
      replacementPublicId: "src_public_9",
      actorId: "operator-ui",
      requestId: "replace-1",
      notes: "Switch to the validated backup line.",
    },
    dependencies,
  );

  assert.equal(calls.replacePublishedSource.length, 1);
  assert.equal(result.replacedSource.publicId, "src_public_1");
  assert.equal(result.replacementSource.publicId, "src_public_9");
  assert.equal(result.replacementSource.isPublic, true);
});

test("unpublishAdminPublishedCatalogRecord forwards the bounded catalog withdrawal workflow", async () => {
  const { calls, dependencies } = createDependencies();

  const result = await unpublishAdminPublishedCatalogRecord(
    {
      mediaPublicId: "med_public_1",
      actorId: "operator-ui",
      requestId: "unpublish-1",
      notes: "Withdraw until source integrity review completes.",
    },
    dependencies,
  );

  assert.equal(calls.unpublishPublishedCatalogRecord.length, 1);
  assert.equal(result.mediaPublicId, "med_public_1");
  assert.equal(result.status, "archived");
});

test("hideAdminPublishedCatalogRecord forwards bounded visibility-hiding control", async () => {
  const { calls, dependencies } = createDependencies();

  const result = await hideAdminPublishedCatalogRecord(
    {
      mediaPublicId: "med_public_1",
      actorId: "operator-ui",
      requestId: "hide-1",
      notes: "Hold visibility while downstream review completes.",
    },
    dependencies,
  );

  assert.equal(calls.hidePublishedCatalogRecord.length, 1);
  assert.equal(result.mediaPublicId, "med_public_1");
  assert.equal(result.visibilityState, "hidden");
});

test("restoreAdminPublishedCatalogVisibility forwards bounded visibility-restore control", async () => {
  const { calls, dependencies } = createDependencies();

  const result = await restoreAdminPublishedCatalogVisibility(
    {
      mediaPublicId: "med_public_1",
      actorId: "operator-ui",
      requestId: "restore-1",
      notes: "Return title to public serving.",
    },
    dependencies,
  );

  assert.equal(calls.restorePublishedCatalogVisibility.length, 1);
  assert.equal(result.mediaPublicId, "med_public_1");
  assert.equal(result.visibilityState, "visible");
});

test("scheduleAdminReviewPublication forwards publish scheduling control", async () => {
  const { calls, dependencies } = createDependencies();

  const result = await scheduleAdminReviewPublication(
    {
      queueEntryId: "queue-1",
      publishAt: "2026-03-12T15:00:00.000Z",
      actorId: "operator-ui",
      requestId: "schedule-1",
      notes: "Delay publish until launch window.",
    },
    dependencies,
  );

  assert.equal(calls.scheduleReviewPublication.length, 1);
  assert.equal(result.id, "queue-1");
  assert.equal(result.scheduledPublishAt?.toISOString(), "2026-03-12T15:00:00.000Z");
});

test("clearAdminScheduledReviewPublication forwards schedule clearing control", async () => {
  const { calls, dependencies } = createDependencies();

  const result = await clearAdminScheduledReviewPublication(
    {
      queueEntryId: "queue-1",
      actorId: "operator-ui",
      requestId: "clear-schedule-1",
      notes: "Publish immediately after final check.",
    },
    dependencies,
  );

  assert.equal(calls.clearScheduledReviewPublication.length, 1);
  assert.equal(result.id, "queue-1");
  assert.equal(result.scheduledPublishAt, null);
});

test("admin service denies anonymous access before backend dependencies are invoked", async () => {
  const { calls, dependencies } = createDependencies();

  await withAdminAccessStub(undefined, async () => {
    await assert.rejects(() => getAdminPublishedCatalogManagementPage({}, dependencies), {
      message: "Admin access requires an authenticated operator or admin identity.",
    });
  });

  assert.equal(calls.queryAdminPublishedCatalog.length, 0);
});

test("admin service denies underprivileged viewer access before backend dependencies are invoked", async () => {
  const { calls, dependencies } = createDependencies();

  await withAdminAccessStub("viewer", async () => {
    await assert.rejects(() => getAdminRepairQueuePage({}, dependencies), {
      message: "The current identity does not have sufficient admin privileges.",
    });
  });

  assert.equal(calls.listAdminRepairQueue.length, 0);
});

test("queue failure monitoring denies anonymous access before triage dependencies are invoked", async () => {
  const { calls, dependencies } = createDependencies();

  await withAdminAccessStub(undefined, async () => {
    await assert.rejects(() => getAdminQueueFailureMonitoringPage({}, dependencies), {
      message: "Admin access requires an authenticated operator or admin identity.",
    });
  });

  assert.equal(calls.listAdminQueueFailures.length, 0);
});

test("queue failure monitoring denies underprivileged viewer access before triage dependencies are invoked", async () => {
  const { calls, dependencies } = createDependencies();

  await withAdminAccessStub("viewer", async () => {
    await assert.rejects(() => getAdminQueueFailureMonitoringPage({}, dependencies), {
      message: "The current identity does not have sufficient admin privileges.",
    });
  });

  assert.equal(calls.listAdminQueueFailures.length, 0);
});

test("migration safety visibility denies underprivileged viewer access before backend dependencies are invoked", async () => {
  const { calls, dependencies } = createDependencies();

  await withAdminAccessStub("viewer", async () => {
    await assert.rejects(() => getAdminMigrationSafetyPage(dependencies), {
      message: "The current identity does not have sufficient admin privileges.",
    });
  });

  assert.equal(calls.getPublishedCatalogMigrationPreflight, 0);
});
