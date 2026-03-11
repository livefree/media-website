import test from "node:test";
import assert from "node:assert/strict";

import { runDurableProviderJobsUntilIdle, runNextDurableProviderJob } from "./worker";

import type {
  ClaimedQueuedProviderJob,
  ClaimQueuedProviderJobInput,
  CompleteQueuedProviderJobInput,
  DurableProviderJobQueueGateway,
  FailQueuedProviderJobInput,
  QueuedProviderJob,
} from "./worker";
import type { IngestSourceProbeRunResult, IngestSourceRefreshRunResult } from "./types";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function createQueuedRefreshJob(queueJobId: string): QueuedProviderJob {
  return {
    queueJobId,
    kind: "source_refresh",
    providerKey: "jszyapi_vod_json",
    requestId: `req-${queueJobId}`,
    actorId: "worker-test",
    attemptCount: 1,
    enqueuedAt: "2026-03-11T20:00:00.000Z",
    request: {
      providerKey: "jszyapi_vod_json",
      reason: "scheduled",
      target: {
        sourceId: "source-1",
        providerItemId: "1001",
        sourceKind: "stream",
        providerLineKey: "jsm3u8",
        urls: ["https://cdn.example.com/1001/master.m3u8"],
      },
      requestId: `req-${queueJobId}`,
      actorId: "worker-test",
    },
  };
}

function createQueuedProbeJob(queueJobId: string): QueuedProviderJob {
  return {
    queueJobId,
    kind: "source_probe",
    providerKey: "jszyapi_vod_json",
    requestId: `req-${queueJobId}`,
    actorId: "worker-test",
    attemptCount: 2,
    enqueuedAt: "2026-03-11T20:00:00.000Z",
    request: {
      providerKey: "jszyapi_vod_json",
      probeKind: "manifest",
      reason: "scheduled",
      target: {
        sourceId: "source-2",
        providerItemId: "1002",
        sourceKind: "stream",
        providerLineKey: "jsm3u8",
        urls: ["https://cdn.example.com/1002/master.m3u8"],
      },
      requestId: `req-${queueJobId}`,
      actorId: "worker-test",
    },
  };
}

function createQueueDouble(seedJobs: QueuedProviderJob[]): {
  calls: {
    claim: ClaimQueuedProviderJobInput[];
    complete: CompleteQueuedProviderJobInput[];
    fail: FailQueuedProviderJobInput[];
  };
  queue: DurableProviderJobQueueGateway;
  state: {
    claimed: Map<string, ClaimedQueuedProviderJob>;
    completed: string[];
    failed: string[];
  };
} {
  const jobs = [...seedJobs];
  const claimed = new Map<string, ClaimedQueuedProviderJob>();
  const completed: string[] = [];
  const failed: string[] = [];
  const calls = {
    claim: [] as ClaimQueuedProviderJobInput[],
    complete: [] as CompleteQueuedProviderJobInput[],
    fail: [] as FailQueuedProviderJobInput[],
  };

  const queue: DurableProviderJobQueueGateway = {
    async claimNextQueuedProviderJob(input) {
      calls.claim.push(input);

      const nextJob = jobs.find((job) => !claimed.has(job.queueJobId) && !completed.includes(job.queueJobId) && !failed.includes(job.queueJobId));

      if (!nextJob) {
        return null;
      }

      const claimedJob: ClaimedQueuedProviderJob = {
        ...nextJob,
        lease: {
          workerId: input.workerId,
          leaseId: `lease-${nextJob.queueJobId}-${input.workerId}`,
          claimedAt: input.claimedAt,
          leaseExpiresAt: new Date(Date.parse(input.claimedAt) + input.leaseMs).toISOString(),
        },
      };

      claimed.set(nextJob.queueJobId, claimedJob);
      return claimedJob;
    },
    async completeQueuedProviderJob(input) {
      calls.complete.push(input);
      const activeLease = claimed.get(input.queueJobId);

      assert.ok(activeLease, `expected an active lease for ${input.queueJobId}`);
      assert.equal(activeLease.lease.leaseId, input.leaseId);
      assert.equal(activeLease.lease.workerId, input.workerId);

      claimed.delete(input.queueJobId);
      completed.push(input.queueJobId);
    },
    async failQueuedProviderJob(input) {
      calls.fail.push(input);
      const activeLease = claimed.get(input.queueJobId);

      assert.ok(activeLease, `expected an active lease for ${input.queueJobId}`);
      assert.equal(activeLease.lease.leaseId, input.leaseId);
      assert.equal(activeLease.lease.workerId, input.workerId);

      claimed.delete(input.queueJobId);
      failed.push(input.queueJobId);
    },
  };

  return {
    calls,
    queue,
    state: {
      claimed,
      completed,
      failed,
    },
  };
}

function createRefreshResult(): IngestSourceRefreshRunResult {
  return {
    providerKey: "jszyapi_vod_json",
    reason: "scheduled",
    rawPayloadCount: 1,
    findingCount: 0,
    repairSignalCount: 0,
    persistence: {
      providerKey: "jszyapi_vod_json",
      reason: "scheduled",
      fetchedAt: "2026-03-11T20:00:05.000Z",
      request: {
        url: "https://provider.example/refresh",
        method: "GET",
      },
      target: {
        sourceId: "source-1",
        providerItemId: "1001",
        sourceKind: "stream",
        providerLineKey: "jsm3u8",
        urls: ["https://cdn.example.com/1001/master.m3u8"],
      },
      payloads: [],
      findings: [],
      repair: {
        providerKey: "jszyapi_vod_json",
        capturedAt: "2026-03-11T20:00:05.000Z",
        target: {
          sourceId: "source-1",
          providerItemId: "1001",
          sourceKind: "stream",
          providerLineKey: "jsm3u8",
          urls: ["https://cdn.example.com/1001/master.m3u8"],
        },
        findings: [],
        signals: [],
      },
    },
  };
}

