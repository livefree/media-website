import test from "node:test";
import assert from "node:assert/strict";

import { createRepositoryContext } from "./types";
import { StagingPersistenceRepository } from "./staging";

import type { ProviderSyncLaneState, ProviderRegistry } from "@prisma/client";
import type { ProviderSyncState } from "../../server/ingest/sync-orchestration";

type SyncJobRecord = {
  id: string;
  providerId: string;
  provider: {
    adapterKey: string;
  };
  mode: "BACKFILL" | "INCREMENTAL" | "MANUAL";
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
  requestId?: string | null;
  actorId?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  attemptCount: number;
  retryCount: number;
  lastAttemptedAt?: Date | null;
  nextAttemptAt?: Date | null;
  leaseWorkerId?: string | null;
  leaseId?: string | null;
  leaseClaimedAt?: Date | null;
  leaseExpiresAt?: Date | null;
  lastErrorSummary?: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

function createRepository() {
  const syncStates = new Map<string, ProviderSyncLaneState>();
  const providers = new Map<string, ProviderRegistry>([
    [
      "jszyapi_vod_json",
      {
        id: "provider-1",
        adapterKey: "jszyapi_vod_json",
        displayName: "jszyapi",
        providerType: "CATALOG_PROVIDER",
        capabilities: ["CATALOG"],
        enabled: true,
        baseUrl: "https://example.test/api",
        metadata: null,
        lastSuccessfulSyncAt: null,
        createdAt: new Date("2026-03-14T00:00:00.000Z"),
        updatedAt: new Date("2026-03-14T00:00:00.000Z"),
      },
    ],
  ]);
  const ingestJobs: SyncJobRecord[] = [];

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
            createdAt: new Date("2026-03-14T00:00:00.000Z"),
            updatedAt: new Date("2026-03-14T00:00:00.000Z"),
          };

        const next = {
          ...base,
          ...(existing ? input.update : input.create),
          updatedAt: new Date("2026-03-14T00:05:00.000Z"),
        } as ProviderSyncLaneState;

        syncStates.set(input.where.providerKey, next);
        return next;
      },
    },
    providerRegistry: {
      async findUnique(input: { where: { adapterKey: string }; select: { id: true } }) {
        const provider = providers.get(input.where.adapterKey);
        return provider ? { id: provider.id } : null;
      },
    },
    ingestJob: {
      async create(input: {
        data: Record<string, unknown>;
        include: { provider: { select: { adapterKey: true } } };
      }) {
        const provider = [...providers.values()].find((candidate) => candidate.id === input.data.providerId);
        assert.ok(provider);

        const record: SyncJobRecord = {
          id: `job-${ingestJobs.length + 1}`,
          providerId: input.data.providerId as string,
          provider: {
            adapterKey: provider.adapterKey,
          },
          mode: input.data.mode as SyncJobRecord["mode"],
          status: input.data.status as SyncJobRecord["status"],
          requestId: (input.data.requestId as string | null | undefined) ?? null,
          actorId: (input.data.actorId as string | null | undefined) ?? null,
          startedAt: null,
          finishedAt: null,
          attemptCount: 0,
          retryCount: (input.data.retryCount as number | undefined) ?? 0,
          lastAttemptedAt: (input.data.lastAttemptedAt as Date | null | undefined) ?? null,
          nextAttemptAt: (input.data.nextAttemptAt as Date | null | undefined) ?? null,
          leaseWorkerId: null,
          leaseId: null,
          leaseClaimedAt: null,
          leaseExpiresAt: null,
          lastErrorSummary: null,
          metadata: (input.data.metadata as Record<string, unknown> | null | undefined) ?? null,
          createdAt: new Date(`2026-03-14T00:00:0${ingestJobs.length}.000Z`),
        };

        ingestJobs.push(record);
        return record;
      },
    },
  };

  return {
    ingestJobs,
    repository: new StagingPersistenceRepository(createRepositoryContext(db as never)),
  };
}

test("saveProviderSyncState persists active sync plus pending backfill and coalesced incremental intent", async () => {
  const { repository } = createRepository();

  const state: ProviderSyncState = {
    providerKey: "jszyapi_vod_json",
    activeSync: {
      mode: "incremental",
      queueJobId: "job-active-1",
      requestedAt: "2026-03-14T00:01:00.000Z",
      checkpoint: {
        page: 3,
        cursor: "cursor-3",
      },
      executionState: "waiting_retry",
      retryCount: 2,
      nextAttemptAt: "2026-03-14T00:05:00.000Z",
    },
    pendingBackfill: {
      mode: "backfill",
      request: {
        providerKey: "jszyapi_vod_json",
        mode: "backfill",
        page: 1,
        requestId: "backfill-1",
      },
      requestedAt: "2026-03-14T00:02:00.000Z",
    },
    pendingIncremental: {
      mode: "incremental",
      request: {
        providerKey: "jszyapi_vod_json",
        mode: "incremental",
        page: 1,
        updatedAfter: "2026-03-13T00:00:00.000Z",
        requestId: "incremental-1",
      },
      requestedAt: "2026-03-14T00:03:00.000Z",
    },
  };

  await repository.saveProviderSyncState(state);
  const restored = await repository.loadProviderSyncState("jszyapi_vod_json");

  assert.equal(restored.activeSync?.mode, "incremental");
  assert.equal(restored.activeSync?.executionState, "waiting_retry");
  assert.equal(restored.activeSync?.checkpoint?.page, 3);
  assert.equal(restored.pendingBackfill?.mode, "backfill");
  assert.equal(restored.pendingBackfill?.request.page, 1);
  assert.equal(restored.pendingIncremental?.mode, "incremental");
  assert.equal(restored.pendingIncremental?.request.updatedAfter, "2026-03-13T00:00:00.000Z");
});

test("loadProviderSyncState restores empty initial state when no durable lane exists", async () => {
  const { repository } = createRepository();

  const restored = await repository.loadProviderSyncState("missing-provider");

  assert.equal(restored.providerKey, "missing-provider");
  assert.equal(restored.activeSync, null);
  assert.equal(restored.pendingBackfill, null);
  assert.equal(restored.pendingIncremental, null);
});

test("enqueueQueuedProviderPageSyncJob persists one durable queued job for sync promotion", async () => {
  const { repository, ingestJobs } = createRepository();

  const queued = await repository.enqueueQueuedProviderPageSyncJob({
    providerKey: "jszyapi_vod_json",
    mode: "backfill",
    request: {
      providerKey: "jszyapi_vod_json",
      mode: "backfill",
      page: 1,
      requestId: "backfill-queue-1",
      actorId: "worker-orchestrator",
    },
    requestedAt: "2026-03-14T00:10:00.000Z",
  });

  assert.equal(queued.providerKey, "jszyapi_vod_json");
  assert.equal(queued.mode, "backfill");
  assert.equal(queued.request.page, 1);
  assert.equal(queued.retryCount, 0);
  assert.equal(queued.nextAttemptAt, null);

  assert.equal(ingestJobs.length, 1);
  assert.equal(ingestJobs[0]?.status, "PENDING");
  assert.equal(ingestJobs[0]?.mode, "BACKFILL");
  assert.equal((ingestJobs[0]?.metadata as { orchestration?: { requestedAt?: string }; executionTelemetry?: { providerKey?: string } })?.orchestration?.requestedAt, "2026-03-14T00:10:00.000Z");
  assert.equal((ingestJobs[0]?.metadata as { executionTelemetry?: { providerKey?: string } })?.executionTelemetry?.providerKey, "jszyapi_vod_json");
});
