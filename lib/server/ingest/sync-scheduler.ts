import "server-only";

import { scheduleProviderBackfillSync, scheduleProviderIncrementalSync } from "./sync-orchestration";

import type {
  ProviderSyncAdvanceResult,
  ProviderSyncOrchestrationQueueGateway,
  ProviderSyncState,
} from "./sync-orchestration";
import type { IngestPageRequest } from "./types";

export interface UnattendedProviderSyncPolicy {
  providerKey: string;
  incrementalIntervalMs: number;
  incrementalBootstrapUpdatedAfter?: string;
  backfillStartPage?: number;
}

export interface UnattendedProviderSyncScheduleState {
  providerKey: string;
  nextIncrementalAt: string;
  nextBackfillAt: string | null;
  lastIncrementalTriggeredAt: string | null;
  lastIncrementalCompletedAt: string | null;
  lastBackfillTriggeredAt: string | null;
  lastBackfillCompletedAt: string | null;
}

export interface ProviderSyncScheduleDecision {
  mode: "incremental" | "backfill";
  disposition: "triggered" | "skipped" | "deferred" | "coalesced";
  reason:
    | "due"
    | "not_due"
    | "backfill_active"
    | "incremental_active"
    | "pending_incremental_exists"
    | "backfill_already_active"
    | "backfill_already_pending";
  queuedJobId?: string;
}

export interface RunUnattendedProviderSyncTickResult {
  scheduleState: UnattendedProviderSyncScheduleState;
  syncState: ProviderSyncState;
  decisions: ProviderSyncScheduleDecision[];
}

function addMs(isoString: string, durationMs: number): string {
  return new Date(Date.parse(isoString) + durationMs).toISOString();
}

function isDue(dueAt: string | null | undefined, nowIso: string): boolean {
  if (!dueAt) {
    return false;
  }

  return Date.parse(dueAt) <= Date.parse(nowIso);
}

function buildIncrementalRequest(
  policy: UnattendedProviderSyncPolicy,
  scheduleState: UnattendedProviderSyncScheduleState,
): IngestPageRequest {
  return {
    providerKey: policy.providerKey,
    mode: "incremental",
    updatedAfter: scheduleState.lastIncrementalCompletedAt ?? policy.incrementalBootstrapUpdatedAfter,
  };
}

function buildBackfillRequest(policy: UnattendedProviderSyncPolicy): IngestPageRequest {
  return {
    providerKey: policy.providerKey,
    mode: "backfill",
    page: policy.backfillStartPage ?? 1,
  };
}

export function createInitialUnattendedProviderSyncScheduleState(
  policy: UnattendedProviderSyncPolicy,
  nowIso: string,
): UnattendedProviderSyncScheduleState {
  return {
    providerKey: policy.providerKey,
    nextIncrementalAt: nowIso,
    nextBackfillAt: nowIso,
    lastIncrementalTriggeredAt: null,
    lastIncrementalCompletedAt: null,
    lastBackfillTriggeredAt: null,
    lastBackfillCompletedAt: null,
  };
}

export async function runUnattendedProviderSyncTick(
  queue: ProviderSyncOrchestrationQueueGateway,
  syncState: ProviderSyncState,
  scheduleState: UnattendedProviderSyncScheduleState,
  policy: UnattendedProviderSyncPolicy,
  nowIso: string,
): Promise<RunUnattendedProviderSyncTickResult> {
  let nextSyncState = syncState;
  let nextScheduleState = { ...scheduleState };
  const decisions: ProviderSyncScheduleDecision[] = [];

  if (isDue(nextScheduleState.nextBackfillAt, nowIso)) {
    const result = await scheduleProviderBackfillSync(
      queue,
      nextSyncState,
      buildBackfillRequest(policy),
      nowIso,
    );

    nextSyncState = result.state;
    nextScheduleState = {
      ...nextScheduleState,
      nextBackfillAt: null,
      lastBackfillTriggeredAt: result.status === "queued" ? nowIso : nextScheduleState.lastBackfillTriggeredAt,
    };

    decisions.push({
      mode: "backfill",
      disposition: result.status === "queued" ? "triggered" : result.status,
      reason: result.status === "queued" ? "due" : result.reason,
      queuedJobId: result.status === "queued" ? result.queuedJob.queueJobId : undefined,
    });
  } else {
    decisions.push({
      mode: "backfill",
      disposition: "skipped",
      reason: "not_due",
    });
  }

  if (isDue(nextScheduleState.nextIncrementalAt, nowIso)) {
    const result = await scheduleProviderIncrementalSync(
      queue,
      nextSyncState,
      buildIncrementalRequest(policy, nextScheduleState),
      nowIso,
    );

    nextSyncState = result.state;
    nextScheduleState = {
      ...nextScheduleState,
      nextIncrementalAt: addMs(nowIso, policy.incrementalIntervalMs),
      lastIncrementalTriggeredAt: result.status === "queued" ? nowIso : nextScheduleState.lastIncrementalTriggeredAt,
    };

    decisions.push({
      mode: "incremental",
      disposition: result.status === "queued" ? "triggered" : result.status,
      reason: result.status === "queued" ? "due" : result.reason,
      queuedJobId: result.status === "queued" ? result.queuedJob.queueJobId : undefined,
    });
  } else {
    decisions.push({
      mode: "incremental",
      disposition: "skipped",
      reason: "not_due",
    });
  }

  return {
    scheduleState: nextScheduleState,
    syncState: nextSyncState,
    decisions,
  };
}

export async function applyUnattendedProviderSyncAdvance(
  _queue: ProviderSyncOrchestrationQueueGateway,
  syncState: ProviderSyncState,
  scheduleState: UnattendedProviderSyncScheduleState,
  advance: ProviderSyncAdvanceResult,
  observedAt: string,
): Promise<{
  syncState: ProviderSyncState;
  scheduleState: UnattendedProviderSyncScheduleState;
  advance: ProviderSyncAdvanceResult;
}> {
  const previousMode = syncState.activeSync?.mode ?? null;

  let nextScheduleState = { ...scheduleState };
  if ((advance.status === "idle" || advance.status === "promoted") && previousMode === "incremental") {
    nextScheduleState = {
      ...nextScheduleState,
      lastIncrementalCompletedAt: observedAt,
    };
  }

  if ((advance.status === "idle" || advance.status === "promoted") && previousMode === "backfill") {
    nextScheduleState = {
      ...nextScheduleState,
      lastBackfillCompletedAt: observedAt,
      nextBackfillAt: null,
    };
  }

  return {
    syncState: advance.state,
    scheduleState: nextScheduleState,
    advance,
  };
}

export async function runUnattendedProviderSyncWorkerStep(
  queue: ProviderSyncOrchestrationQueueGateway,
  syncState: ProviderSyncState,
  scheduleState: UnattendedProviderSyncScheduleState,
  advancePromise: Promise<ProviderSyncAdvanceResult>,
  observedAt: string,
): Promise<{
  syncState: ProviderSyncState;
  scheduleState: UnattendedProviderSyncScheduleState;
  advance: ProviderSyncAdvanceResult;
}> {
  const advance = await advancePromise;
  return applyUnattendedProviderSyncAdvance(queue, syncState, scheduleState, advance, observedAt);
}
