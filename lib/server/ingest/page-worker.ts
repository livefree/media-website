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
  retryCount?: number;
  lastAttemptedAt?: string | null;
  nextAttemptAt?: string | null;
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
  retryCount?: number;
  lastAttemptedAt?: string | null;
  nextAttemptAt?: string | null;
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
  retryLimit?: number;
  retryBaseMs?: number;
  retryMaxMs?: number;
  providerThrottleMs?: number | Partial<Record<string, number>>;
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
      nextAttemptAt: string | null;
      metadata: Record<string, unknown>;
    }
  | {
      status: "throttled";
      workerId: string;
      job: ClaimedQueuedProviderPageJob;
      resumedRequest: IngestPageRequest;
      checkpoint: ProviderPageWorkerCheckpoint | null;
      requeuedAt: string;
      nextAttemptAt: string;
      metadata: Record<string, unknown>;
    }
  | {
      status: "retry_scheduled";
      workerId: string;
      job: ClaimedQueuedProviderPageJob;
      resumedRequest: IngestPageRequest;
      checkpoint: ProviderPageWorkerCheckpoint | null;
      requeuedAt: string;
      nextAttemptAt: string;
      retryCount: number;
      metadata: Record<string, unknown>;
      lastErrorSummary: string;
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

function resolveRetryLimit(options: RunNextResumableProviderPageJobOptions): number {
  return Math.max(0, options.retryLimit ?? 2);
}

function resolveRetryBaseMs(options: RunNextResumableProviderPageJobOptions): number {
  return Math.max(0, options.retryBaseMs ?? 5_000);
}

function resolveRetryMaxMs(options: RunNextResumableProviderPageJobOptions): number {
  return Math.max(resolveRetryBaseMs(options), options.retryMaxMs ?? 60_000);
}

function resolveProviderThrottleMs(
  options: RunNextResumableProviderPageJobOptions,
  providerKey: string,
): number {
  const configured = options.providerThrottleMs;

  if (typeof configured === "number") {
    return Math.max(0, configured);
  }

  if (!configured) {
    return 0;
  }

  return Math.max(0, configured[providerKey] ?? 0);
}

function addMs(isoString: string, durationMs: number): string {
  return new Date(Date.parse(isoString) + durationMs).toISOString();
}

function computeRetryBackoffMs(retryCount: number, options: RunNextResumableProviderPageJobOptions): number {
  const base = resolveRetryBaseMs(options);
  const max = resolveRetryMaxMs(options);
  const exponent = Math.max(0, retryCount - 1);
  return Math.min(max, base * 2 ** exponent);
}

function getDurableCheckpoint(checkpoint?: ProviderPageWorkerCheckpoint | null): ProviderPageWorkerCheckpoint {
  return checkpoint ? { ...checkpoint } : {};
}

function parseIsoDate(value?: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function getPendingAttemptAt(job: ClaimedQueuedProviderPageJob, throttleMs: number): string | null {
  const dueAt = parseIsoDate(job.nextAttemptAt);

  if (dueAt != null) {
    return new Date(dueAt).toISOString();
  }

  if (throttleMs <= 0) {
    return null;
  }

  const lastAttemptedAt = parseIsoDate(job.lastAttemptedAt);

  if (lastAttemptedAt == null) {
    return null;
  }

  return new Date(lastAttemptedAt + throttleMs).toISOString();
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
  nextAttemptAt: string | null,
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
      retryCount: job.retryCount ?? 0,
      rawPayloadCount: result.ingest.rawPayloadCount,
      itemCount: result.ingest.itemCount,
      nextCheckpoint: checkpoint,
      nextAttemptAt,
    },
  };
}

function buildThrottleMetadata(
  job: ClaimedQueuedProviderPageJob,
  resumedRequest: IngestPageRequest,
  requeuedAt: string,
  nextAttemptAt: string,
): Record<string, unknown> {
  return {
    workerExecution: {
      queueJobId: job.queueJobId,
      kind: "provider_page_ingest",
      providerKey: job.providerKey,
      resumedFromCheckpoint: hasCheckpointValue(job.checkpoint),
      attemptCount: job.attemptCount,
      retryCount: job.retryCount ?? 0,
      claimedAt: job.lease.claimedAt,
      finishedAt: requeuedAt,
      durationMs: computeDurationMs(job.lease.claimedAt, requeuedAt),
      requestedPage: resumedRequest.page ?? null,
      resumedCursor: resumedRequest.cursor ?? null,
      throttleDeferred: true,
      nextAttemptAt,
    },
  };
}

