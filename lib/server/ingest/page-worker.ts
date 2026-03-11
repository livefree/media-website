import "server-only";

import type { ExecuteProviderPageIngestRunResult } from "./execution";
import type { IngestPageRequest } from "./types";

export interface ProviderPageWorkerCheckpoint {
  cursor?: string | null;
  page?: number | null;
  updatedAfter?: string | null;
  updatedBefore?: string | null;
  providerUpdatedAt?: string | null;
}

export interface QueuedProviderPageJob {
  queueJobId: string;
  providerKey: string;
  mode: IngestPageRequest["mode"];
  request: IngestPageRequest;
  checkpoint?: ProviderPageWorkerCheckpoint | null;
  requestId?: string;
  actorId?: string;
  attemptCount: number;
  enqueuedAt: string;
}

export interface ClaimedProviderPageJobLease {
  workerId: string;
  leaseId: string;
  claimedAt: string;
  leaseExpiresAt: string;
}

export type ClaimedQueuedProviderPageJob = QueuedProviderPageJob & {
  lease: ClaimedProviderPageJobLease;
};

export interface ClaimQueuedProviderPageJobInput {
  workerId: string;
  claimedAt: string;
  leaseMs: number;
}

export interface RequeueQueuedProviderPageJobInput {
  queueJobId: string;
  workerId: string;
  leaseId: string;
  requeuedAt: string;
  checkpoint: ProviderPageWorkerCheckpoint;
  metadata?: Record<string, unknown>;
}

export interface CompleteQueuedProviderPageJobInput {
  queueJobId: string;
  workerId: string;
  leaseId: string;
  finishedAt: string;
  metadata?: Record<string, unknown>;
}

export interface FailQueuedProviderPageJobInput extends CompleteQueuedProviderPageJobInput {
  lastErrorSummary: string;
}

export interface DurableProviderPageJobQueueGateway {
  claimNextQueuedProviderPageJob(input: ClaimQueuedProviderPageJobInput): Promise<ClaimedQueuedProviderPageJob | null>;
  requeueQueuedProviderPageJob(input: RequeueQueuedProviderPageJobInput): Promise<void>;
  completeQueuedProviderPageJob(input: CompleteQueuedProviderPageJobInput): Promise<void>;
  failQueuedProviderPageJob(input: FailQueuedProviderPageJobInput): Promise<void>;
}

export interface ResumableProviderPageJobHandlers {
  runProviderPageJob(request: IngestPageRequest): Promise<ExecuteProviderPageIngestRunResult>;
}

export interface RunNextResumableProviderPageJobOptions {
  workerId: string;
  leaseMs?: number;
  now?: () => Date;
}

export type ResumableProviderPageJobRunResult =
  | {
      status: "idle";
      workerId: string;
    }
  | {
      status: "continued";
      workerId: string;
      job: ClaimedQueuedProviderPageJob;
      resumedRequest: IngestPageRequest;
      checkpoint: ProviderPageWorkerCheckpoint;
      requeuedAt: string;
      metadata: Record<string, unknown>;
    }
  | {
      status: "completed";
      workerId: string;
      job: ClaimedQueuedProviderPageJob;
      resumedRequest: IngestPageRequest;
      finishedAt: string;
      metadata: Record<string, unknown>;
    }
  | {
      status: "failed";
      workerId: string;
      job: ClaimedQueuedProviderPageJob;
      resumedRequest: IngestPageRequest;
      finishedAt: string;
      lastErrorSummary: string;
      metadata: Record<string, unknown>;
    };

function summarizeError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unexpected resumable page worker failure.";
}

