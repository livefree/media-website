import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { buildResumedPageRequest, runNextResumableProviderPageJob } from "./page-worker";

import type {
  ClaimQueuedProviderPageJobInput,
  ClaimedQueuedProviderPageJob,
  CompleteQueuedProviderPageJobInput,
  DurableProviderPageJobQueueGateway,
  FailQueuedProviderPageJobInput,
  ProviderPageWorkerCheckpoint,
  QueuedProviderPageJob,
  RequeueQueuedProviderPageJobInput,
} from "./page-worker";
import type { ExecuteProviderPageIngestRunResult } from "./execution";
import type { IngestPageRequest } from "./types";

async function loadFixture() {
  const fixtureUrl = new URL("../provider/__fixtures__/jszyapi-page.json", import.meta.url);
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as {
    list?: Array<{ vod_id?: string | number; vod_name?: string; type_name?: string; vod_remarks?: string }>;
    pagecount?: number | string;
  };
}

function createQueuedPageJob(checkpoint?: ProviderPageWorkerCheckpoint | null): QueuedProviderPageJob {
  return {
    queueJobId: "queue-page-1",
    providerKey: "jszyapi_vod_json",
    mode: "backfill",
    request: {
      providerKey: "jszyapi_vod_json",
      mode: "backfill",
      page: 2,
      requestId: "req-page-1",
      actorId: "worker-test",
    },
    checkpoint,
    requestId: "req-page-1",
    actorId: "worker-test",
    attemptCount: 1,
    enqueuedAt: "2026-03-11T21:00:00.000Z",
  };
}

function createQueueDouble(seedJob: QueuedProviderPageJob) {
  const state = {
    job: { ...seedJob, request: { ...seedJob.request } },
    leased: false,
    completed: false,
    failed: false,
    requeueCount: 0,
  };
  const calls = {
    claim: [] as ClaimQueuedProviderPageJobInput[],
    requeue: [] as RequeueQueuedProviderPageJobInput[],
    complete: [] as CompleteQueuedProviderPageJobInput[],
    fail: [] as FailQueuedProviderPageJobInput[],
  };

  const queue: DurableProviderPageJobQueueGateway = {
    async claimNextQueuedProviderPageJob(input) {
      calls.claim.push(input);

      if (state.leased || state.completed || state.failed) {
        return null;
      }

      state.leased = true;

      const claimed: ClaimedQueuedProviderPageJob = {
        ...state.job,
        request: { ...state.job.request },
        lease: {
          workerId: input.workerId,
          leaseId: "lease-page-1",
          claimedAt: input.claimedAt,
          leaseExpiresAt: new Date(Date.parse(input.claimedAt) + input.leaseMs).toISOString(),
        },
      };

      return claimed;
    },
    async requeueQueuedProviderPageJob(input) {
      calls.requeue.push(input);
      assert.equal(state.leased, true);
      state.leased = false;
      state.requeueCount += 1;
      state.job = {
        ...state.job,
        attemptCount: state.job.attemptCount + 1,
        checkpoint: input.checkpoint,
      };
    },
    async completeQueuedProviderPageJob(input) {
      calls.complete.push(input);
      assert.equal(state.leased, true);
      state.leased = false;
      state.completed = true;
    },
    async failQueuedProviderPageJob(input) {
      calls.fail.push(input);
      assert.equal(state.leased, true);
      state.leased = false;
      state.failed = true;
    },
  };

  return {
    calls,
    queue,
    state,
  };
}

function createFixtureBackedPageRunner(fixture: Awaited<ReturnType<typeof loadFixture>>) {
  const requests: IngestPageRequest[] = [];

  return {
    requests,
    async runProviderPageJob(request: IngestPageRequest): Promise<ExecuteProviderPageIngestRunResult> {
      requests.push({ ...request });
      const currentPage = request.page ?? 1;
      const pageCount = Number(fixture.pagecount ?? currentPage);
      const nextPage = currentPage < pageCount ? currentPage + 1 : null;

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
          startedAt: new Date("2026-03-11T21:00:00.000Z"),
          finishedAt: new Date("2026-03-11T21:00:00.000Z"),
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
          startedAt: new Date("2026-03-11T21:00:00.000Z"),
          finishedAt: new Date("2026-03-11T21:00:00.000Z"),
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
            fetchedAt: "2026-03-11T21:00:00.000Z",
            requestId: request.requestId,
            payloads: [
              {
                payloadFormat: "json",
                fetchedAt: "2026-03-11T21:00:00.000Z",
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
                recordedAt: new Date("2026-03-11T21:00:00.000Z"),
              }
            : undefined,
        },
      };
    },
  };
}

