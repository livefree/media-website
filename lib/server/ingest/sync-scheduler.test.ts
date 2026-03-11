import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  applyProviderSyncPageJobResult,
  createInitialProviderSyncState,
} from "./sync-orchestration";
import {
  applyUnattendedProviderSyncAdvance,
  createInitialUnattendedProviderSyncScheduleState,
  runUnattendedProviderSyncTick,
} from "./sync-scheduler";
import { runNextResumableProviderPageJob } from "./page-worker";

import type {
  ClaimQueuedProviderPageJobInput,
  ClaimedQueuedProviderPageJob,
  CompleteQueuedProviderPageJobInput,
  DurableProviderPageJobQueueGateway,
  FailQueuedProviderPageJobInput,
  QueuedProviderPageJob,
  RequeueQueuedProviderPageJobInput,
} from "./page-worker";
import type { ExecuteProviderPageIngestRunResult } from "./execution";
import type { IngestPageRequest } from "./types";

async function loadFixture() {
  const fixtureUrl = new URL("../provider/__fixtures__/jszyapi-page.json", import.meta.url);
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as {
    list?: Array<{ vod_id?: string | number; vod_name?: string; type_name?: string; vod_remarks?: string }>;
  };
}

function createSyncQueueDouble() {
  let sequence = 1;
  const state = {
    queued: [] as QueuedProviderPageJob[],
    leasedJobId: null as string | null,
  };
  const calls = {
    enqueue: [] as Array<{ providerKey: string; mode: "backfill" | "incremental"; request: IngestPageRequest; requestedAt: string }>,
    claim: [] as ClaimQueuedProviderPageJobInput[],
    requeue: [] as RequeueQueuedProviderPageJobInput[],
    complete: [] as CompleteQueuedProviderPageJobInput[],
    fail: [] as FailQueuedProviderPageJobInput[],
  };

  const queue = {
    async enqueueQueuedProviderPageSyncJob(input) {
      calls.enqueue.push(input);
      const job: QueuedProviderPageJob = {
        queueJobId: `queue-page-${sequence++}`,
        providerKey: input.providerKey,
        mode: input.mode,
        request: { ...input.request },
        attemptCount: 1,
        retryCount: 0,
        lastAttemptedAt: null,
        nextAttemptAt: null,
        enqueuedAt: input.requestedAt,
      };
      state.queued.push(job);
      return job;
    },
    async claimNextQueuedProviderPageJob(input: ClaimQueuedProviderPageJobInput) {
      calls.claim.push(input);
      if (state.leasedJobId) {
        return null;
      }

      const job = state.queued[0];
      if (!job) {
        return null;
      }

      state.leasedJobId = job.queueJobId;

      const claimed: ClaimedQueuedProviderPageJob = {
        ...job,
        request: { ...job.request },
        lease: {
          workerId: input.workerId,
          leaseId: `lease-${job.queueJobId}`,
          claimedAt: input.claimedAt,
          leaseExpiresAt: new Date(Date.parse(input.claimedAt) + input.leaseMs).toISOString(),
        },
      };

      return claimed;
    },
    async requeueQueuedProviderPageJob(input: RequeueQueuedProviderPageJobInput) {
      const job = state.queued[0];
      assert.ok(job);
      assert.equal(state.leasedJobId, input.queueJobId);
      state.leasedJobId = null;
      calls.requeue.push(input);
      state.queued[0] = {
        ...job,
        checkpoint: input.checkpoint,
        attemptCount: job.attemptCount + 1,
        retryCount: input.retryCount ?? job.retryCount ?? 0,
        lastAttemptedAt: input.lastAttemptedAt ?? job.lastAttemptedAt ?? null,
        nextAttemptAt: input.nextAttemptAt ?? job.nextAttemptAt ?? null,
      };
    },
    async completeQueuedProviderPageJob(input: CompleteQueuedProviderPageJobInput) {
      assert.equal(state.leasedJobId, input.queueJobId);
      state.leasedJobId = null;
      calls.complete.push(input);
      state.queued.shift();
    },
    async failQueuedProviderPageJob(input: FailQueuedProviderPageJobInput) {
      assert.equal(state.leasedJobId, input.queueJobId);
      state.leasedJobId = null;
      calls.fail.push(input);
      state.queued.shift();
    },
  } satisfies DurableProviderPageJobQueueGateway & {
    enqueueQueuedProviderPageSyncJob: (input: {
      providerKey: string;
      mode: "backfill" | "incremental";
      request: IngestPageRequest;
      requestedAt: string;
    }) => Promise<QueuedProviderPageJob>;
  };

  return {
    calls,
    queue,
    state,
  };
}