function toIsoString(value?: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function snapshotCheckpoint(result: ExecuteProviderPageIngestRunResult): ProviderPageWorkerCheckpoint | null {
  const checkpoint = result.persisted.checkpoint;

  if (!checkpoint) {
    return null;
  }

  if (
    checkpoint.cursor == null &&
    checkpoint.page == null &&
    checkpoint.updatedAfter == null &&
    checkpoint.updatedBefore == null &&
    checkpoint.providerUpdatedAt == null
  ) {
    return null;
  }

  return {
    cursor: checkpoint.cursor ?? null,
    page: checkpoint.page ?? null,
    updatedAfter: toIsoString(checkpoint.updatedAfter),
    updatedBefore: toIsoString(checkpoint.updatedBefore),
    providerUpdatedAt: toIsoString(checkpoint.providerUpdatedAt),
  };
}

function hasCheckpointValue(checkpoint?: ProviderPageWorkerCheckpoint | null): checkpoint is ProviderPageWorkerCheckpoint {
  return Boolean(
    checkpoint &&
      (checkpoint.cursor != null ||
        checkpoint.page != null ||
        checkpoint.updatedAfter != null ||
        checkpoint.updatedBefore != null ||
        checkpoint.providerUpdatedAt != null),
  );
}

function computeDurationMs(startedAt: string, finishedAt: string): number | null {
  const start = Date.parse(startedAt);
  const finish = Date.parse(finishedAt);

  if (Number.isNaN(start) || Number.isNaN(finish)) {
    return null;
  }

  return Math.max(0, finish - start);
}

export function buildResumedPageRequest(request: IngestPageRequest, checkpoint?: ProviderPageWorkerCheckpoint | null): IngestPageRequest {
  if (!hasCheckpointValue(checkpoint)) {
    return { ...request };
  }

  return {
    ...request,
    page: checkpoint.page ?? request.page,
    cursor: checkpoint.cursor ?? request.cursor,
    updatedAfter: checkpoint.updatedAfter ?? request.updatedAfter,
    updatedBefore: checkpoint.updatedBefore ?? request.updatedBefore,
  };
}

function buildProgressMetadata(
  job: ClaimedQueuedProviderPageJob,
  resumedRequest: IngestPageRequest,
  checkpoint: ProviderPageWorkerCheckpoint,
  requeuedAt: string,
  result: ExecuteProviderPageIngestRunResult,
): Record<string, unknown> {
  return {
    workerExecution: {
      queueJobId: job.queueJobId,
      kind: "provider_page_ingest",
      providerKey: job.providerKey,
      resumedFromCheckpoint: hasCheckpointValue(job.checkpoint),
      attemptCount: job.attemptCount,
      claimedAt: job.lease.claimedAt,
      finishedAt: requeuedAt,
      durationMs: computeDurationMs(job.lease.claimedAt, requeuedAt),
      requestedPage: resumedRequest.page ?? null,
      resumedCursor: resumedRequest.cursor ?? null,
      rawPayloadCount: result.ingest.rawPayloadCount,
      itemCount: result.ingest.itemCount,
      nextCheckpoint: checkpoint,
    },
  };
}

function buildCompletionMetadata(
  job: ClaimedQueuedProviderPageJob,
  resumedRequest: IngestPageRequest,
  finishedAt: string,
  result: ExecuteProviderPageIngestRunResult,
): Record<string, unknown> {
  return {
    workerExecution: {
      queueJobId: job.queueJobId,
      kind: "provider_page_ingest",
      providerKey: job.providerKey,
      resumedFromCheckpoint: hasCheckpointValue(job.checkpoint),
      attemptCount: job.attemptCount,
      claimedAt: job.lease.claimedAt,
      finishedAt,
      durationMs: computeDurationMs(job.lease.claimedAt, finishedAt),
      requestedPage: resumedRequest.page ?? null,
      resumedCursor: resumedRequest.cursor ?? null,
      rawPayloadCount: result.ingest.rawPayloadCount,
      itemCount: result.ingest.itemCount,
      completedWithoutFurtherCheckpoint: true,
    },
  };
}

function buildFailureMetadata(
  job: ClaimedQueuedProviderPageJob,
  resumedRequest: IngestPageRequest,
  finishedAt: string,
  lastErrorSummary: string,
): Record<string, unknown> {
  return {
    workerExecution: {
      queueJobId: job.queueJobId,
      kind: "provider_page_ingest",
      providerKey: job.providerKey,
      resumedFromCheckpoint: hasCheckpointValue(job.checkpoint),
      attemptCount: job.attemptCount,
      claimedAt: job.lease.claimedAt,
      finishedAt,
      durationMs: computeDurationMs(job.lease.claimedAt, finishedAt),
      requestedPage: resumedRequest.page ?? null,
      resumedCursor: resumedRequest.cursor ?? null,
      lastErrorSummary,
    },
  };
}

export async function runNextResumableProviderPageJob(
  queue: DurableProviderPageJobQueueGateway,
  handlers: ResumableProviderPageJobHandlers,
  options: RunNextResumableProviderPageJobOptions,
): Promise<ResumableProviderPageJobRunResult> {
  const now = options.now ?? (() => new Date());
  const claimedAt = now().toISOString();
  const job = await queue.claimNextQueuedProviderPageJob({
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

  const resumedRequest = buildResumedPageRequest(job.request, job.checkpoint);

  try {
    const result = await handlers.runProviderPageJob(resumedRequest);
    const nextCheckpoint = snapshotCheckpoint(result);

    if (nextCheckpoint) {
      const requeuedAt = now().toISOString();
      const metadata = buildProgressMetadata(job, resumedRequest, nextCheckpoint, requeuedAt, result);

      await queue.requeueQueuedProviderPageJob({
        queueJobId: job.queueJobId,
        workerId: options.workerId,
        leaseId: job.lease.leaseId,
        requeuedAt,
        checkpoint: nextCheckpoint,
        metadata,
      });

      return {
        status: "continued",
        workerId: options.workerId,
        job,
        resumedRequest,
        checkpoint: nextCheckpoint,
        requeuedAt,
        metadata,
      };
    }

    const finishedAt = now().toISOString();
    const metadata = buildCompletionMetadata(job, resumedRequest, finishedAt, result);

    await queue.completeQueuedProviderPageJob({
      queueJobId: job.queueJobId,
      workerId: options.workerId,
      leaseId: job.lease.leaseId,
      finishedAt,
      metadata,
    });

    return {
      status: "completed",
      workerId: options.workerId,
      job,
      resumedRequest,
      finishedAt,
      metadata,
    };
  } catch (error) {
    const finishedAt = now().toISOString();
    const lastErrorSummary = summarizeError(error);
    const metadata = buildFailureMetadata(job, resumedRequest, finishedAt, lastErrorSummary);

    await queue.failQueuedProviderPageJob({
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
      resumedRequest,
      finishedAt,
      lastErrorSummary,
      metadata,
    };
  }
}