function buildRetryMetadata(
  job: ClaimedQueuedProviderPageJob,
  resumedRequest: IngestPageRequest,
  requeuedAt: string,
  nextAttemptAt: string,
  retryCount: number,
  lastErrorSummary: string,
): Record<string, unknown> {
  return {
    workerExecution: {
      queueJobId: job.queueJobId,
      kind: "provider_page_ingest",
      providerKey: job.providerKey,
      resumedFromCheckpoint: hasCheckpointValue(job.checkpoint),
      attemptCount: job.attemptCount,
      retryCount,
      claimedAt: job.lease.claimedAt,
      finishedAt: requeuedAt,
      durationMs: computeDurationMs(job.lease.claimedAt, requeuedAt),
      requestedPage: resumedRequest.page ?? null,
      resumedCursor: resumedRequest.cursor ?? null,
      retryScheduled: true,
      nextAttemptAt,
      lastErrorSummary,
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
      retryCount: 0,
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
      retryCount: job.retryCount ?? 0,
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
  const throttleMs = resolveProviderThrottleMs(options, job.providerKey);
  const pendingAttemptAt = getPendingAttemptAt(job, throttleMs);

  if (pendingAttemptAt && Date.parse(claimedAt) < Date.parse(pendingAttemptAt)) {
    const requeuedAt = claimedAt;
    const checkpoint = hasCheckpointValue(job.checkpoint) ? job.checkpoint : null;
    const metadata = buildThrottleMetadata(job, resumedRequest, requeuedAt, pendingAttemptAt);

    await queue.requeueQueuedProviderPageJob({
      queueJobId: job.queueJobId,
      workerId: options.workerId,
      leaseId: job.lease.leaseId,
      requeuedAt,
      checkpoint: getDurableCheckpoint(job.checkpoint),
      retryCount: job.retryCount ?? 0,
      lastAttemptedAt: job.lastAttemptedAt ?? null,
      nextAttemptAt: pendingAttemptAt,
      metadata,
    });

    return {
      status: "throttled",
      workerId: options.workerId,
      job,
      resumedRequest,
      checkpoint,
      requeuedAt,
      nextAttemptAt: pendingAttemptAt,
      metadata,
    };
  }

  try {
    const result = await handlers.runProviderPageJob(resumedRequest);
    const nextCheckpoint = snapshotCheckpoint(result);

    if (nextCheckpoint) {
      const requeuedAt = now().toISOString();
      const nextAttemptAt = throttleMs > 0 ? addMs(requeuedAt, throttleMs) : null;
      const metadata = buildProgressMetadata(job, resumedRequest, nextCheckpoint, requeuedAt, nextAttemptAt, result);

      await queue.requeueQueuedProviderPageJob({
        queueJobId: job.queueJobId,
        workerId: options.workerId,
        leaseId: job.lease.leaseId,
        requeuedAt,
        checkpoint: nextCheckpoint,
        retryCount: 0,
        lastAttemptedAt: requeuedAt,
        nextAttemptAt,
        metadata,
      });

      return {
        status: "continued",
        workerId: options.workerId,
        job,
        resumedRequest,
        checkpoint: nextCheckpoint,
        requeuedAt,
        nextAttemptAt,
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
    const retryCount = (job.retryCount ?? 0) + 1;
    const retryLimit = resolveRetryLimit(options);

    if (retryCount <= retryLimit) {
      const backoffMs = computeRetryBackoffMs(retryCount, options);
      const nextAttemptAt = addMs(finishedAt, backoffMs);
      const checkpoint = hasCheckpointValue(job.checkpoint) ? job.checkpoint : null;
      const metadata = buildRetryMetadata(job, resumedRequest, finishedAt, nextAttemptAt, retryCount, lastErrorSummary);

      await queue.requeueQueuedProviderPageJob({
        queueJobId: job.queueJobId,
        workerId: options.workerId,
        leaseId: job.lease.leaseId,
        requeuedAt: finishedAt,
        checkpoint: getDurableCheckpoint(job.checkpoint),
        retryCount,
        lastAttemptedAt: finishedAt,
        nextAttemptAt,
        metadata,
      });

      return {
        status: "retry_scheduled",
        workerId: options.workerId,
        job,
        resumedRequest,
        checkpoint,
        requeuedAt: finishedAt,
        nextAttemptAt,
        retryCount,
        metadata,
        lastErrorSummary,
      };
    }

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
