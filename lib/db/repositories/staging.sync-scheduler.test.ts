import test from "node:test";
import assert from "node:assert/strict";

import { createRepositoryContext } from "./types";
import { StagingPersistenceRepository } from "./staging";

import type { ProviderSyncLaneState } from "@prisma/client";
import type { ProviderSyncState } from "../../server/ingest/sync-orchestration";
import type { UnattendedProviderSyncScheduleState } from "../../server/ingest/sync-scheduler";

function createRepository() {
  const syncStates = new Map<string, ProviderSyncLaneState>();

  const db = {
    providerSyncLaneState: {
      async findUnique(input: { where: { providerKey: string } }) {
        return syncStates.get(input.where.providerKey) ?? null;
      },
      async upsert(input: {
        where: { providerKey: string };
        create: Partial<ProviderSyncLaneState> & { providerKey: string };
        update: Partial<ProviderSyncLaneState>;
      }) {
        const existing = syncStates.get(input.where.providerKey);
        const base: ProviderSyncLaneState =
          existing ??
          {
            id: `sync-${input.where.providerKey}`,
            providerKey: input.where.providerKey,
            activeMode: null,
            activeQueueJobId: null,
            activeRequestedAt: null,
            activeCheckpoint: null,
            activeExecutionState: null,
            activeRetryCount: 0,
            activeNextAttemptAt: null,
            pendingBackfillRequest: null,
            pendingBackfillRequestedAt: null,
            pendingIncrementalRequest: null,
            pendingIncrementalRequestedAt: null,
            nextIncrementalAt: null,
            nextBackfillAt: null,
            lastIncrementalTriggeredAt: null,
            lastIncrementalCompletedAt: null,
            lastBackfillTriggeredAt: null,
            lastBackfillCompletedAt: null,
            createdAt: new Date("2026-03-15T00:00:00.000Z"),
            updatedAt: new Date("2026-03-15T00:00:00.000Z"),
          };

        const next = {
          ...base,
          ...(existing ? input.update : input.create),
          updatedAt: new Date("2026-03-15T00:05:00.000Z"),
        } as ProviderSyncLaneState;

        syncStates.set(input.where.providerKey, next);
        return next;
      },
    },
  };

  return {
    repository: new StagingPersistenceRepository(createRepositoryContext(db as never)),
  };
}

test("saveUnattendedProviderSyncScheduleState persists next-run and last-completion timestamps", async () => {
  const { repository } = createRepository();

  const saved = await repository.saveUnattendedProviderSyncScheduleState({
    providerKey: "jszyapi_vod_json",
    nextIncrementalAt: "2026-03-15T00:10:00.000Z",
    nextBackfillAt: "2026-03-15T01:00:00.000Z",
    lastIncrementalTriggeredAt: "2026-03-15T00:00:00.000Z",
    lastIncrementalCompletedAt: "2026-03-14T23:50:00.000Z",
    lastBackfillTriggeredAt: "2026-03-14T22:00:00.000Z",
    lastBackfillCompletedAt: "2026-03-14T22:30:00.000Z",
  });

  assert.equal(saved.nextIncrementalAt, "2026-03-15T00:10:00.000Z");
  assert.equal(saved.nextBackfillAt, "2026-03-15T01:00:00.000Z");
  assert.equal(saved.lastIncrementalCompletedAt, "2026-03-14T23:50:00.000Z");
  assert.equal(saved.lastBackfillCompletedAt, "2026-03-14T22:30:00.000Z");
});

test("loadUnattendedProviderSyncScheduleState restores null when no durable scheduling state exists", async () => {
  const { repository } = createRepository();

  const restored = await repository.loadUnattendedProviderSyncScheduleState("missing-provider");

  assert.equal(restored, null);
});

test("sync orchestration pending intent and unattended schedule state restore together across restart", async () => {
  const { repository } = createRepository();

  const syncState: ProviderSyncState = {
    providerKey: "jszyapi_vod_json",
    activeSync: {
      mode: "backfill",
      queueJobId: "job-1",
      requestedAt: "2026-03-15T00:00:00.000Z",
      checkpoint: {
        page: 4,
      },
      executionState: "scheduled",
      retryCount: 0,
      nextAttemptAt: null,
    },
    pendingBackfill: null,
    pendingIncremental: {
      mode: "incremental",
      request: {
        providerKey: "jszyapi_vod_json",
        mode: "incremental",
        page: 1,
        updatedAfter: "2026-03-14T23:00:00.000Z",
      },
      requestedAt: "2026-03-15T00:02:00.000Z",
    },
  };

  const scheduleState: UnattendedProviderSyncScheduleState = {
    providerKey: "jszyapi_vod_json",
    nextIncrementalAt: "2026-03-15T00:15:00.000Z",
    nextBackfillAt: null,
    lastIncrementalTriggeredAt: null,
    lastIncrementalCompletedAt: "2026-03-14T23:45:00.000Z",
    lastBackfillTriggeredAt: "2026-03-15T00:00:00.000Z",
    lastBackfillCompletedAt: null,
  };

  await repository.saveProviderSyncState(syncState);
  await repository.saveUnattendedProviderSyncScheduleState(scheduleState);

  const restoredSync = await repository.loadProviderSyncState("jszyapi_vod_json");
  const restoredSchedule = await repository.loadUnattendedProviderSyncScheduleState("jszyapi_vod_json");

  assert.equal(restoredSync.activeSync?.mode, "backfill");
  assert.equal(restoredSync.pendingIncremental?.mode, "incremental");
  assert.equal(restoredSync.pendingIncremental?.request.updatedAfter, "2026-03-14T23:00:00.000Z");
  assert.equal(restoredSchedule?.nextIncrementalAt, "2026-03-15T00:15:00.000Z");
  assert.equal(restoredSchedule?.lastIncrementalCompletedAt, "2026-03-14T23:45:00.000Z");
  assert.equal(restoredSchedule?.nextBackfillAt, null);
});
