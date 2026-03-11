import "server-only";

import type { ResumableProviderPageJobRunResult, ProviderPageWorkerCheckpoint, QueuedProviderPageJob } from "./page-worker";
import type { IngestPageRequest } from "./types";

export type ProviderSyncMode = "backfill" | "incremental";
export type ProviderSyncExecutionState = "scheduled" | "waiting_retry" | "waiting_throttle";

export interface QueuedProviderSyncRequest {
  mode: ProviderSyncMode;
  request: IngestPageRequest;
  requestedAt: string;
}

export interface ActiveProviderSync {
  mode: ProviderSyncMode;
  queueJobId: string;
  requestedAt: string;
  checkpoint: ProviderPageWorkerCheckpoint | null;
  executionState: ProviderSyncExecutionState;
  retryCount: number;
  nextAttemptAt: string | null;
}

export interface ProviderSyncState {
  providerKey: string;
  activeSync: ActiveProviderSync | null;
  pendingBackfill: QueuedProviderSyncRequest | null;
  pendingIncremental: QueuedProviderSyncRequest | null;
}

export interface QueueProviderSyncPageJobInput {
  providerKey: string;
  mode: ProviderSyncMode;
  request: IngestPageRequest;
  requestedAt: string;
}

export interface ProviderSyncOrchestrationQueueGateway {
  enqueueQueuedProviderPageSyncJob(input: QueueProviderSyncPageJobInput): Promise<QueuedProviderPageJob>;
}

export type ProviderSyncScheduleResult =
  | {
      status: "queued";
      mode: ProviderSyncMode;
      queuedJob: QueuedProviderPageJob;
      state: ProviderSyncState;
    }
  | {
      status: "deferred";
      mode: ProviderSyncMode;
      reason: "backfill_active" | "incremental_active";
      state: ProviderSyncState;
    }
  | {
      status: "coalesced";
      mode: ProviderSyncMode;
      reason: "pending_incremental_exists" | "backfill_already_active" | "backfill_already_pending";
      state: ProviderSyncState;
    };

export type ProviderSyncAdvanceResult =
  | {
      status: "idle";
      state: ProviderSyncState;
    }
  | {
      status: "continued";
      state: ProviderSyncState;
    }
  | {
      status: "promoted";
      promotedMode: ProviderSyncMode;
      queuedJob: QueuedProviderPageJob;
      state: ProviderSyncState;
    };

function cloneCheckpoint(checkpoint?: ProviderPageWorkerCheckpoint | null): ProviderPageWorkerCheckpoint | null {
  return checkpoint ? { ...checkpoint } : null;
}

function normalizeBackfillRequest(request: IngestPageRequest): IngestPageRequest {
  return {
    ...request,
    mode: "backfill",
    page: request.page ?? 1,
    cursor: undefined,
    updatedAfter: undefined,
    updatedBefore: undefined,
  };
}

function pickEarlierIso(left?: string, right?: string): string | undefined {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return Date.parse(left) <= Date.parse(right) ? left : right;
}

function pickLaterIso(left?: string, right?: string): string | undefined {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return Date.parse(left) >= Date.parse(right) ? left : right;
}

function normalizeIncrementalRequest(request: IngestPageRequest): IngestPageRequest {
  return {
    ...request,
    mode: "incremental",
    page: 1,
    cursor: undefined,
  };
}

function mergeIncrementalRequests(
  existing: QueuedProviderSyncRequest | null,
  incoming: QueuedProviderSyncRequest,
): QueuedProviderSyncRequest {
  if (!existing) {
    return incoming;
  }

  const mergedRequest: IngestPageRequest = {
    ...existing.request,
    ...incoming.request,
    mode: "incremental",
    page: 1,
    cursor: undefined,
    updatedAfter: pickEarlierIso(existing.request.updatedAfter, incoming.request.updatedAfter),
    updatedBefore:
      existing.request.updatedBefore == null || incoming.request.updatedBefore == null
        ? undefined
        : pickLaterIso(existing.request.updatedBefore, incoming.request.updatedBefore),
    requestId: incoming.request.requestId ?? existing.request.requestId,
    actorId: incoming.request.actorId ?? existing.request.actorId,
  };

  return {
    mode: "incremental",
    request: mergedRequest,
    requestedAt: pickEarlierIso(existing.requestedAt, incoming.requestedAt) ?? incoming.requestedAt,
  };
}

function buildActiveSync(mode: ProviderSyncMode, queuedJob: QueuedProviderPageJob, requestedAt: string): ActiveProviderSync {
  return {
    mode,
    queueJobId: queuedJob.queueJobId,
    requestedAt,
    checkpoint: cloneCheckpoint(queuedJob.checkpoint),
    executionState: "scheduled",
    retryCount: queuedJob.retryCount ?? 0,
    nextAttemptAt: queuedJob.nextAttemptAt ?? null,
  };
}

async function enqueueSync(
  queue: ProviderSyncOrchestrationQueueGateway,
  state: ProviderSyncState,
  mode: ProviderSyncMode,
  request: IngestPageRequest,
  requestedAt: string,
): Promise<{ queuedJob: QueuedProviderPageJob; state: ProviderSyncState }> {
  const queuedJob = await queue.enqueueQueuedProviderPageSyncJob({
    providerKey: state.providerKey,
    mode,
    request,
    requestedAt,
  });

  return {
    queuedJob,
    state: {
      ...state,
      activeSync: buildActiveSync(mode, queuedJob, requestedAt),
    },
  };
}

export function createInitialProviderSyncState(providerKey: string): ProviderSyncState {
  return {
    providerKey,
    activeSync: null,
    pendingBackfill: null,
    pendingIncremental: null,
  };
}

