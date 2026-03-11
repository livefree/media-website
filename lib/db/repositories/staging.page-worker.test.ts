import test from "node:test";
import assert from "node:assert/strict";

import { BackendError } from "../../server/errors";

import { createRepositoryContext } from "./types";
import { StagingPersistenceRepository } from "./staging";

type PageWorkerTestJobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

interface PageWorkerTestJobRecord {
  id: string;
  providerId: string;
  provider: {
    adapterKey: string;
  };
  mode: "BACKFILL" | "INCREMENTAL" | "MANUAL";
  status: PageWorkerTestJobStatus;
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
}

function createQueuedPageJob(overrides: Partial<PageWorkerTestJobRecord> = {}): PageWorkerTestJobRecord {
  return {
    id: overrides.id ?? "page-job-1",
    providerId: overrides.providerId ?? "provider-1",
    provider: {
      adapterKey: overrides.provider?.adapterKey ?? "jszyapi_vod_json",
    },
    mode: overrides.mode ?? "BACKFILL",
    status: overrides.status ?? "PENDING",
    requestId: overrides.requestId ?? "req-page-1",
    actorId: overrides.actorId ?? "worker-test",
    startedAt: overrides.startedAt ?? null,
    finishedAt: overrides.finishedAt ?? null,
    attemptCount: overrides.attemptCount ?? 0,
    retryCount: overrides.retryCount ?? 0,
    lastAttemptedAt: overrides.lastAttemptedAt ?? null,
    nextAttemptAt: overrides.nextAttemptAt ?? null,
    leaseWorkerId: overrides.leaseWorkerId ?? null,
    leaseId: overrides.leaseId ?? null,
    leaseClaimedAt: overrides.leaseClaimedAt ?? null,
    leaseExpiresAt: overrides.leaseExpiresAt ?? null,
    lastErrorSummary: overrides.lastErrorSummary ?? null,
    metadata: overrides.metadata ?? {
      jobType: "provider_page_ingest",
      executionTelemetry: {
        providerKey: "jszyapi_vod_json",
        request: {
          page: 2,
          pageSize: 24,
          cursor: null,
          updatedAfter: "2026-03-10T00:00:00.000Z",
          updatedBefore: null,
        },
      },
      resumeCheckpoint: {
        page: 3,
        cursor: "cursor-3",
        updatedAfter: "2026-03-10T00:00:00.000Z",
        updatedBefore: null,
        providerUpdatedAt: "2026-03-11T00:00:00.000Z",
      },
    },
    createdAt: overrides.createdAt ?? new Date("2026-03-13T08:00:00.000Z"),
  };
}

