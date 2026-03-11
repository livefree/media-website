import "server-only";

export const reviewQueueStatuses = [
  "pending",
  "in_review",
  "approved_for_publish",
  "rejected",
  "published",
  "superseded",
  "unpublished",
] as const;

export type ReviewQueueStatus = (typeof reviewQueueStatuses)[number];

export const reviewDecisionTypes = ["approve", "reject", "merge", "replace", "unpublish"] as const;

export type ReviewDecisionType = (typeof reviewDecisionTypes)[number];

export const publishOperationTypes = [
  "create_title",
  "merge_into_existing",
  "replace_existing",
  "unpublish_existing",
] as const;

export type PublishOperationType = (typeof publishOperationTypes)[number];

export const publishOperationStatuses = ["pending", "running", "succeeded", "failed", "cancelled"] as const;

export type PublishOperationStatus = (typeof publishOperationStatuses)[number];

export const publishAuditActions = [
  "queued",
  "review_started",
  "review_decision_recorded",
  "publish_started",
  "publish_succeeded",
  "publish_failed",
] as const;

export type PublishAuditAction = (typeof publishAuditActions)[number];

export interface QueueNormalizedCandidateRequest {
  normalizedCandidateId: string;
  assignedReviewerId?: string;
  actorId?: string;
  requestId?: string;
}

export interface StartReviewRequest {
  queueEntryId: string;
  actorId?: string;
  requestId?: string;
}

export interface SubmitReviewDecisionRequest {
  queueEntryId: string;
  decisionType: ReviewDecisionType;
  actorId?: string;
  requestId?: string;
  notes?: string;
  targetCanonicalMediaId?: string;
}

export interface PublishReviewDecisionRequest {
  reviewDecisionId: string;
  actorId?: string;
  requestId?: string;
}