test("buildResumedPageRequest re-enters from the last durable checkpoint instead of process-local request state", () => {
  const resumed = buildResumedPageRequest(
    {
      providerKey: "jszyapi_vod_json",
      mode: "backfill",
      page: 2,
      cursor: "stale-cursor",
      updatedAfter: "2026-03-10T00:00:00.000Z",
    },
    {
      page: 3,
      cursor: null,
      updatedAfter: "2026-03-11T00:00:00.000Z",
    },
  );

  assert.equal(resumed.page, 3);
  assert.equal(resumed.cursor, "stale-cursor");
  assert.equal(resumed.updatedAfter, "2026-03-11T00:00:00.000Z");
});

test("runNextResumableProviderPageJob advances checkpoint only after a successful durable page boundary", async () => {
  const fixture = await loadFixture();
  const { queue, calls, state } = createQueueDouble(createQueuedPageJob());
  const runner = createFixtureBackedPageRunner(fixture);

  const result = await runNextResumableProviderPageJob(
    queue,
    runner,
    {
      workerId: "worker-a",
      now: () => new Date("2026-03-11T21:05:00.000Z"),
      leaseMs: 30_000,
    },
  );

  assert.equal(result.status, "continued");
  assert.equal(result.checkpoint.page, 3);
  assert.equal(calls.requeue.length, 1);
  assert.equal(calls.complete.length, 0);
  assert.equal(calls.fail.length, 0);
  assert.equal(state.job.checkpoint?.page, 3);
  assert.equal(runner.requests[0]?.page, 2);
});

test("runNextResumableProviderPageJob resumes from durable checkpoint and avoids reprocessing earlier pages", async () => {
  const fixture = await loadFixture();
  const { queue, state } = createQueueDouble(createQueuedPageJob());
  const runner = createFixtureBackedPageRunner(fixture);

  const firstResult = await runNextResumableProviderPageJob(
    queue,
    runner,
    {
      workerId: "worker-a",
      now: () => new Date("2026-03-11T21:06:00.000Z"),
      leaseMs: 30_000,
    },
  );

  assert.equal(firstResult.status, "continued");
  assert.equal(state.job.checkpoint?.page, 3);

  const secondResult = await runNextResumableProviderPageJob(
    queue,
    runner,
    {
      workerId: "worker-b",
      now: () => new Date("2026-03-11T21:07:00.000Z"),
      leaseMs: 30_000,
    },
  );

  assert.equal(secondResult.status, "completed");
  assert.deepEqual(
    runner.requests.map((request) => request.page),
    [2, 3],
  );
});

test("runNextResumableProviderPageJob preserves the last durable checkpoint when resumed execution fails", async () => {
  const { queue, calls, state } = createQueueDouble(
    createQueuedPageJob({
      page: 3,
      cursor: null,
    }),
  );

  const result = await runNextResumableProviderPageJob(
    queue,
    {
      async runProviderPageJob() {
        throw new Error("Recovered page ingest failed.");
      },
    },
    {
      workerId: "worker-c",
      now: () => new Date("2026-03-11T21:08:00.000Z"),
      leaseMs: 30_000,
    },
  );

  assert.equal(result.status, "failed");
  assert.equal(result.lastErrorSummary, "Recovered page ingest failed.");
  assert.equal(calls.requeue.length, 0);
  assert.equal(calls.complete.length, 0);
  assert.equal(calls.fail.length, 1);
  assert.equal(state.job.checkpoint?.page, 3);
});