function createRepository(seedJobs: PageWorkerTestJobRecord[]) {
  const jobs = [...seedJobs];

  const db = {
    ingestJob: {
      async findMany() {
        return [...jobs]
          .filter((job) => job.status === "PENDING")
          .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
      },
      async findFirst(input: { where: { id: string; status: PageWorkerTestJobStatus; leaseWorkerId: string; leaseId: string } }) {
        return (
          jobs.find(
            (job) =>
              job.id === input.where.id &&
              job.status === input.where.status &&
              job.leaseWorkerId === input.where.leaseWorkerId &&
              job.leaseId === input.where.leaseId,
          ) ?? null
        );
      },
      async updateMany(input: {
        where: {
          id: string;
          status: PageWorkerTestJobStatus;
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
          job.status = input.data.status as PageWorkerTestJobStatus;
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
        if ("retryCount" in input.data) {
          job.retryCount = input.data.retryCount as number;
        }
        if ("lastAttemptedAt" in input.data) {
          job.lastAttemptedAt = input.data.lastAttemptedAt as Date | null;
        }
        if ("nextAttemptAt" in input.data) {
          job.nextAttemptAt = input.data.nextAttemptAt as Date | null;
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
    repository: new StagingPersistenceRepository(createRepositoryContext(db as never)),
  };
}

test("claimNextQueuedProviderPageJob reconstructs the queued request and durable checkpoint", async () => {
  const { jobs, repository } = createRepository([createQueuedPageJob()]);

  const claimed = await repository.claimNextQueuedProviderPageJob({
    workerId: "worker-page-a",
    claimedAt: "2026-03-13T08:05:00.000Z",
    leaseMs: 60_000,
  });

  assert.ok(claimed);
  assert.equal(claimed.queueJobId, "page-job-1");
  assert.equal(claimed.request.providerKey, "jszyapi_vod_json");
  assert.equal(claimed.request.page, 2);
  assert.equal(claimed.checkpoint?.page, 3);
  assert.equal(claimed.checkpoint?.cursor, "cursor-3");
  assert.equal(claimed.attemptCount, 1);
  assert.equal(claimed.retryCount, 0);
  assert.equal(claimed.lastAttemptedAt, null);
  assert.equal(claimed.nextAttemptAt, null);

  const persisted = jobs[0];
  assert.equal(persisted?.status, "RUNNING");
  assert.equal(persisted?.leaseWorkerId, "worker-page-a");
  assert.ok(persisted?.leaseId);
});

test("claimNextQueuedProviderPageJob skips throttled jobs until nextAttemptAt is due", async () => {
  const { repository } = createRepository([
    createQueuedPageJob({
      id: "page-job-throttled",
      nextAttemptAt: new Date("2026-03-13T08:06:00.000Z"),
      retryCount: 1,
      lastAttemptedAt: new Date("2026-03-13T08:04:00.000Z"),
      createdAt: new Date("2026-03-13T08:00:00.000Z"),
    }),
    createQueuedPageJob({
      id: "page-job-due",
      nextAttemptAt: new Date("2026-03-13T08:05:00.000Z"),
      retryCount: 2,
      lastAttemptedAt: new Date("2026-03-13T08:03:00.000Z"),
      createdAt: new Date("2026-03-13T08:01:00.000Z"),
    }),
  ]);

  const claimed = await repository.claimNextQueuedProviderPageJob({
    workerId: "worker-page-throttle",
    claimedAt: "2026-03-13T08:05:30.000Z",
    leaseMs: 60_000,
  });

  assert.ok(claimed);
  assert.equal(claimed.queueJobId, "page-job-due");
  assert.equal(claimed.retryCount, 2);
  assert.equal(claimed.lastAttemptedAt, "2026-03-13T08:03:00.000Z");
  assert.equal(claimed.nextAttemptAt, "2026-03-13T08:05:00.000Z");
});

test("requeueQueuedProviderPageJob serializes checkpoint state and clears the active lease", async () => {
  const { jobs, repository } = createRepository([createQueuedPageJob()]);
  const claimed = await repository.claimNextQueuedProviderPageJob({
    workerId: "worker-page-b",
    claimedAt: "2026-03-13T08:10:00.000Z",
    leaseMs: 60_000,
  });

  assert.ok(claimed);

  await repository.requeueQueuedProviderPageJob({
    queueJobId: claimed.queueJobId,
    workerId: claimed.lease.workerId,
    leaseId: claimed.lease.leaseId,
    requeuedAt: "2026-03-13T08:10:15.000Z",
    checkpoint: {
      page: 4,
      cursor: "cursor-4",
      updatedAfter: "2026-03-11T00:00:00.000Z",
      updatedBefore: null,
      providerUpdatedAt: "2026-03-12T00:00:00.000Z",
    },
    retryCount: 1,
    lastAttemptedAt: "2026-03-13T08:10:15.000Z",
    nextAttemptAt: "2026-03-13T08:10:45.000Z",
    metadata: {
      workerExecution: {
        outcome: "requeued",
      },
    },
  });

  const persisted = jobs[0];
  assert.equal(persisted?.status, "PENDING");
  assert.equal(persisted?.leaseWorkerId, null);
  assert.equal(persisted?.leaseId, null);
  assert.equal(persisted?.retryCount, 1);
  assert.equal(persisted?.lastAttemptedAt?.toISOString(), "2026-03-13T08:10:15.000Z");
  assert.equal(persisted?.nextAttemptAt?.toISOString(), "2026-03-13T08:10:45.000Z");
  assert.equal((persisted?.metadata as { resumeCheckpoint?: { page?: number }; workerExecution?: { outcome?: string } })?.resumeCheckpoint?.page, 4);
  assert.equal((persisted?.metadata as { workerExecution?: { outcome?: string } })?.workerExecution?.outcome, "requeued");
});

test("completeQueuedProviderPageJob enforces lease validation before terminal success", async () => {
  const { jobs, repository } = createRepository([createQueuedPageJob()]);
  const claimed = await repository.claimNextQueuedProviderPageJob({
    workerId: "worker-page-c",
    claimedAt: "2026-03-13T08:15:00.000Z",
    leaseMs: 60_000,
  });

  assert.ok(claimed);

  await assert.rejects(
    () =>
      repository.completeQueuedProviderPageJob({
        queueJobId: claimed.queueJobId,
        workerId: "other-worker",
        leaseId: claimed.lease.leaseId,
        finishedAt: "2026-03-13T08:15:20.000Z",
      }),
    (error: unknown) => {
      assert.ok(error instanceof BackendError);
      assert.equal(error.code, "ingest_job_lease_conflict");
      return true;
    },
  );

  await repository.completeQueuedProviderPageJob({
    queueJobId: claimed.queueJobId,
    workerId: claimed.lease.workerId,
    leaseId: claimed.lease.leaseId,
    finishedAt: "2026-03-13T08:15:20.000Z",
    metadata: {
      workerExecution: {
        outcome: "completed",
      },
    },
  });

  const persisted = jobs[0];
  assert.equal(persisted?.status, "SUCCEEDED");
  assert.equal(persisted?.leaseWorkerId, null);
  assert.equal((persisted?.metadata as { workerExecution?: { outcome?: string } })?.workerExecution?.outcome, "completed");
});

test("failQueuedProviderPageJob enforces lease validation before terminal failure", async () => {
  const { jobs, repository } = createRepository([createQueuedPageJob()]);
  const claimed = await repository.claimNextQueuedProviderPageJob({
    workerId: "worker-page-d",
    claimedAt: "2026-03-13T08:20:00.000Z",
    leaseMs: 60_000,
  });

  assert.ok(claimed);

  await repository.failQueuedProviderPageJob({
    queueJobId: claimed.queueJobId,
    workerId: claimed.lease.workerId,
    leaseId: claimed.lease.leaseId,
    finishedAt: "2026-03-13T08:20:10.000Z",
    lastErrorSummary: "Page ingest failed after resume.",
    metadata: {
      workerExecution: {
        outcome: "failed",
      },
    },
  });

  const persisted = jobs[0];
  assert.equal(persisted?.status, "FAILED");
  assert.equal(persisted?.lastErrorSummary, "Page ingest failed after resume.");
  assert.equal(persisted?.leaseWorkerId, null);
});
