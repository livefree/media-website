import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  applyProviderSyncPageJobResult,
  createInitialProviderSyncState,
  scheduleProviderBackfillSync,
  scheduleProviderIncrementalSync,
} from "./sync-orchestration";
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
    completed: [] as CompleteQueuedProviderPageJobInput[],
    failed: [] as FailQueuedProviderPageJobInput[],
  };
  const calls = {
    enqueue: [] as Array<{ providerKey: string; mode: "backfill" | "incremental"; request: IngestPageRequest; requestedAt: string }>,
    claim: [] as ClaimQueuedProviderPageJobInput[],
    requeue: [] as RequeueQueuedProviderPageJobInput[],
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
      state.completed.push(input);
      state.queued.shift();
    },
    async failQueuedProviderPageJob(input: FailQueuedProviderPageJobInput) {
      assert.equal(state.leasedJobId, input.queueJobId);
      state.leasedJobId = null;
      state.failed.push(input);
      state.queued.shift();
    },
  } satisfies DurableProviderPageJobQueueGateway & {
    enqueueQueuedProviderPageSyncJob: (
      input: Parameters<typeof scheduleProviderBackfillSync>[2] extends never ? never : {
        providerKey: string;
        mode: "backfill" | "incremental";
        request: IngestPageRequest;
        requestedAt: string;
      },
    ) => Promise<QueuedProviderPageJob>;
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
          startedAt: new Date("2026-03-11T22:00:00.000Z"),
          finishedAt: new Date("2026-03-11T22:00:00.000Z"),
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
          startedAt: new Date("2026-03-11T22:00:00.000Z"),
          finishedAt: new Date("2026-03-11T22:00:00.000Z"),
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
            fetchedAt: "2026-03-11T22:00:00.000Z",
            requestId: request.requestId,
            payloads: [
              {
                payloadFormat: "json",
                fetchedAt: "2026-03-11T22:00:00.000Z",
                payload: fixture,
              },
            ],
            items: (fixture.list ?? []).map((item) => ({
              providerItemId: String(item.vod_id ?? ""),
              title: item.vod_name ?? "",
              rawEpisodeText: item.vod_remarks,
              typeHint: item.type_name?.includes("动漫") ? "anime" : "movie",
              sourceFragments: [],
              warnings: [],
            })),
            checkpoint: nextPage
              ? {
                  cursor: null,
                  page: nextPage,
                }
              : undefined,
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
                recordedAt: new Date("2026-03-11T22:00:00.000Z"),
              }
            : undefined,
        },
      };
    },
  };
}

test("backfill sync is queued, continued through checkpointed execution, and then completes deterministically", async () => {
  const fixture = await loadFixture();
  const { queue, calls } = createSyncQueueDouble();
  const runner = createFixtureBackedPageRunner(fixture);

  let syncState = createInitialProviderSyncState("jszyapi_vod_json");
  const queuedBackfill = await scheduleProviderBackfillSync(
    queue,
    syncState,
    {
      providerKey: "jszyapi_vod_json",
      mode: "backfill",
      page: 1,
      requestId: "backfill-1",
    },
    "2026-03-11T22:00:00.000Z",
  );

  assert.equal(queuedBackfill.status, "queued");
  syncState = queuedBackfill.state;
  assert.equal(syncState.activeSync?.mode, "backfill");
  assert.equal(calls.enqueue.length, 1);

  const firstRun = await runNextResumableProviderPageJob(queue, runner, {
    workerId: "worker-backfill",
    now: () => new Date("2026-03-11T22:01:00.000Z"),
    retryLimit: 0,
  });
  const afterFirst = await applyProviderSyncPageJobResult(queue, syncState, firstRun);
  assert.equal(afterFirst.status, "continued");
  syncState = afterFirst.state;
  assert.equal(syncState.activeSync?.checkpoint?.page, 2);

  const secondRun = await runNextResumableProviderPageJob(queue, runner, {
    workerId: "worker-backfill",
    now: () => new Date("2026-03-11T22:02:00.000Z"),
    retryLimit: 0,
  });
  const afterSecond = await applyProviderSyncPageJobResult(queue, syncState, secondRun);
  assert.equal(afterSecond.status, "idle");
  assert.equal(afterSecond.state.activeSync, null);
  assert.deepEqual(
    runner.requests.map((request) => request.page),
    [1, 2],
  );
});

test("incremental sync queues independently and preserves incremental request semantics", async () => {
  const fixture = await loadFixture();
  const { queue } = createSyncQueueDouble();
  const runner = createFixtureBackedPageRunner(fixture);

  let syncState = createInitialProviderSyncState("jszyapi_vod_json");
  const queuedIncremental = await scheduleProviderIncrementalSync(
    queue,
    syncState,
    {
      providerKey: "jszyapi_vod_json",
      mode: "incremental",
      updatedAfter: "2026-03-10T00:00:00.000Z",
      requestId: "incremental-1",
    },
    "2026-03-11T22:10:00.000Z",
  );

  assert.equal(queuedIncremental.status, "queued");
  syncState = queuedIncremental.state;
  assert.equal(syncState.activeSync?.mode, "incremental");

  const firstRun = await runNextResumableProviderPageJob(queue, runner, {
    workerId: "worker-incremental",
    now: () => new Date("2026-03-11T22:11:00.000Z"),
    retryLimit: 0,
  });
  const afterFirst = await applyProviderSyncPageJobResult(queue, syncState, firstRun);
  assert.equal(afterFirst.status, "continued");
  syncState = afterFirst.state;

  const secondRun = await runNextResumableProviderPageJob(queue, runner, {
    workerId: "worker-incremental",
    now: () => new Date("2026-03-11T22:12:00.000Z"),
    retryLimit: 0,
  });
  const afterSecond = await applyProviderSyncPageJobResult(queue, syncState, secondRun);
  assert.equal(afterSecond.status, "idle");
  assert.equal(afterSecond.state.activeSync, null);
  assert.equal(runner.requests[0]?.mode, "incremental");
  assert.equal(runner.requests[0]?.updatedAfter, "2026-03-10T00:00:00.000Z");
  assert.equal(runner.requests[0]?.page, 1);
});

