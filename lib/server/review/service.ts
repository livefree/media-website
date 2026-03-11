import "server-only";

import { BackendError } from "../errors";
import { logger } from "../logging";
import { applyCatalogPublication } from "../catalog/publish";
import { runInTransaction } from "../../db/transactions";
import { createDefaultReviewWorkflowRepository, createReviewWorkflowRepository } from "../../db/repositories/review";

import type {
  PublishReviewDecisionRequest,
  QueueNormalizedCandidateRequest,
  StartReviewRequest,
  SubmitReviewDecisionRequest,
} from "./types";
import type { PublishOperationType, ReviewDecisionType, ReviewQueueStatus } from "./types";
import type { ReviewDecisionDetailRecord, ReviewQueueDetailRecord, ReviewQueueListItemRecord } from "../../db/repositories/review";

const reviewLogger = logger.child({ subsystem: "review.service" });

function requirePublishTarget(decisionType: ReviewDecisionType, targetCanonicalMediaId?: string) {
  if ((decisionType === "merge" || decisionType === "replace" || decisionType === "unpublish") && !targetCanonicalMediaId) {
    throw new BackendError(`Decision type '${decisionType}' requires a canonical target media record.`, {
      status: 400,
      code: "review_target_media_required",
    });
  }
}

function summarizeDecision(decisionType: ReviewDecisionType, notes?: string) {
  return notes?.trim() || `Decision recorded: ${decisionType}`;
}

function decisionToQueueStatus(decisionType: ReviewDecisionType): ReviewQueueStatus {
  return decisionType === "reject" ? "rejected" : "approved_for_publish";
}

function decisionToPublishOperationType(decisionType: Exclude<ReviewDecisionType, "reject">): PublishOperationType {
  switch (decisionType) {
    case "approve":
      return "create_title";
    case "merge":
      return "merge_into_existing";
    case "replace":
      return "replace_existing";
    case "unpublish":
      return "unpublish_existing";
  }
}

function finalQueueStatus(decisionType: Exclude<ReviewDecisionType, "reject">): ReviewQueueStatus {
  return decisionType === "unpublish" ? "unpublished" : "published";
}

function ensureQueueCanTransition(detail: ReviewQueueDetailRecord, next: ReviewQueueStatus) {
  if (detail.queueEntry.status === "published" || detail.queueEntry.status === "unpublished") {
    throw new BackendError(`Review queue entry '${detail.queueEntry.id}' is already finalized.`, {
      status: 409,
      code: "review_queue_already_finalized",
    });
  }

  if (next === "in_review" && detail.queueEntry.status === "rejected") {
    throw new BackendError(`Review queue entry '${detail.queueEntry.id}' was rejected and cannot be reopened by this path.`, {
      status: 409,
      code: "review_queue_rejected",
    });
  }
}

function ensureDecisionCanPublish(detail: ReviewDecisionDetailRecord) {
  if (detail.decision.decisionType === "reject") {
    throw new BackendError("Rejected decisions cannot be published.", {
      status: 400,
      code: "review_publish_reject_decision",
    });
  }

  if (detail.queueEntry.status !== "approved_for_publish") {
    throw new BackendError(`Queue entry '${detail.queueEntry.id}' is not approved for publish.`, {
      status: 409,
      code: "review_queue_not_ready_for_publish",
    });
  }
}

export async function listReviewQueue(): Promise<ReviewQueueListItemRecord[]> {
  return createDefaultReviewWorkflowRepository().listReviewQueue();
}

export async function getReviewQueueDetail(queueEntryId: string): Promise<ReviewQueueDetailRecord | null> {
  return createDefaultReviewWorkflowRepository().getReviewQueueDetail(queueEntryId);
}

export async function queueNormalizedCandidateForReview(request: QueueNormalizedCandidateRequest) {
  return runInTransaction(
    {
      name: "review.queueNormalizedCandidate",
    },
    async (context) => {
      const repository = createReviewWorkflowRepository(context);
      const queueEntry = await repository.upsertReviewQueueEntry({
        normalizedCandidateId: request.normalizedCandidateId,
        assignedReviewerId: request.assignedReviewerId,
        actorId: request.actorId,
        requestId: request.requestId,
        queuedAt: new Date().toISOString(),
      });

      await repository.createPublishAudit({
        queueEntryId: queueEntry.id,
        normalizedCandidateId: queueEntry.normalizedCandidateId,
        actorId: request.actorId,
        action: "queued",
        actionSummary: "Queued normalized candidate for operator review.",
        createdAt: new Date().toISOString(),
      });

      reviewLogger.info("Queued normalized candidate for review", {
        queueEntryId: queueEntry.id,
        normalizedCandidateId: queueEntry.normalizedCandidateId,
      });

      return queueEntry;
    },
    {
      actorId: request.actorId,
      requestId: request.requestId,
    },
  );
}

