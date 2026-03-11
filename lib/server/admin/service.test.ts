import test from "node:test";
import assert from "node:assert/strict";

import {
  acknowledgeAdminRepairQueueEntry,
  getAdminRepairQueuePage,
  getAdminSourceInventoryPage,
  resolveAdminRepairQueueEntry,
  updateAdminSourceOrdering,
} from "./service";

import type { AdminBackendDependencies } from "./types";
import type { AdminRepairQueueItemRecord } from "../health";
import type { AdminSourceInventoryItemRecord } from "../source";

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

function createDependencies() {
  const calls = {
    listAdminSourceInventory: [] as Array<Record<string, unknown> | undefined>,
    updateSourceOrdering: [] as Array<Record<string, unknown>>,
    listAdminRepairQueue: [] as Array<Record<string, unknown> | undefined>,
    updateRepairQueueEntryStatus: [] as Array<{ entryId: string; input: Record<string, unknown> }>,
  };

  const dependencies: AdminBackendDependencies = {
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