test("incremental requests are deferred and coalesced behind an active backfill, then promoted after backfill completion", async () => {
  const fixture = await loadFixture();
  const { queue, calls } = createSyncQueueDouble();
  const runner = createFixtureBackedPageRunner(fixture);

  let syncState = createInitialProviderSyncState("jszyapi_vod_json");
  syncState = (
    await scheduleProviderBackfillSync(
      queue,
      syncState,
      {
        providerKey: "jszyapi_vod_json",
        mode: "backfill",
        requestId: "backfill-2",
      },
      "2026-03-11T22:20:00.000Z",
    )
  ).state;

  const firstIncremental = await scheduleProviderIncrementalSync(
    queue,
    syncState,
    {
      providerKey: "jszyapi_vod_json",
      mode: "incremental",
      updatedAfter: "2026-03-10T01:00:00.000Z",
      requestId: "incremental-a",
    },
    "2026-03-11T22:20:30.000Z",
  );
  assert.equal(firstIncremental.status, "deferred");
  syncState = firstIncremental.state;

  const secondIncremental = await scheduleProviderIncrementalSync(
    queue,
    syncState,
    {
      providerKey: "jszyapi_vod_json",
      mode: "incremental",
      updatedAfter: "2026-03-09T23:00:00.000Z",
      requestId: "incremental-b",
    },
    "2026-03-11T22:21:00.000Z",
  );
  assert.equal(secondIncremental.status, "coalesced");
  syncState = secondIncremental.state;
  assert.equal(syncState.pendingIncremental?.request.updatedAfter, "2026-03-09T23:00:00.000Z");

  const runOne = await runNextResumableProviderPageJob(queue, runner, {
    workerId: "worker-coordination",
    now: () => new Date("2026-03-11T22:22:00.000Z"),
    retryLimit: 0,
  });
  syncState = (await applyProviderSyncPageJobResult(queue, syncState, runOne)).state;
  const runTwo = await runNextResumableProviderPageJob(queue, runner, {
    workerId: "worker-coordination",
    now: () => new Date("2026-03-11T22:23:00.000Z"),
    retryLimit: 0,
  });
  const afterBackfill = await applyProviderSyncPageJobResult(queue, syncState, runTwo);

  assert.equal(afterBackfill.status, "promoted");
  assert.equal(afterBackfill.promotedMode, "incremental");
  assert.equal(afterBackfill.state.activeSync?.mode, "incremental");
  assert.equal(afterBackfill.state.pendingIncremental, null);
  assert.equal(calls.enqueue.length, 2);
  assert.equal(calls.enqueue[1]?.mode, "incremental");
  assert.equal(calls.enqueue[1]?.request.updatedAfter, "2026-03-09T23:00:00.000Z");
});

test("backfill requests are deferred behind an active incremental and promoted after incremental completion", async () => {
  const fixture = await loadFixture();
  const { queue, calls } = createSyncQueueDouble();
  const runner = createFixtureBackedPageRunner(fixture);

  let syncState = createInitialProviderSyncState("jszyapi_vod_json");
  syncState = (
    await scheduleProviderIncrementalSync(
      queue,
      syncState,
      {
        providerKey: "jszyapi_vod_json",
        mode: "incremental",
        updatedAfter: "2026-03-11T00:00:00.000Z",
        requestId: "incremental-live",
      },
      "2026-03-11T22:30:00.000Z",
    )
  ).state;

  const deferredBackfill = await scheduleProviderBackfillSync(
    queue,
    syncState,
    {
      providerKey: "jszyapi_vod_json",
      mode: "backfill",
      requestId: "backfill-later",
    },
    "2026-03-11T22:30:30.000Z",
  );
  assert.equal(deferredBackfill.status, "deferred");
  syncState = deferredBackfill.state;
  assert.equal(syncState.pendingBackfill?.mode, "backfill");

  const runOne = await runNextResumableProviderPageJob(queue, runner, {
    workerId: "worker-incremental-first",
    now: () => new Date("2026-03-11T22:31:00.000Z"),
    retryLimit: 0,
  });
  syncState = (await applyProviderSyncPageJobResult(queue, syncState, runOne)).state;
  const runTwo = await runNextResumableProviderPageJob(queue, runner, {
    workerId: "worker-incremental-first",
    now: () => new Date("2026-03-11T22:32:00.000Z"),
    retryLimit: 0,
  });
  const afterIncremental = await applyProviderSyncPageJobResult(queue, syncState, runTwo);

  assert.equal(afterIncremental.status, "promoted");
  assert.equal(afterIncremental.promotedMode, "backfill");
  assert.equal(afterIncremental.state.activeSync?.mode, "backfill");
  assert.equal(afterIncremental.state.pendingBackfill, null);
  assert.equal(calls.enqueue.length, 2);
  assert.equal(calls.enqueue[1]?.mode, "backfill");
});