export async function startReview(request: StartReviewRequest) {
  return runInTransaction(
    {
      name: "review.startReview",
    },
    async (context) => {
      const repository = createReviewWorkflowRepository(context);
      const detail = await repository.getReviewQueueDetail(request.queueEntryId);

      if (!detail) {
        throw new BackendError(`Review queue entry '${request.queueEntryId}' was not found.`, {
          status: 404,
          code: "review_queue_entry_not_found",
        });
      }

      ensureQueueCanTransition(detail, "in_review");

      const startedAt = new Date().toISOString();
      const queueEntry = await repository.updateReviewQueueEntry(request.queueEntryId, {
        status: "in_review",
        startedAt,
      });

      await repository.createPublishAudit({
        queueEntryId: queueEntry.id,
        normalizedCandidateId: queueEntry.normalizedCandidateId,
        actorId: request.actorId,
        action: "review_started",
        actionSummary: "Operator started review on queue entry.",
        createdAt: startedAt,
      });

      return queueEntry;
    },
    {
      actorId: request.actorId,
      requestId: request.requestId,
    },
  );
}

export async function submitReviewDecision(request: SubmitReviewDecisionRequest) {
  requirePublishTarget(request.decisionType, request.targetCanonicalMediaId);

  return runInTransaction(
    {
      name: "review.submitDecision",
    },
    async (context) => {
      const repository = createReviewWorkflowRepository(context);
      const detail = await repository.getReviewQueueDetail(request.queueEntryId);

      if (!detail) {
        throw new BackendError(`Review queue entry '${request.queueEntryId}' was not found.`, {
          status: 404,
          code: "review_queue_entry_not_found",
        });
      }

      const nextStatus = decisionToQueueStatus(request.decisionType);
      ensureQueueCanTransition(detail, nextStatus);

      const decidedAt = new Date().toISOString();
      const decision = await repository.createReviewDecision({
        queueEntryId: detail.queueEntry.id,
        normalizedCandidateId: detail.queueEntry.normalizedCandidateId,
        decisionType: request.decisionType,
        actorId: request.actorId,
        targetCanonicalMediaId: request.targetCanonicalMediaId,
        notes: request.notes,
        createdAt: decidedAt,
      });

      const queueEntry = await repository.updateReviewQueueEntry(detail.queueEntry.id, {
        status: nextStatus,
        reviewedAt: decidedAt,
        latestDecisionType: request.decisionType,
        latestDecisionSummary: summarizeDecision(request.decisionType, request.notes),
        canonicalMediaId: request.targetCanonicalMediaId,
      });

      await repository.createPublishAudit({
        queueEntryId: queueEntry.id,
        reviewDecisionId: decision.id,
        normalizedCandidateId: queueEntry.normalizedCandidateId,
        actorId: request.actorId,
        action: "review_decision_recorded",
        actionSummary: `Recorded '${request.decisionType}' review decision.`,
        targetCanonicalMediaId: request.targetCanonicalMediaId,
        metadata: {
          notes: request.notes ?? null,
        },
        createdAt: decidedAt,
      });

      reviewLogger.info("Recorded review decision", {
        queueEntryId: queueEntry.id,
        reviewDecisionId: decision.id,
        decisionType: request.decisionType,
      });

      return {
        queueEntry,
        decision,
      };
    },
    {
      actorId: request.actorId,
      requestId: request.requestId,
    },
  );
}

