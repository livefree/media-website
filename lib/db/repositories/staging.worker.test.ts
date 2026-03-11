import test from "node:test";
import assert from "node:assert/strict";

import { BackendError } from "../../server/errors";

import { createRepositoryContext } from "./types";
import { StagingPersistenceRepository } from "./staging";

type WorkerTestJobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

interface WorkerTestJobRecord {
  id: string;
  providerId: string;
  provider: {
    adapterKey: string;
  };
  mode: "INCREMENTAL";
  status: WorkerTestJobStatus;
  requestId?: string | null;
  actorId?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  attemptCount: number;
  leaseWorkerId?: string | null;
  leaseId?: string | null;
  leaseClaimedAt?: Date | null;
  leaseExpiresAt?: Date | null;
  lastErrorSummary?: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

function createQueuedJob(
  overrides: Partial<WorkerTestJobRecord> & {
    kind?: "scheduled_source_refresh" | "scheduled_source_probe" | "provider_page_ingest";
  } = {},
): WorkerTestJobRecord {
  const kind = overrides.kind ?? "scheduled_source_refresh";

  return {
    id: overrides.id ?? "job-1",
    providerId: overrides.providerId ?? "provider-1",
    provider: {
      adapterKey: overrides.provider?.adapterKey ?? "jszyapi_vod_json",
    },
    mode: "INCREMENTAL",
    status: overrides.status ?? "PENDING",
    requestId: overrides.requestId ?? "req-1",
    actorId: overrides.actorId ?? "worker-test",
    startedAt: overrides.startedAt ?? null,
    finishedAt: overrides.finishedAt ?? null,
    attemptCount: overrides.attemptCount ?? 0,
    leaseWorkerId: overrides.leaseWorkerId ?? null,
    leaseId: overrides.leaseId ?? null,
    leaseClaimedAt: overrides.leaseClaimedAt ?? null,
    leaseExpiresAt: overrides.leaseExpiresAt ?? null,
    lastErrorSummary: overrides.lastErrorSummary ?? null,
    metadata: overrides.metadata ?? {
      jobType: kind,
      maintenanceReason: "scheduled",
      probeKind: kind === "scheduled_source_probe" ? "manifest" : undefined,
      target: {
        sourceId: "source-1",
        providerItemId: "1001",
        sourceKind: "stream",
        providerLineKey: "jsm3u8",
        urls: ["https://cdn.example.com/1001/master.m3u8"],
      },
      executionTelemetry: {
        providerKey: "jszyapi_vod_json",
      },
    },
    createdAt: overrides.createdAt ?? new Date("2026-03-12T08:00:00.000Z"),
  };
}

function createRepository(seedJobs: WorkerTestJobRecord[]) {
  const jobs = [...seedJobs];

  const db = {
    ingestJob: {
      async findMany() {
        return [...jobs]
          .filter((job) => job.status === "PENDING")
          .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
      },
      async updateMany(input: {
        where: {
          id: string;
          status: WorkerTestJobStatus;
          leaseWorkerId?: string;
          leaseId?: string;
        };
        data: Record<string, unknown>;
      }) {
        const job = jobs.find((candidate) => candidate.id === input.where.id);

        if (!job || job.status !== input.where.status) {
          return { count: 0 };
        }

        if (input.where.leaseWorkerId !== undefined && job.leaseWorkerId !== input.where.leaseWorkerId) {
          return { count: 0 };
        }

        if (input.where.leaseId !== undefined && job.leaseId !== input.where.leaseId) {
          return { count: 0 };
        }

        const attemptCount = input.data.attemptCount as { increment?: number } | undefined;
        job.attemptCount += attemptCount?.increment ?? 0;
        if ("status" in input.data) {
          job.status = input.data.status as WorkerTestJobStatus;
        }
        if ("startedAt" in input.data) {
          job.startedAt = input.data.startedAt as Date | null;
        }
        if ("finishedAt" in input.data) {
          job.finishedAt = input.data.finishedAt as Date | null;
        }
        if ("leaseWorkerId" in input.data) {
          job.leaseWorkerId = input.data.leaseWorkerId as string | null;
        }
        if ("leaseId" in input.data) {
          job.leaseId = input.data.leaseId as string | null;
        }
        if ("leaseClaimedAt" in input.data) {
          job.leaseClaimedAt = input.data.leaseClaimedAt as Date | null;
        }
        if ("leaseExpiresAt" in input.data) {
          job.leaseExpiresAt = input.data.leaseExpiresAt as Date | null;
        }
        if ("lastErrorSummary" in input.data) {
          job.lastErrorSummary = input.data.lastErrorSummary as string | null;
        }
        if ("metadata" in input.data) {
          job.metadata = input.data.metadata as Record<string, unknown> | null;
        }

        return { count: 1 };
      },
    },
  };

  return {
    jobs,
    repository: new StagingPersistenceRepository(
      createRepositoryContext(db as never),
    ),
  };
}

test("claimNextQueuedProviderJob claims the next durable queued job and persists a lease", async () => {
  const { jobs, repository } = createRepository([
    createQueuedJob({
      id: "job-page",
      kind: "provider_page_ingest",
      createdAt: new Date("2026-03-12T08:00:00.000Z"),
    }),
    createQueuedJob({
      id: "job-refresh",
      kind: "scheduled_source_refresh",
      createdAt: new Date("2026-03-12T08:01:00.000Z"),
    }),
  ]);

  const claimed = await repository.claimNextQueuedProviderJob({
    workerId: "worker-a",
    claimedAt: "2026-03-12T08:05:00.000Z",
    leaseMs: 60_000,
  });

  assert.ok(claimed);
  assert.equal(claimed.queueJobId, "job-refresh");
  assert.equal(claimed.kind, "source_refresh");
  assert.equal(claimed.lease.workerId, "worker-a");
  assert.equal(claimed.attemptCount, 1);

  const persisted = jobs.find((job) => job.id === "job-refresh");
  assert.equal(persisted?.status, "RUNNING");
  assert.equal(persisted?.leaseWorkerId, "worker-a");
  assert.ok(persisted?.leaseId);
  assert.equal(persisted?.attemptCount, 1);
});

test("claimNextQueuedProviderJob does not duplicate-pick a leased job", async () => {
  const { repository } = createRepository([createQueuedJob({ id: "job-probe", kind: "scheduled_source_probe" })]);

  const first = await repository.claimNextQueuedProviderJob({
    workerId: "worker-a",
    claimedAt: "2026-03-12T08:10:00.000Z",
    leaseMs: 60_000,
  });
  const second = await repository.claimNextQueuedProviderJob({
    workerId: "worker-b",
    claimedAt: "2026-03-12T08:10:05.000Z",
    leaseMs: 60_000,
  });

  assert.ok(first);
  assert.equal(first.queueJobId, "job-probe");
  assert.equal(second, null);
});

test("completeQueuedProviderJob enforces lease validation before terminal success", async () => {
  const { jobs, repository } = createRepository([createQueuedJob({ id: "job-complete", kind: "scheduled_source_refresh" })]);
  const claimed = await repository.claimNextQueuedProviderJob({
    workerId: "worker-a",
    claimedAt: "2026-03-12T08:15:00.000Z",
    leaseMs: 60_000,
  });

  assert.ok(claimed);

  await assert.rejects(
    () =>
      repository.completeQueuedProviderJob({
        queueJobId: claimed.queueJobId,
        workerId: "worker-b",
        leaseId: claimed.lease.leaseId,
        finishedAt: "2026-03-12T08:15:20.000Z",
        metadata: {
          workerExecution: {
            queueJobId: claimed.queueJobId,
          },
        },
      }),
    (error: unknown) => {
      assert.ok(error instanceof BackendError);
      assert.equal(error.code, "ingest_job_lease_conflict");
      return true;
    },
  );

  await repository.completeQueuedProviderJob({
    queueJobId: claimed.queueJobId,
    workerId: claimed.lease.workerId,
    leaseId: claimed.lease.leaseId,
    finishedAt: "2026-03-12T08:15:20.000Z",
    metadata: {
      workerExecution: {
        queueJobId: claimed.queueJobId,
        outcome: "succeeded",
      },
    },
  });

  const persisted = jobs.find((job) => job.id === claimed.queueJobId);
  assert.equal(persisted?.status, "SUCCEEDED");
  assert.equal(persisted?.leaseId, null);
  assert.equal((persisted?.metadata as { workerExecution?: { outcome?: string } } | null)?.workerExecution?.outcome, "succeeded");
});

test("failQueuedProviderJob enforces lease validation before terminal failure", async () => {
  const { jobs, repository } = createRepository([createQueuedJob({ id: "job-fail", kind: "scheduled_source_probe" })]);
  const claimed = await repository.claimNextQueuedProviderJob({
    workerId: "worker-c",
    claimedAt: "2026-03-12T08:20:00.000Z",
    leaseMs: 60_000,
  });

  assert.ok(claimed);

  await repository.failQueuedProviderJob({
    queueJobId: claimed.queueJobId,
    workerId: claimed.lease.workerId,
    leaseId: claimed.lease.leaseId,
    finishedAt: "2026-03-12T08:20:10.000Z",
    lastErrorSummary: "Probe execution failed.",
    metadata: {
      workerExecution: {
        queueJobId: claimed.queueJobId,
        outcome: "failed",
      },
    },
  });

  const persisted = jobs.find((job) => job.id === claimed.queueJobId);
  assert.equal(persisted?.status, "FAILED");
  assert.equal(persisted?.lastErrorSummary, "Probe execution failed.");
  assert.equal(persisted?.leaseWorkerId, null);
});
