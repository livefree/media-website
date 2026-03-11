import test from "node:test";
import assert from "node:assert/strict";

import {
  getAdminPublishedCatalogManagementDetailByPublicId,
  getAdminPublishedCatalogManagementPage,
  acknowledgeAdminRepairQueueEntry,
  getAdminRepairQueuePage,
  getAdminSourceInventoryPage,
  resolveAdminRepairQueueEntry,
  updateAdminSourceOrdering,
} from "./service";

import type { AdminBackendDependencies } from "./types";
import type { AdminRepairQueueItemRecord } from "../health";
import type { AdminSourceInventoryItemRecord } from "../source";
import type {
  AdminPublishedCatalogDetailRecord,
  AdminPublishedCatalogListItemRecord,
} from "./types";

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
      updatedAt: "2026-03-11T10:00:00.000Z",
    },
    ...overrides,
  };
}

function createDependencies() {
  const calls = {
    queryAdminPublishedCatalog: [] as Array<Record<string, unknown> | undefined>,
    getAdminPublishedCatalogDetailByPublicId: [] as string[],
    listAdminSourceInventory: [] as Array<Record<string, unknown> | undefined>,
    updateSourceOrdering: [] as Array<Record<string, unknown>>,
    listAdminRepairQueue: [] as Array<Record<string, unknown> | undefined>,
    updateRepairQueueEntryStatus: [] as Array<{ entryId: string; input: Record<string, unknown> }>,
  };

  const dependencies: AdminBackendDependencies = {
    catalog: {
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
    },
    health: {
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