function createProbeResult(): IngestSourceProbeRunResult {
  return {
    providerKey: "jszyapi_vod_json",
    reason: "scheduled",
    probeKind: "manifest",
    rawPayloadCount: 1,
    findingCount: 1,
    repairSignalCount: 1,
    persistence: {
      providerKey: "jszyapi_vod_json",
      reason: "scheduled",
      probeKind: "manifest",
      probedAt: "2026-03-11T20:00:05.000Z",
      request: {
        url: "https://provider.example/probe",
        method: "GET",
      },
      target: {
        sourceId: "source-2",
        providerItemId: "1002",
        sourceKind: "stream",
        providerLineKey: "jsm3u8",
        urls: ["https://cdn.example.com/1002/master.m3u8"],
      },
      payloads: [],
      findings: [],
      repair: {
        providerKey: "jszyapi_vod_json",
        capturedAt: "2026-03-11T20:00:05.000Z",
        target: {
          sourceId: "source-2",
          providerItemId: "1002",
          sourceKind: "stream",
          providerLineKey: "jsm3u8",
          urls: ["https://cdn.example.com/1002/master.m3u8"],
        },
        findings: [],
        signals: [],
      },
    },
  };
}

test("runNextDurableProviderJob claims and completes a queued provider job", async () => {
  const { calls, queue, state } = createQueueDouble([createQueuedRefreshJob("queue-1")]);
  const result = await runNextDurableProviderJob(
    queue,
    {
      async runSourceRefreshJob() {
        return createRefreshResult();
      },
      async runSourceProbeJob() {
        throw new Error("probe execution should not run in refresh test");
      },
    },
    {
      workerId: "worker-a",
      now: () => new Date("2026-03-11T20:00:10.000Z"),
      leaseMs: 60_000,
    },
  );

  assert.equal(result.status, "succeeded");
  assert.equal(calls.claim.length, 1);
  assert.equal(calls.complete.length, 1);
  assert.equal(calls.fail.length, 0);
  assert.deepEqual(state.completed, ["queue-1"]);
  assert.equal(state.claimed.size, 0);
  assert.equal(calls.complete[0]?.metadata?.workerExecution?.providerKey, "jszyapi_vod_json");
});

test("runNextDurableProviderJob records deterministic failure state for unattended execution", async () => {
  const { calls, queue, state } = createQueueDouble([createQueuedProbeJob("queue-2")]);
  const result = await runNextDurableProviderJob(
    queue,
    {
      async runSourceRefreshJob() {
        throw new Error("refresh execution should not run in probe test");
      },
      async runSourceProbeJob() {
        throw new Error("Probe execution failed.");
      },
    },
    {
      workerId: "worker-b",
      now: () => new Date("2026-03-11T20:01:00.000Z"),
      leaseMs: 60_000,
    },
  );

  assert.equal(result.status, "failed");
  assert.equal(result.lastErrorSummary, "Probe execution failed.");
  assert.equal(calls.claim.length, 1);
  assert.equal(calls.complete.length, 0);
  assert.equal(calls.fail.length, 1);
  assert.deepEqual(state.failed, ["queue-2"]);
  assert.equal(calls.fail[0]?.metadata?.workerExecution?.kind, "source_probe");
});

test("runNextDurableProviderJob prevents duplicate pickup while another worker holds the lease", async () => {
  const { queue, state } = createQueueDouble([createQueuedProbeJob("queue-3")]);
  const deferred = createDeferred<IngestSourceProbeRunResult>();

  const firstWorker = runNextDurableProviderJob(
    queue,
    {
      async runSourceRefreshJob() {
        throw new Error("refresh execution should not run in duplicate pickup test");
      },
      async runSourceProbeJob() {
        return deferred.promise;
      },
    },
    {
      workerId: "worker-c",
      now: () => new Date("2026-03-11T20:02:00.000Z"),
      leaseMs: 60_000,
    },
  );

  await Promise.resolve();
  assert.equal(state.claimed.size, 1);

  const secondWorker = await runNextDurableProviderJob(
    queue,
    {
      async runSourceRefreshJob() {
        throw new Error("refresh execution should not run in duplicate pickup test");
      },
      async runSourceProbeJob() {
        throw new Error("second worker should not execute a leased probe job");
      },
    },
    {
      workerId: "worker-d",
      now: () => new Date("2026-03-11T20:02:05.000Z"),
      leaseMs: 60_000,
    },
  );

  assert.equal(secondWorker.status, "idle");

  deferred.resolve(createProbeResult());
  const firstResult = await firstWorker;
  assert.equal(firstResult.status, "succeeded");
});

test("runDurableProviderJobsUntilIdle drains queued jobs through the unattended worker path", async () => {
  const { queue, state } = createQueueDouble([createQueuedRefreshJob("queue-4"), createQueuedProbeJob("queue-5")]);
  const result = await runDurableProviderJobsUntilIdle(
    queue,
    {
      async runSourceRefreshJob() {
        return createRefreshResult();
      },
      async runSourceProbeJob() {
        return createProbeResult();
      },
    },
    {
      workerId: "worker-e",
      now: () => new Date("2026-03-11T20:03:00.000Z"),
      leaseMs: 60_000,
    },
  );

  assert.equal(result.processedCount, 2);
  assert.equal(result.successCount, 2);
  assert.equal(result.failureCount, 0);
  assert.deepEqual(state.completed, ["queue-4", "queue-5"]);
});
