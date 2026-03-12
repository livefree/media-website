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
  "publish_scheduled",
  "publish_schedule_cleared",
  "publish_started",
  "publish_succeeded",
  "publish_failed",
  "visibility_hidden",
  "visibility_restored",
] as const;

export type PublishAuditAction = (typeof publishAuditActions)[number];

export const moderationReportKinds = ["broken_source", "closely_related"] as const;

export type ModerationReportKind = (typeof moderationReportKinds)[number];

export const moderationReportStatuses = ["open", "in_review", "resolved", "dismissed"] as const;

export type ModerationReportStatus = (typeof moderationReportStatuses)[number];

export const moderationReportActionTypes = ["submitted", "acknowledged", "linked_repair", "resolved", "dismissed", "noted"] as const;

export type ModerationReportActionType = (typeof moderationReportActionTypes)[number];

export const manualSubmissionStatuses = ["submitted", "in_review", "accepted", "rejected", "needs_followup"] as const;

export type ManualSubmissionStatus = (typeof manualSubmissionStatuses)[number];

export const manualSubmissionActionTypes = ["submitted", "status_changed", "linked_review", "linked_resource", "noted"] as const;

export type ManualSubmissionActionType = (typeof manualSubmissionActionTypes)[number];

export const manualTitleTypeHints = ["movie", "series", "anime", "variety", "documentary", "special", "unknown"] as const;

export type ManualTitleTypeHint = (typeof manualTitleTypeHints)[number];

export interface ModerationReportQuery {
  q?: string;
  kinds?: ModerationReportKind[];
  statuses?: ModerationReportStatus[];
  resourcePublicId?: string;
  mediaPublicId?: string;
}

export interface ModerationReportActionRecord {
  id: string;
  reportId: string;
  actorId?: string | null;
  actionType: ModerationReportActionType;
  summary: string;
  notes?: string | null;
  statusAfter?: ModerationReportStatus | null;
  linkedRepairQueueEntryId?: string | null;
  createdAt: Date;
}

export interface ModerationReportRecord {
  id: string;
  publicId: string;
  kind: ModerationReportKind;
  status: ModerationReportStatus;
  title: string;
  summary: string;
  detail?: string | null;
  reporterName?: string | null;
  reporterEmail?: string | null;
  sourceUrl?: string | null;
  mediaId?: string | null;
  mediaPublicId?: string | null;
  mediaTitle?: string | null;
  mediaSlug?: string | null;
  resourceId?: string | null;
  resourcePublicId?: string | null;
  resourceLabel?: string | null;
  resourceKind?: "stream" | "download" | "subtitle" | "trailer" | null;
  episodePublicId?: string | null;
  episodeTitle?: string | null;
  repairQueueEntryId?: string | null;
  repairQueueStatus?: "open" | "in_progress" | "waiting_provider" | "resolved" | "dismissed" | null;
  latestActionSummary?: string | null;
  createdAt: Date;
  updatedAt: Date;
  queuedAt: Date;
  resolvedAt?: Date | null;
  dismissedAt?: Date | null;
}

export interface ModerationReportDetailRecord {
  report: ModerationReportRecord;
  actions: ModerationReportActionRecord[];
}

export interface CreateModerationReportInput {
  kind: ModerationReportKind;
  title: string;
  summary: string;
  detail?: string;
  reporterName?: string;
  reporterEmail?: string;
  sourceUrl?: string;
  mediaId?: string;
  resourceId?: string;
  evidence?: Record<string, unknown>;
  actorId?: string;
  requestId?: string;
}

export interface ModerationReportStatusUpdateInput {
  status: ModerationReportStatus;
  actorId?: string;
  requestId?: string;
  notes?: string;
  linkedRepairQueueEntryId?: string;
}

export interface ManualTitleSubmissionQuery {
  q?: string;
  statuses?: ManualSubmissionStatus[];
  typeHints?: ManualTitleTypeHint[];
}

export interface ManualTitleSubmissionActionRecord {
  id: string;
  submissionId: string;
  actorId?: string | null;
  actionType: ManualSubmissionActionType;
  summary: string;
  notes?: string | null;
  statusAfter?: ManualSubmissionStatus | null;
  createdAt: Date;
}

export interface ManualTitleSubmissionRecord {
  id: string;
  publicId: string;
  status: ManualSubmissionStatus;
  title: string;
  originalTitle?: string | null;
  typeHint: ManualTitleTypeHint;
  releaseYear?: number | null;
  originCountry?: string | null;
  language?: string | null;
  summary?: string | null;
  notes?: string | null;
  sourceUrl?: string | null;
  canonicalMediaId?: string | null;
  canonicalMediaPublicId?: string | null;
  canonicalMediaTitle?: string | null;
  reviewQueueEntryId?: string | null;
  submittedByName?: string | null;
  submittedByEmail?: string | null;
  latestActionSummary?: string | null;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date | null;
}

export interface ManualTitleSubmissionDetailRecord {
  submission: ManualTitleSubmissionRecord;
  actions: ManualTitleSubmissionActionRecord[];
}

export interface CreateManualTitleSubmissionInput {
  title: string;
  originalTitle?: string;
  typeHint?: ManualTitleTypeHint;
  releaseYear?: number;
  originCountry?: string;
  language?: string;
  summary?: string;
  notes?: string;
  sourceUrl?: string;
  submittedByName?: string;
  submittedByEmail?: string;
  actorId?: string;
  requestId?: string;
}

export interface ManualTitleSubmissionStatusUpdateInput {
  status: ManualSubmissionStatus;
  actorId?: string;
  requestId?: string;
  notes?: string;
  canonicalMediaId?: string;
  reviewQueueEntryId?: string;
}

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

export interface ScheduleReviewPublicationRequest {
  queueEntryId: string;
  publishAt: string;
  actorId?: string;
  requestId?: string;
  notes?: string;
}

export interface ClearScheduledReviewPublicationRequest {
  queueEntryId: string;
  actorId?: string;
  requestId?: string;
  notes?: string;
}