export async function publishReviewDecision(request: PublishReviewDecisionRequest) {
  const startedAt = new Date().toISOString();

  const { operation, detail, publishDecisionType } = await runInTransaction(
    {
      name: "review.publishDecision.prepare",
    },
    async (context) => {
      const repository = createReviewWorkflowRepository(context);
      const detail = await repository.getReviewDecisionDetail(request.reviewDecisionId);

      if (!detail) {
        throw new BackendError(`Review decision '${request.reviewDecisionId}' was not found.`, {
          status: 404,
          code: "review_decision_not_found",
        });
      }

      ensureDecisionCanPublish(detail);
      const publishDecisionType = detail.decision.decisionType;

      if (publishDecisionType === "reject") {
        throw new BackendError("Rejected decisions cannot be published.", {
          status: 400,
          code: "review_publish_reject_decision",
        });
      }

      const operation = await repository.createPublishOperation({
        queueEntryId: detail.queueEntry.id,
        reviewDecisionId: detail.decision.id,
        normalizedCandidateId: detail.candidate.id,
        actorId: request.actorId,
        operationType: decisionToPublishOperationType(publishDecisionType),
        status: "running",
        targetCanonicalMediaId: detail.decision.targetCanonicalMediaId ?? undefined,
        operationSummary: `Executing ${publishDecisionType} publish workflow.`,
        startedAt,
      });

      await repository.createPublishAudit({
        queueEntryId: detail.queueEntry.id,
        reviewDecisionId: detail.decision.id,
        publishOperationId: operation.id,
        normalizedCandidateId: detail.candidate.id,
        actorId: request.actorId,
        action: "publish_started",
        actionSummary: "Started publish operation from approved review decision.",
        targetCanonicalMediaId: detail.decision.targetCanonicalMediaId ?? undefined,
        createdAt: startedAt,
      });

      return {
        detail,
        operation,
        publishDecisionType,
      };
    },
    {
      actorId: request.actorId,
      requestId: request.requestId,
    },
  );

  try {
    const completedAt = new Date().toISOString();

    const result = await runInTransaction(
      {
        name: "review.publishDecision.execute",
      },
      async (context) => {
        const repository = createReviewWorkflowRepository(context);
        const catalogResult = await applyCatalogPublication(context.db, {
          decisionType: publishDecisionType,
          normalizedCandidate: detail.candidate,
          aliases: detail.aliases,
          targetCanonicalMediaId: detail.decision.targetCanonicalMediaId ?? undefined,
          actorId: request.actorId,
          performedAt: new Date(completedAt),
        });

        const updatedOperation = await repository.updatePublishOperation(operation.id, {
          status: "succeeded",
          resultingCanonicalMediaId: catalogResult.mediaId,
          operationSummary: `Publish ${catalogResult.action} succeeded.`,
          completedAt,
        });

        const queueEntry = await repository.updateReviewQueueEntry(detail.queueEntry.id, {
          status: finalQueueStatus(publishDecisionType),
          canonicalMediaId: catalogResult.mediaId,
        });

        await repository.createPublishAudit({
          queueEntryId: detail.queueEntry.id,
          reviewDecisionId: detail.decision.id,
          publishOperationId: operation.id,
          normalizedCandidateId: detail.candidate.id,
          actorId: request.actorId,
          action: "publish_succeeded",
          actionSummary: `Publish ${catalogResult.action} completed successfully.`,
          targetCanonicalMediaId: catalogResult.mediaId,
          metadata: {
            alternateTitleCount: catalogResult.alternateTitleCount,
            seasonCountDelta: catalogResult.seasonCountDelta,
            episodeCountDelta: catalogResult.episodeCountDelta,
          },
          createdAt: completedAt,
        });

        return {
          queueEntry,
          operation: updatedOperation,
          catalogResult,
        };
      },
      {
        actorId: request.actorId,
        requestId: request.requestId,
      },
    );

    reviewLogger.info("Completed publish operation", {
      reviewDecisionId: request.reviewDecisionId,
      publishOperationId: result.operation.id,
      canonicalMediaId: result.catalogResult.mediaId,
      action: result.catalogResult.action,
    });

    return result;
  } catch (error) {
    const failedAt = new Date().toISOString();

    await runInTransaction(
      {
        name: "review.publishDecision.fail",
      },
      async (context) => {
        const repository = createReviewWorkflowRepository(context);
        await repository.updatePublishOperation(operation.id, {
          status: "failed",
          failureSummary: error instanceof Error ? error.message : "Unknown publish failure.",
          completedAt: failedAt,
        });

        await repository.createPublishAudit({
          queueEntryId: detail.queueEntry.id,
          reviewDecisionId: detail.decision.id,
          publishOperationId: operation.id,
          normalizedCandidateId: detail.candidate.id,
          actorId: request.actorId,
          action: "publish_failed",
          actionSummary: "Publish operation failed.",
          targetCanonicalMediaId: detail.decision.targetCanonicalMediaId ?? undefined,
          metadata: {
            error: error instanceof Error ? error.message : "Unknown publish failure.",
          },
          createdAt: failedAt,
        });
      },
      {
        actorId: request.actorId,
        requestId: request.requestId,
      },
    );

    throw error;
  }
}