export async function scheduleProviderBackfillSync(
  queue: ProviderSyncOrchestrationQueueGateway,
  state: ProviderSyncState,
  request: IngestPageRequest,
  requestedAt: string,
): Promise<ProviderSyncScheduleResult> {
  const normalizedRequest = normalizeBackfillRequest({
    ...request,
    providerKey: state.providerKey,
  });

  if (!state.activeSync && !state.pendingBackfill) {
    const queued = await enqueueSync(queue, state, "backfill", normalizedRequest, requestedAt);

    return {
      status: "queued",
      mode: "backfill",
      queuedJob: queued.queuedJob,
      state: queued.state,
    };
  }

  if (state.activeSync?.mode === "backfill") {
    return {
      status: "coalesced",
      mode: "backfill",
      reason: "backfill_already_active",
      state,
    };
  }

  if (state.pendingBackfill) {
    return {
      status: "coalesced",
      mode: "backfill",
      reason: "backfill_already_pending",
      state,
    };
  }

  return {
    status: "deferred",
    mode: "backfill",
    reason: "incremental_active",
    state: {
      ...state,
      pendingBackfill: {
        mode: "backfill",
        request: normalizedRequest,
        requestedAt,
      },
    },
  };
}

export async function scheduleProviderIncrementalSync(
  queue: ProviderSyncOrchestrationQueueGateway,
  state: ProviderSyncState,
  request: IngestPageRequest,
  requestedAt: string,
): Promise<ProviderSyncScheduleResult> {
  const normalizedRequest = normalizeIncrementalRequest({
    ...request,
    providerKey: state.providerKey,
  });
  const pendingRequest = {
    mode: "incremental" as const,
    request: normalizedRequest,
    requestedAt,
  };

  if (!state.activeSync && !state.pendingBackfill && !state.pendingIncremental) {
    const queued = await enqueueSync(queue, state, "incremental", normalizedRequest, requestedAt);

    return {
      status: "queued",
      mode: "incremental",
      queuedJob: queued.queuedJob,
      state: queued.state,
    };
  }

  if (state.activeSync?.mode === "backfill") {
    const nextState: ProviderSyncState = {
      ...state,
      pendingIncremental: mergeIncrementalRequests(state.pendingIncremental, pendingRequest),
    };

    if (state.pendingIncremental) {
      return {
        status: "coalesced",
        mode: "incremental",
        reason: "pending_incremental_exists",
        state: nextState,
      };
    }

    return {
      status: "deferred",
      mode: "incremental",
      reason: "backfill_active",
      state: nextState,
    };
  }

  if (state.activeSync?.mode === "incremental") {
    const nextState: ProviderSyncState = {
      ...state,
      pendingIncremental: mergeIncrementalRequests(state.pendingIncremental, pendingRequest),
    };

    if (state.pendingIncremental) {
      return {
        status: "coalesced",
        mode: "incremental",
        reason: "pending_incremental_exists",
        state: nextState,
      };
    }

    return {
      status: "deferred",
      mode: "incremental",
      reason: "incremental_active",
      state: nextState,
    };
  }

  if (state.pendingBackfill) {
    return {
      status: "deferred",
      mode: "incremental",
      reason: "backfill_active",
      state: {
        ...state,
        pendingIncremental: mergeIncrementalRequests(state.pendingIncremental, pendingRequest),
      },
    };
  }

  return {
    status: "coalesced",
    mode: "incremental",
    reason: "pending_incremental_exists",
    state: {
      ...state,
      pendingIncremental: mergeIncrementalRequests(state.pendingIncremental, pendingRequest),
    },
  };
}

async function promotePendingSync(
  queue: ProviderSyncOrchestrationQueueGateway,
  state: ProviderSyncState,
): Promise<ProviderSyncAdvanceResult> {
  if (state.pendingBackfill) {
    const { queuedJob, state: nextState } = await enqueueSync(
      queue,
      {
        ...state,
        pendingBackfill: null,
      },
      "backfill",
      state.pendingBackfill.request,
      state.pendingBackfill.requestedAt,
    );

    return {
      status: "promoted",
      promotedMode: "backfill",
      queuedJob,
      state: nextState,
    };
  }

  if (state.pendingIncremental) {
    const { queuedJob, state: nextState } = await enqueueSync(
      queue,
      {
        ...state,
        pendingIncremental: null,
      },
      "incremental",
      state.pendingIncremental.request,
      state.pendingIncremental.requestedAt,
    );

    return {
      status: "promoted",
      promotedMode: "incremental",
      queuedJob,
      state: nextState,
    };
  }

  return {
    status: "idle",
    state: {
      ...state,
      activeSync: null,
    },
  };
}

export async function applyProviderSyncPageJobResult(
  queue: ProviderSyncOrchestrationQueueGateway,
  state: ProviderSyncState,
  result: ResumableProviderPageJobRunResult,
): Promise<ProviderSyncAdvanceResult> {
  if (!state.activeSync || result.status === "idle") {
    return {
      status: state.activeSync ? "continued" : "idle",
      state,
    };
  }

  if (result.status === "continued" || result.status === "retry_scheduled" || result.status === "throttled") {
    const nextState: ProviderSyncState = {
      ...state,
      activeSync: {
        ...state.activeSync,
        checkpoint: cloneCheckpoint(result.checkpoint),
        executionState:
          result.status === "retry_scheduled"
            ? "waiting_retry"
            : result.status === "throttled"
              ? "waiting_throttle"
              : "scheduled",
        retryCount: result.status === "retry_scheduled" ? result.retryCount : 0,
        nextAttemptAt: result.status === "continued" ? result.nextAttemptAt : result.nextAttemptAt,
      },
    };

    return {
      status: "continued",
      state: nextState,
    };
  }

  return promotePendingSync(
    queue,
    {
      ...state,
      activeSync: null,
    },
  );
}