function createFixtureBackedPageRunner(fixture: Awaited<ReturnType<typeof loadFixture>>) {
  const requests: IngestPageRequest[] = [];
  const totalPages = 2;

  return {
    requests,
    async runProviderPageJob(request: IngestPageRequest): Promise<ExecuteProviderPageIngestRunResult> {
      requests.push({ ...request });
      const currentPage = request.page ?? 1;
      const nextPage = currentPage < totalPages ? currentPage + 1 : null;

      return {
        provider: {
          id: "provider-1",
          adapterKey: "jszyapi_vod_json",
          displayName: "jszyapi Base VOD JSON",
          providerType: "catalog",
          capabilities: ["catalog", "playback", "download"],
          enabled: true,
          baseUrl: "https://jszyapi.example/api",
          lastSuccessfulSyncAt: null,
        },
        job: {
          id: `job-page-${currentPage}`,
          providerId: "provider-1",
          mode: request.mode,
          status: "succeeded",
          requestId: request.requestId ?? null,
          actorId: request.actorId ?? null,
          attemptCount: 1,
          startedAt: new Date("2026-03-11T23:00:00.000Z"),
          finishedAt: new Date("2026-03-11T23:00:00.000Z"),
          lastErrorSummary: null,
        },
        run: {
          id: `run-page-${currentPage}`,
          ingestJobId: `job-page-${currentPage}`,
          providerId: "provider-1",
          mode: request.mode,
          scope: "page",
          status: "succeeded",
          providerItemId: null,
          requestId: request.requestId ?? null,
          actorId: request.actorId ?? null,
          itemCount: fixture.list?.length ?? 0,
          rawPayloadCount: 1,
          warningCount: 0,
          startedAt: new Date("2026-03-11T23:00:00.000Z"),
          finishedAt: new Date("2026-03-11T23:00:00.000Z"),
          lastErrorSummary: null,
        },
        ingest: {
          providerKey: "jszyapi_vod_json",
          mode: request.mode,
          itemCount: fixture.list?.length ?? 0,
          rawPayloadCount: 1,
          persistence: {
            providerKey: "jszyapi_vod_json",
            mode: request.mode,
            fetchedAt: "2026-03-11T23:00:00.000Z",
            requestId: request.requestId,
            payloads: [{ payloadFormat: "json", fetchedAt: "2026-03-11T23:00:00.000Z", payload: fixture }],
            items: (fixture.list ?? []).map((item) => ({
              providerItemId: String(item.vod_id ?? ""),
              title: item.vod_name ?? "",
              rawEpisodeText: item.vod_remarks,
              typeHint: item.type_name?.includes("动漫") ? "anime" : "movie",
              sourceFragments: [],
              warnings: [],
            })),
            checkpoint: nextPage ? { cursor: null, page: nextPage } : undefined,
          },
        },
        persisted: {
          providerItems: [],
          rawPayloads: [],
          candidates: [],
          checkpoint: nextPage
            ? {
                id: `checkpoint-${nextPage}`,
                providerId: "provider-1",
                ingestJobId: `job-page-${currentPage}`,
                ingestRunId: `run-page-${currentPage}`,
                cursor: null,
                page: nextPage,
                updatedAfter: null,
                updatedBefore: null,
                providerUpdatedAt: null,
                recordedAt: new Date("2026-03-11T23:00:00.000Z"),
              }
            : undefined,
        },
      };
    },
  };
}

test("unattended scheduling triggers backfill first and defers incremental in the same due tick", async () => {
  const { queue, calls } = createSyncQueueDouble();
  const syncState = createInitialProviderSyncState("jszyapi_vod_json");
  const scheduleState = createInitialUnattendedProviderSyncScheduleState(
    {
      providerKey: "jszyapi_vod_json",
      incrementalIntervalMs: 60_000,
      incrementalBootstrapUpdatedAfter: "2026-03-10T00:00:00.000Z",
      backfillStartPage: 1,
    },
    "2026-03-11T23:00:00.000Z",
  );

  const result = await runUnattendedProviderSyncTick(
    queue,
    syncState,
    scheduleState,
    {
      providerKey: "jszyapi_vod_json",
      incrementalIntervalMs: 60_000,
      incrementalBootstrapUpdatedAfter: "2026-03-10T00:00:00.000Z",
      backfillStartPage: 1,
    },
    "2026-03-11T23:00:00.000Z",
  );

  assert.equal(result.decisions[0]?.mode, "backfill");
  assert.equal(result.decisions[0]?.disposition, "triggered");
  assert.equal(result.decisions[1]?.mode, "incremental");
  assert.equal(result.decisions[1]?.disposition, "deferred");
  assert.equal(result.syncState.activeSync?.mode, "backfill");
  assert.equal(result.syncState.pendingIncremental?.mode, "incremental");
  assert.equal(result.scheduleState.nextBackfillAt, null);
  assert.equal(result.scheduleState.nextIncrementalAt, "2026-03-11T23:01:00.000Z");
  assert.equal(calls.enqueue.length, 1);
});

