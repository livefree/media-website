import "server-only";

import type {
  IngestSourceProbeRequest,
  IngestSourceProbeRunResult,
  IngestSourceRefreshRequest,
  IngestSourceRefreshRunResult,
} from "./types";

export type DurableProviderJobKind = "source_refresh" | "source_probe";

interface BaseQueuedProviderJob {
  queueJobId: string;
  kind: DurableProviderJobKind;
  providerKey: string;
  requestId?: string;
  actorId?: string;
  attemptCount: number;
  enqueuedAt: string;
}

export interface QueuedSourceRefreshJob extends BaseQueuedProviderJob {
  kind: "source_refresh";
  request: IngestSourceRefreshRequest;
}

export interface QueuedSourceProbeJob extends BaseQueuedProviderJob {
  kind: "source_probe";
  request: IngestSourceProbeRequest;
}

export type QueuedProviderJob = QueuedSourceRefreshJob | QueuedSourceProbeJob;

export interface ClaimedProviderJobLease {
  workerId: string;
  leaseId: string;
  claimedAt: string;
  leaseExpiresAt: string;
}

export type ClaimedQueuedProviderJob = QueuedProviderJob & {
  lease: ClaimedProviderJobLease;
};

export interface ClaimQueuedProviderJobInput {
  workerId: string;
  claimedAt: string;
  leaseMs: number;
}

export interface CompleteQueuedProviderJobInput {
  queueJobId: string;
  workerId: string;
  leaseId: string;
  finishedAt: string;
  metadata?: Record<string, unknown>;
}

export interface FailQueuedProviderJobInput extends CompleteQueuedProviderJobInput {
  lastErrorSummary: string;
}

export interface DurableProviderJobQueueGateway {
  claimNextQueuedProviderJob(input: ClaimQueuedProviderJobInput): Promise<ClaimedQueuedProviderJob | null>;
  completeQueuedProviderJob(input: CompleteQueuedProviderJobInput): Promise<void>;
  failQueuedProviderJob(input: FailQueuedProviderJobInput): Promise<void>;
}

export interface DurableProviderJobHandlers {
  runSourceRefreshJob(request: IngestSourceRefreshRequest): Promise<IngestSourceRefreshRunResult>;
  runSourceProbeJob(request: IngestSourceProbeRequest): Promise<IngestSourceProbeRunResult>;
}

export interface RunNextDurableProviderJobOptions {
  workerId: string;
  leaseMs?: number;
  now?: () => Date;
}

export type DurableProviderJobRunResult =
  | {
      status: "idle";
      workerId: string;
    }
  | {
      status: "succeeded";
      workerId: string;
      job: ClaimedQueuedProviderJob;
      finishedAt: string;
      metadata: Record<string, unknown>;
    }
  | {
      status: "failed";
      workerId: string;
      job: ClaimedQueuedProviderJob;
      finishedAt: string;
      lastErrorSummary: string;
      metadata: Record<string, unknown>;
    };

export interface DrainDurableProviderJobsResult {
  workerId: string;
  processedCount: number;
  successCount: number;
  failureCount: number;
  terminalResults: DurableProviderJobRunResult[];
}

function summarizeError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unexpected durable worker execution failure.";
}

function computeDurationMs(startedAt: string, finishedAt: string): number | null {
  const start = Date.parse(startedAt);
  const finish = Date.parse(finishedAt);

  if (Number.isNaN(start) || Number.isNaN(finish)) {
    return null;
  }

  return Math.max(0, finish - start);
}

function buildSuccessMetadata(
  job: ClaimedQueuedProviderJob,
  finishedAt: string,
  result: IngestSourceRefreshRunResult | IngestSourceProbeRunResult,
): Record<string, unknown> {
  return {
    workerExecution: {
      queueJobId: job.queueJobId,
      kind: job.kind,
      providerKey: job.providerKey,
      attemptCount: job.attemptCount,
      startedAt: job.lease.claimedAt,
      finishedAt,
      durationMs: computeDurationMs(job.lease.claimedAt, finishedAt),
      rawPayloadCount: result.rawPayloadCount,
      findingCount: result.findingCount,
      repairSignalCount: result.repairSignalCount,
    },
  };
}

function buildFailureMetadata(job: ClaimedQueuedProviderJob, finishedAt: string, lastErrorSummary: string): Record<string, unknown> {
  return {
    workerExecution: {
      queueJobId: job.queueJobId,
      kind: job.kind,
      providerKey: job.providerKey,
      attemptCount: job.attemptCount,
      startedAt: job.lease.claimedAt,
      finishedAt,
      durationMs: computeDurationMs(job.lease.claimedAt, finishedAt),
      lastErrorSummary,
    },
  };
}

async function executeClaimedProviderJob(
  handlers: DurableProviderJobHandlers,
  job: ClaimedQueuedProviderJob,
): Promise<IngestSourceRefreshRunResult | IngestSourceProbeRunResult> {
  if (job.kind === "source_refresh") {
    return handlers.runSourceRefreshJob(job.request);
  }

  return handlers.runSourceProbeJob(job.request);
}

export async function runNextDurableProviderJob(
  queue: DurableProviderJobQueueGateway,
  handlers: DurableProviderJobHandlers,
  options: RunNextDurableProviderJobOptions,
): Promise<DurableProviderJobRunResult> {
  const now = options.now ?? (() => new Date());
  const claimedAt = now().toISOString();
  const job = await queue.claimNextQueuedProviderJob({
    workerId: options.workerId,
    claimedAt,
    leaseMs: options.leaseMs ?? 30_000,
  });

  if (!job) {
    return {
      status: "idle",
      workerId: options.workerId,
    };
  }

  try {
    const result = await executeClaimedProviderJob(handlers, job);
    const finishedAt = now().toISOString();
    const metadata = buildSuccessMetadata(job, finishedAt, result);

    await queue.completeQueuedProviderJob({
      queueJobId: job.queueJobId,
      workerId: options.workerId,
      leaseId: job.lease.leaseId,
      finishedAt,
      metadata,
    });

    return {
      status: "succeeded",
      workerId: options.workerId,
      job,
      finishedAt,
      metadata,
    };
  } catch (error) {
    const finishedAt = now().toISOString();
    const lastErrorSummary = summarizeError(error);
    const metadata = buildFailureMetadata(job, finishedAt, lastErrorSummary);

    await queue.failQueuedProviderJob({
      queueJobId: job.queueJobId,
      workerId: options.workerId,
      leaseId: job.lease.leaseId,
      finishedAt,
      lastErrorSummary,
      metadata,
    });

    return {
      status: "failed",
      workerId: options.workerId,
      job,
      finishedAt,
      lastErrorSummary,
      metadata,
    };
  }
}

export async function runDurableProviderJobsUntilIdle(
  queue: DurableProviderJobQueueGateway,
  handlers: DurableProviderJobHandlers,
  options: RunNextDurableProviderJobOptions,
): Promise<DrainDurableProviderJobsResult> {
  const terminalResults: DurableProviderJobRunResult[] = [];

  while (true) {
    const result = await runNextDurableProviderJob(queue, handlers, options);

    if (result.status === "idle") {
      return {
        workerId: options.workerId,
        processedCount: terminalResults.length,
        successCount: terminalResults.filter((entry) => entry.status === "succeeded").length,
        failureCount: terminalResults.filter((entry) => entry.status === "failed").length,
        terminalResults,
      };
    }

    terminalResults.push(result);
  }
}