test("unattended scheduling skips cleanly when no sync lane is due", async () => {
  const { queue, calls } = createSyncQueueDouble();
  const syncState = createInitialProviderSyncState("jszyapi_vod_json");
  const scheduleState = {
    providerKey: "jszyapi_vod_json",
    nextIncrementalAt: "2026-03-11T23:10:00.000Z",
    nextBackfillAt: null,
    lastIncrementalTriggeredAt: null,
    lastIncrementalCompletedAt: null,
    lastBackfillTriggeredAt: "2026-03-11T23:00:00.000Z",
    lastBackfillCompletedAt: "2026-03-11T23:05:00.000Z",
  };

  const result = await runUnattendedProviderSyncTick(
    queue,
    syncState,
    scheduleState,
    {
      providerKey: "jszyapi_vod_json",
      incrementalIntervalMs: 60_000,
    },
    "2026-03-11T23:05:30.000Z",
  );

  assert.deepEqual(
    result.decisions.map((decision) => decision.disposition),
    ["skipped", "skipped"],
  );
  assert.equal(calls.enqueue.length, 0);
});

test("unattended scheduling defers incremental when a backfill lane is already active", async () => {
  const { queue, calls } = createSyncQueueDouble();
  const syncState = {
    ...createInitialProviderSyncState("jszyapi_vod_json"),
    activeSync: {
      mode: "backfill" as const,
      queueJobId: "queue-page-1",
      requestedAt: "2026-03-11T23:15:00.000Z",
      checkpoint: { page: 2 },
      executionState: "scheduled" as const,
      retryCount: 0,
      nextAttemptAt: null,
    },
  };
  const scheduleState = {
    providerKey: "jszyapi_vod_json",
    nextIncrementalAt: "2026-03-11T23:16:00.000Z",
    nextBackfillAt: null,
    lastIncrementalTriggeredAt: null,
    lastIncrementalCompletedAt: "2026-03-11T22:00:00.000Z",
    lastBackfillTriggeredAt: "2026-03-11T23:15:00.000Z",
    lastBackfillCompletedAt: null,
  };

  const result = await runUnattendedProviderSyncTick(
    queue,
    syncState,
    scheduleState,
    {
      providerKey: "jszyapi_vod_json",
      incrementalIntervalMs: 120_000,
    },
    "2026-03-11T23:16:00.000Z",
  );

  assert.equal(result.decisions[1]?.mode, "incremental");
  assert.equal(result.decisions[1]?.disposition, "deferred");
  assert.equal(result.syncState.pendingIncremental?.mode, "incremental");
  assert.equal(result.scheduleState.nextIncrementalAt, "2026-03-11T23:18:00.000Z");
  assert.equal(calls.enqueue.length, 0);
});

test("unattended scheduling repeats incremental sync and advances bootstrap from last completion", async () => {
  const fixture = await loadFixture();
  const { queue, calls } = createSyncQueueDouble();
  const runner = createFixtureBackedPageRunner(fixture);

  let syncState = createInitialProviderSyncState("jszyapi_vod_json");
  let scheduleState = {
    providerKey: "jszyapi_vod_json",
    nextIncrementalAt: "2026-03-11T23:20:00.000Z",
    nextBackfillAt: null,
    lastIncrementalTriggeredAt: null,
    lastIncrementalCompletedAt: "2026-03-11T23:00:00.000Z",
    lastBackfillTriggeredAt: "2026-03-11T22:00:00.000Z",
    lastBackfillCompletedAt: "2026-03-11T22:10:00.000Z",
  };

  const tickOne = await runUnattendedProviderSyncTick(
    queue,
    syncState,
    scheduleState,
    {
      providerKey: "jszyapi_vod_json",
      incrementalIntervalMs: 60_000,
    },
    "2026-03-11T23:20:00.000Z",
  );
  syncState = tickOne.syncState;
  scheduleState = tickOne.scheduleState;

  const runOne = await runNextResumableProviderPageJob(queue, runner, {
    workerId: "worker-scheduler",
    now: () => new Date("2026-03-11T23:20:10.000Z"),
    retryLimit: 0,
  });
  const advanceOne = await applyProviderSyncPageJobResult(queue, syncState, runOne);
  syncState = advanceOne.state;

  const runTwo = await runNextResumableProviderPageJob(queue, runner, {
    workerId: "worker-scheduler",
    now: () => new Date("2026-03-11T23:20:20.000Z"),
    retryLimit: 0,
  });
  const advanceTwo = await applyProviderSyncPageJobResult(queue, syncState, runTwo);
  const appliedAdvance = await applyUnattendedProviderSyncAdvance(
    queue,
    syncState,
    scheduleState,
    advanceTwo,
    "2026-03-11T23:20:20.000Z",
  );
  syncState = appliedAdvance.syncState;
  scheduleState = appliedAdvance.scheduleState;

  assert.equal(syncState.activeSync, null);
  assert.equal(scheduleState.lastIncrementalCompletedAt, "2026-03-11T23:20:20.000Z");

  const tickTwo = await runUnattendedProviderSyncTick(
    queue,
    syncState,
    scheduleState,
    {
      providerKey: "jszyapi_vod_json",
      incrementalIntervalMs: 60_000,
    },
    "2026-03-11T23:21:00.000Z",
  );

  assert.equal(tickTwo.decisions[1]?.disposition, "triggered");
  assert.equal(calls.enqueue.length, 2);
  assert.equal(calls.enqueue[0]?.request.updatedAfter, "2026-03-11T23:00:00.000Z");
  assert.equal(calls.enqueue[1]?.request.updatedAfter, "2026-03-11T23:20:20.000Z");
});
