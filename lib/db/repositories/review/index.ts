import "server-only";

import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import type { RepositoryContext } from "../types";
import { BaseRepository, createRepositoryContext } from "../types";
import { requireDb } from "../../client";

import type { MatchReason, MatchSuggestionKind, NormalizedAliasValue, NormalizedMediaType, NormalizedSeasonEpisodeHints, NormalizedSourceSummary } from "../../../server/normalize";
import type {
  CreateManualTitleSubmissionInput,
  CreateModerationReportInput,
  ManualSubmissionActionType,
  ManualSubmissionStatus,
  ManualTitleSubmissionActionRecord,
  ManualTitleSubmissionDetailRecord,
  ManualTitleSubmissionQuery,
  ManualTitleSubmissionRecord,
  ManualTitleSubmissionStatusUpdateInput,
  ModerationReportActionRecord,
  ModerationReportDetailRecord,
  ModerationReportKind,
  ModerationReportQuery,
  ModerationReportRecord,
  ModerationReportStatus,
  ModerationReportStatusUpdateInput,
  PublishAuditAction,
  PublishOperationStatus,
  PublishOperationType,
  ReviewDecisionType,
  ReviewQueueStatus,
} from "../../../server/review";
import type {
  PersistedCandidateAliasRecord,
  PersistedDuplicateSignalRecord,
  PersistedMatchSuggestionRecord,
  PersistedNormalizedCandidateRecord,
} from "../normalization/types";
import type { IngestMode } from "../../../server/ingest";
import type { IngestRunScope } from "../staging/types";
import type {
  PersistedPublishAuditRecord,
  PersistedPublishOperationRecord,
  PersistedReviewDecisionRecord,
  PersistedReviewQueueEntryRecord,
  ManualTitleSubmissionActionCreateInput,
  ModerationReportActionCreateInput,
  PublishAuditCreateInput,
  PublishOperationCreateInput,
  PublishOperationUpdateInput,
  ReviewDecisionCreateInput,
  ReviewDecisionDetailRecord,
  ReviewQueueDetailRecord,
  ReviewQueueEntryUpdateInput,
  ReviewQueueEntryUpsertInput,
  ReviewQueueListItemRecord,
  ReviewWorkflowRepository as ReviewWorkflowRepositoryContract,
} from "./types";

const normalizedMediaTypeMap = {
  MOVIE: "movie",
  SERIES: "series",
  ANIME: "anime",
  VARIETY: "variety",
  DOCUMENTARY: "documentary",
  SPECIAL: "special",
  UNKNOWN: "unknown",
} as const;

const candidateAliasSourceMap = {
  TITLE: "title",
  ORIGINAL_TITLE: "original_title",
  DERIVED: "derived",
} as const;

const matchTargetSourceMap = {
  CANONICAL: "canonical",
  NORMALIZED_CANDIDATE: "normalized_candidate",
} as const;

const matchSuggestionKindMap = {
  EXACT: "exact",
  PROBABLE: "probable",
  AMBIGUOUS: "ambiguous",
  NONE: "none",
} as const;

const duplicateSignalKindMap = {
  CANDIDATE_CANDIDATE: "candidate_candidate",
  CANDIDATE_CANONICAL: "candidate_canonical",
} as const;

const duplicateSignalStatusMap = {
  ACTIVE: "active",
  SUPERSEDED: "superseded",
} as const;

const reviewQueueStatusMap = {
  pending: "PENDING",
  in_review: "IN_REVIEW",
  approved_for_publish: "APPROVED_FOR_PUBLISH",
  rejected: "REJECTED",
  published: "PUBLISHED",
  superseded: "SUPERSEDED",
  unpublished: "UNPUBLISHED",
} as const;

const reviewDecisionTypeMap = {
  approve: "APPROVE",
  reject: "REJECT",
  merge: "MERGE",
  replace: "REPLACE",
  unpublish: "UNPUBLISH",
} as const;

const publishOperationTypeMap = {
  create_title: "CREATE_TITLE",
  merge_into_existing: "MERGE_INTO_EXISTING",
  replace_existing: "REPLACE_EXISTING",
  unpublish_existing: "UNPUBLISH_EXISTING",
} as const;

const publishOperationStatusMap = {
  pending: "PENDING",
  running: "RUNNING",
  succeeded: "SUCCEEDED",
  failed: "FAILED",
  cancelled: "CANCELLED",
} as const;

const publishAuditActionMap = {
  queued: "QUEUED",
  review_started: "REVIEW_STARTED",
  review_decision_recorded: "REVIEW_DECISION_RECORDED",
  publish_scheduled: "PUBLISH_SCHEDULED",
  publish_schedule_cleared: "PUBLISH_SCHEDULE_CLEARED",
  publish_started: "PUBLISH_STARTED",
  publish_succeeded: "PUBLISH_SUCCEEDED",
  publish_failed: "PUBLISH_FAILED",
  visibility_hidden: "VISIBILITY_HIDDEN",
  visibility_restored: "VISIBILITY_RESTORED",
} as const;

const moderationReportKindMap = {
  broken_source: "BROKEN_SOURCE",
  closely_related: "CLOSELY_RELATED",
} as const;

const moderationReportStatusMap = {
  open: "OPEN",
  in_review: "IN_REVIEW",
  resolved: "RESOLVED",
  dismissed: "DISMISSED",
} as const;

const moderationReportActionTypeMap = {
  submitted: "SUBMITTED",
  acknowledged: "ACKNOWLEDGED",
  linked_repair: "LINKED_REPAIR",
  resolved: "RESOLVED",
  dismissed: "DISMISSED",
  noted: "NOTED",
} as const;

const manualSubmissionStatusMap = {
  submitted: "SUBMITTED",
  in_review: "IN_REVIEW",
  accepted: "ACCEPTED",
  rejected: "REJECTED",
  needs_followup: "NEEDS_FOLLOWUP",
} as const;

const manualSubmissionActionTypeMap = {
  submitted: "SUBMITTED",
  status_changed: "STATUS_CHANGED",
  linked_review: "LINKED_REVIEW",
  linked_resource: "LINKED_RESOURCE",
  noted: "NOTED",
} as const;

const manualTitleTypeHintMap = {
  movie: "MOVIE",
  series: "SERIES",
  anime: "ANIME",
  variety: "VARIETY",
  documentary: "DOCUMENTARY",
  special: "SPECIAL",
} as const;

function toDate(value?: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(value);
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

function fromJsonValue<T>(value: Prisma.JsonValue | null): T | null {
  if (value === null) {
    return null;
  }

  return value as unknown as T;
}

function mapReviewQueueStatus(value: ReviewQueueStatus) {
  return reviewQueueStatusMap[value];
}

function mapReviewDecisionType(value: ReviewDecisionType) {
  return reviewDecisionTypeMap[value];
}

function mapPublishOperationType(value: PublishOperationType) {
  return publishOperationTypeMap[value];
}

function mapPublishOperationStatus(value: PublishOperationStatus) {
  return publishOperationStatusMap[value];
}

function mapPublishAuditAction(value: PublishAuditAction) {
  return publishAuditActionMap[value];
}

function mapModerationReportKind(value: ModerationReportKind) {
  return moderationReportKindMap[value];
}

function mapModerationReportStatus(value: ModerationReportStatus) {
  return moderationReportStatusMap[value];
}

function mapModerationReportActionType(value: ModerationReportActionRecord["actionType"]) {
  return moderationReportActionTypeMap[value];
}

function mapManualSubmissionStatus(value: ManualSubmissionStatus) {
  return manualSubmissionStatusMap[value];
}

function mapManualSubmissionActionType(value: ManualSubmissionActionType) {
  return manualSubmissionActionTypeMap[value];
}

function mapManualTitleTypeHint(value?: ManualTitleSubmissionRecord["typeHint"] | null) {
  if (!value || value === "unknown") {
    return null;
  }

  return manualTitleTypeHintMap[value];
}

function unmapNormalizedMediaType(value: keyof typeof normalizedMediaTypeMap): NormalizedMediaType {
  return normalizedMediaTypeMap[value];
}

function unmapReviewNormalizedCandidateIngestMode(value: string): IngestMode {
  switch (value) {
    case "BACKFILL":
      return "backfill";
    case "INCREMENTAL":
      return "incremental";
    case "MANUAL":
      return "manual";
  }

  throw new Error(`Unsupported ingest mode: ${value}`);
}

function unmapReviewNormalizedCandidateIngestScope(value: string): IngestRunScope {
  switch (value) {
    case "PAGE":
      return "page";
    case "DETAIL":
      return "detail";
    case "SOURCE_REFRESH":
      return "source_refresh";
    case "SOURCE_PROBE":
      return "source_probe";
  }

  throw new Error(`Unsupported ingest run scope: ${value}`);
}

function unmapCandidateAliasSource(value: keyof typeof candidateAliasSourceMap): NormalizedAliasValue["source"] {
  return candidateAliasSourceMap[value];
}

function unmapMatchTargetSource(value: keyof typeof matchTargetSourceMap): PersistedMatchSuggestionRecord["targetSource"] {
  return matchTargetSourceMap[value];
}

function unmapMatchSuggestionKind(value: keyof typeof matchSuggestionKindMap): MatchSuggestionKind {
  return matchSuggestionKindMap[value];
}

function unmapDuplicateSignalKind(value: keyof typeof duplicateSignalKindMap): PersistedDuplicateSignalRecord["kind"] {
  switch (value) {
    case "CANDIDATE_CANDIDATE":
      return "candidate_candidate";
    case "CANDIDATE_CANONICAL":
      return "candidate_canonical";
  }

  throw new Error(`Unsupported duplicate signal kind: ${value}`);
}

function unmapDuplicateSignalStatus(value: keyof typeof duplicateSignalStatusMap): PersistedDuplicateSignalRecord["status"] {
  switch (value) {
    case "ACTIVE":
      return "active";
    case "SUPERSEDED":
      return "superseded";
  }

  throw new Error(`Unsupported duplicate signal status: ${value}`);
}

function unmapReviewQueueStatus(value: string): ReviewQueueStatus {
  switch (value) {
    case "PENDING":
      return "pending";
    case "IN_REVIEW":
      return "in_review";
    case "APPROVED_FOR_PUBLISH":
      return "approved_for_publish";
    case "REJECTED":
      return "rejected";
    case "PUBLISHED":
      return "published";
    case "SUPERSEDED":
      return "superseded";
    case "UNPUBLISHED":
      return "unpublished";
  }

  throw new Error(`Unsupported review queue status: ${value}`);
}

function unmapReviewDecisionType(value: string): ReviewDecisionType {
  switch (value) {
    case "APPROVE":
      return "approve";
    case "REJECT":
      return "reject";
    case "MERGE":
      return "merge";
    case "REPLACE":
      return "replace";
    case "UNPUBLISH":
      return "unpublish";
  }

  throw new Error(`Unsupported review decision type: ${value}`);
}

function unmapPublishOperationType(value: string): PublishOperationType {
  switch (value) {
    case "CREATE_TITLE":
      return "create_title";
    case "MERGE_INTO_EXISTING":
      return "merge_into_existing";
    case "REPLACE_EXISTING":
      return "replace_existing";
    case "UNPUBLISH_EXISTING":
      return "unpublish_existing";
  }

  throw new Error(`Unsupported publish operation type: ${value}`);
}

function unmapPublishOperationStatus(value: string): PublishOperationStatus {
  switch (value) {
    case "PENDING":
      return "pending";
    case "RUNNING":
      return "running";
    case "SUCCEEDED":
      return "succeeded";
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
  }

  throw new Error(`Unsupported publish operation status: ${value}`);
}

function unmapPublishAuditAction(value: string): PublishAuditAction {
  switch (value) {
    case "QUEUED":
      return "queued";
    case "REVIEW_STARTED":
      return "review_started";
    case "REVIEW_DECISION_RECORDED":
      return "review_decision_recorded";
    case "PUBLISH_SCHEDULED":
      return "publish_scheduled";
    case "PUBLISH_SCHEDULE_CLEARED":
      return "publish_schedule_cleared";
    case "PUBLISH_STARTED":
      return "publish_started";
    case "PUBLISH_SUCCEEDED":
      return "publish_succeeded";
    case "PUBLISH_FAILED":
      return "publish_failed";
    case "VISIBILITY_HIDDEN":
      return "visibility_hidden";
    case "VISIBILITY_RESTORED":
      return "visibility_restored";
  }

  throw new Error(`Unsupported publish audit action: ${value}`);
}

function unmapModerationReportKind(value: string): ModerationReportKind {
  switch (value) {
    case "BROKEN_SOURCE":
      return "broken_source";
    case "CLOSELY_RELATED":
      return "closely_related";
  }

  throw new Error(`Unsupported moderation report kind: ${value}`);
}

function unmapModerationReportStatus(value: string): ModerationReportStatus {
  switch (value) {
    case "OPEN":
      return "open";
    case "IN_REVIEW":
      return "in_review";
    case "RESOLVED":
      return "resolved";
    case "DISMISSED":
      return "dismissed";
  }

  throw new Error(`Unsupported moderation report status: ${value}`);
}

function unmapModerationReportActionType(value: string): ModerationReportActionRecord["actionType"] {
  switch (value) {
    case "SUBMITTED":
      return "submitted";
    case "ACKNOWLEDGED":
      return "acknowledged";
    case "LINKED_REPAIR":
      return "linked_repair";
    case "RESOLVED":
      return "resolved";
    case "DISMISSED":
      return "dismissed";
    case "NOTED":
      return "noted";
  }

  throw new Error(`Unsupported moderation report action type: ${value}`);
}

function unmapManualSubmissionStatus(value: string): ManualSubmissionStatus {
  switch (value) {
    case "SUBMITTED":
      return "submitted";
    case "IN_REVIEW":
      return "in_review";
    case "ACCEPTED":
      return "accepted";
    case "REJECTED":
      return "rejected";
    case "NEEDS_FOLLOWUP":
      return "needs_followup";
  }

  throw new Error(`Unsupported manual submission status: ${value}`);
}

function unmapManualSubmissionActionType(value: string): ManualSubmissionActionType {
  switch (value) {
    case "SUBMITTED":
      return "submitted";
    case "STATUS_CHANGED":
      return "status_changed";
    case "LINKED_REVIEW":
      return "linked_review";
    case "LINKED_RESOURCE":
      return "linked_resource";
    case "NOTED":
      return "noted";
  }

  throw new Error(`Unsupported manual submission action type: ${value}`);
}

function unmapManualTitleTypeHint(value: string | null): ManualTitleSubmissionRecord["typeHint"] {
  switch (value) {
    case "MOVIE":
      return "movie";
    case "SERIES":
      return "series";
    case "ANIME":
      return "anime";
    case "VARIETY":
      return "variety";
    case "DOCUMENTARY":
      return "documentary";
    case "SPECIAL":
      return "special";
    case null:
      return "unknown";
  }

  throw new Error(`Unsupported manual title type hint: ${value}`);
}

function unmapResourceKind(
  value: string | null | undefined,
): ModerationReportRecord["resourceKind"] {
  switch (value) {
    case "STREAM":
      return "stream";
    case "DOWNLOAD":
      return "download";
    case "SUBTITLE":
      return "subtitle";
    case "TRAILER":
      return "trailer";
    case null:
    case undefined:
      return null;
  }

  throw new Error(`Unsupported moderation resource kind: ${value}`);
}

function unmapRepairQueueStatus(
  value: string | null | undefined,
): ModerationReportRecord["repairQueueStatus"] {
  switch (value) {
    case "OPEN":
      return "open";
    case "IN_PROGRESS":
      return "in_progress";
    case "WAITING_PROVIDER":
      return "waiting_provider";
    case "RESOLVED":
      return "resolved";
    case "DISMISSED":
      return "dismissed";
    case null:
    case undefined:
      return null;
  }

  throw new Error(`Unsupported moderation repair queue status: ${value}`);
}

type NormalizedCandidateReviewPayload = Prisma.NormalizedCandidateGetPayload<Record<string, never>> & {
  stagingCandidate?: {
    ingestJobId: string | null;
    ingestRunId: string | null;
    ingestRun?: {
      requestId: string | null;
      actorId: string | null;
      mode: string;
      scope: string;
      startedAt: Date;
      finishedAt: Date | null;
    } | null;
  } | null;
};

function mapNormalizedCandidateRecord(
  record: NormalizedCandidateReviewPayload,
): PersistedNormalizedCandidateRecord {
  const staging = record.stagingCandidate;
  const ingestRun = staging?.ingestRun ?? null;
  return {
    id: record.id,
    stagingCandidateId: record.stagingCandidateId,
    providerId: record.providerId,
    providerItemId: record.providerItemId,
    ingestJobId: staging?.ingestJobId ?? null,
    ingestRunId: staging?.ingestRunId ?? null,
    status:
      record.status === "FAILED" ? "failed" : record.status === "WARNING" ? "warning" : "normalized",
    title: {
      display: record.titleDisplay,
      comparable: record.titleComparable,
    },
    originalTitle:
      record.originalTitleDisplay || record.originalTitleComparable
        ? {
            display: record.originalTitleDisplay ?? "",
            comparable: record.originalTitleComparable ?? "",
          }
        : null,
    summary: record.summary,
    mediaType: unmapNormalizedMediaType(record.mediaType),
    releaseYear: record.releaseYear,
    region: record.region,
    language: record.language,
    seasonEpisodeHints: fromJsonValue<NormalizedSeasonEpisodeHints>(record.seasonEpisodeHints),
    sourceSummary: fromJsonValue<NormalizedSourceSummary>(record.sourceSummary),
    evidence: fromJsonValue<PersistedNormalizedCandidateRecord["evidence"]>(record.evidence),
    warnings: record.warnings,
    normalizationNotes: record.normalizationNotes,
    failureSummary: record.failureSummary,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ingestRequestId: ingestRun?.requestId ?? null,
    ingestActorId: ingestRun?.actorId ?? null,
    ingestMode: ingestRun ? unmapReviewNormalizedCandidateIngestMode(ingestRun.mode) : null,
    ingestScope: ingestRun ? unmapReviewNormalizedCandidateIngestScope(ingestRun.scope) : null,
    ingestStartedAt: ingestRun?.startedAt ?? null,
    ingestFinishedAt: ingestRun?.finishedAt ?? null,
  };
}

function mapAliasRecord(record: Prisma.CandidateAliasGetPayload<Record<string, never>>): PersistedCandidateAliasRecord {
  return {
    id: record.id,
    normalizedCandidateId: record.normalizedCandidateId,
    source: unmapCandidateAliasSource(record.source),
    displayValue: record.displayValue,
    comparableValue: record.comparableValue,
    note: record.note,
    createdAt: record.createdAt,
  };
}

function mapMatchSuggestionRecord(
  record: Prisma.MatchSuggestionGetPayload<Record<string, never>>,
): PersistedMatchSuggestionRecord {
  return {
    id: record.id,
    normalizedCandidateId: record.normalizedCandidateId,
    targetSource: unmapMatchTargetSource(record.targetSource),
    targetCanonicalMediaId: record.targetCanonicalMediaId,
    targetNormalizedCandidateId: record.targetNormalizedCandidateId,
    kind: unmapMatchSuggestionKind(record.kind),
    confidence: record.confidence,
    reasons: fromJsonValue<MatchReason[]>(record.reasons) ?? [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapDuplicateSignalRecord(
  record: Prisma.DuplicateSignalGetPayload<Record<string, never>>,
): PersistedDuplicateSignalRecord {
  return {
    id: record.id,
    sourceNormalizedCandidateId: record.sourceNormalizedCandidateId,
    targetSource: unmapMatchTargetSource(record.targetSource),
    targetCanonicalMediaId: record.targetCanonicalMediaId,
    targetNormalizedCandidateId: record.targetNormalizedCandidateId,
    kind: unmapDuplicateSignalKind(record.kind),
    status: unmapDuplicateSignalStatus(record.status),
    confidence: record.confidence,
    reasons: fromJsonValue<MatchReason[]>(record.reasons) ?? [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapQueueEntryRecord(
  record: Prisma.ReviewQueueEntryGetPayload<Record<string, never>>,
): PersistedReviewQueueEntryRecord {
  return {
    id: record.id,
    normalizedCandidateId: record.normalizedCandidateId,
    canonicalMediaId: record.canonicalMediaId,
    status: unmapReviewQueueStatus(record.status),
    assignedReviewerId: record.assignedReviewerId,
    latestDecisionType: record.latestDecisionType ? unmapReviewDecisionType(record.latestDecisionType) : null,
    latestDecisionSummary: record.latestDecisionSummary,
    scheduledPublishAt: record.scheduledPublishAt,
    queuedAt: record.queuedAt,
    startedAt: record.startedAt,
    reviewedAt: record.reviewedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapReviewDecisionRecord(
  record: Prisma.ReviewDecisionGetPayload<Record<string, never>>,
): PersistedReviewDecisionRecord {
  return {
    id: record.id,
    queueEntryId: record.queueEntryId,
    normalizedCandidateId: record.normalizedCandidateId,
    decisionType: unmapReviewDecisionType(record.decisionType),
    actorId: record.actorId,
    targetCanonicalMediaId: record.targetCanonicalMediaId,
    notes: record.notes,
    createdAt: record.createdAt,
  };
}

function mapPublishOperationRecord(
  record: Prisma.PublishOperationGetPayload<Record<string, never>>,
): PersistedPublishOperationRecord {
  return {
    id: record.id,
    queueEntryId: record.queueEntryId,
    reviewDecisionId: record.reviewDecisionId,
    normalizedCandidateId: record.normalizedCandidateId,
    actorId: record.actorId,
    operationType: unmapPublishOperationType(record.operationType),
    status: unmapPublishOperationStatus(record.status),
    targetCanonicalMediaId: record.targetCanonicalMediaId,
    resultingCanonicalMediaId: record.resultingCanonicalMediaId,
    operationSummary: record.operationSummary,
    failureSummary: record.failureSummary,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapPublishAuditRecord(
  record: Prisma.PublishAuditRecordGetPayload<Record<string, never>>,
): PersistedPublishAuditRecord {
  return {
    id: record.id,
    queueEntryId: record.queueEntryId,
    reviewDecisionId: record.reviewDecisionId,
    publishOperationId: record.publishOperationId,
    normalizedCandidateId: record.normalizedCandidateId,
    actorId: record.actorId,
    action: unmapPublishAuditAction(record.action),
    actionSummary: record.actionSummary,
    targetCanonicalMediaId: record.targetCanonicalMediaId,
    metadata: fromJsonValue<Record<string, unknown>>(record.metadata),
    createdAt: record.createdAt,
  };
}

function mapModerationReportRecord(
  record: Prisma.ModerationReportGetPayload<{
    include: {
      media: {
        select: {
          id: true;
          publicId: true;
          title: true;
          slug: true;
        };
      };
      resource: {
        select: {
          id: true;
          publicId: true;
          kind: true;
          label: true;
          episode: {
            select: {
              publicId: true;
              title: true;
            };
          };
        };
      };
      repairQueueEntry: {
        select: {
          id: true;
          status: true;
        };
      };
    };
  }>,
): ModerationReportRecord {
  return {
    id: record.id,
    publicId: record.publicId,
    kind: unmapModerationReportKind(record.kind),
    status: unmapModerationReportStatus(record.status),
    title: record.title,
    summary: record.summary,
    detail: record.detail,
    reporterName: record.reporterName,
    reporterEmail: record.reporterEmail,
    sourceUrl: record.sourceUrl,
    mediaId: record.mediaId,
    mediaPublicId: record.media?.publicId ?? null,
    mediaTitle: record.media?.title ?? null,
    mediaSlug: record.media?.slug ?? null,
    resourceId: record.resourceId,
    resourcePublicId: record.resource?.publicId ?? null,
    resourceLabel: record.resource?.label ?? null,
    resourceKind: unmapResourceKind(record.resource?.kind),
    episodePublicId: record.resource?.episode?.publicId ?? null,
    episodeTitle: record.resource?.episode?.title ?? null,
    repairQueueEntryId: record.repairQueueEntryId,
    repairQueueStatus: unmapRepairQueueStatus(record.repairQueueEntry?.status),
    latestActionSummary: record.latestActionSummary,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    queuedAt: record.queuedAt,
    resolvedAt: record.resolvedAt,
    dismissedAt: record.dismissedAt,
  };
}

function mapModerationReportActionRecord(
  record: Prisma.ModerationReportActionGetPayload<Record<string, never>>,
): ModerationReportActionRecord {
  return {
    id: record.id,
    reportId: record.reportId,
    actorId: record.actorId,
    actionType: unmapModerationReportActionType(record.actionType),
    summary: record.summary,
    notes: record.notes,
    statusAfter: record.statusAfter ? unmapModerationReportStatus(record.statusAfter) : null,
    linkedRepairQueueEntryId: record.repairQueueEntryId,
    createdAt: record.createdAt,
  };
}

function mapManualTitleSubmissionRecord(
  record: Prisma.ManualTitleSubmissionGetPayload<{
    include: {
      canonicalMedia: {
        select: {
          id: true;
          publicId: true;
          title: true;
        };
      };
    };
  }>,
): ManualTitleSubmissionRecord {
  return {
    id: record.id,
    publicId: record.publicId,
    status: unmapManualSubmissionStatus(record.status),
    title: record.title,
    originalTitle: record.originalTitle,
    typeHint: unmapManualTitleTypeHint(record.typeHint),
    releaseYear: record.releaseYear,
    originCountry: record.originCountry,
    language: record.language,
    summary: record.summary,
    notes: record.notes,
    sourceUrl: record.sourceUrl,
    canonicalMediaId: record.canonicalMediaId,
    canonicalMediaPublicId: record.canonicalMedia?.publicId ?? null,
    canonicalMediaTitle: record.canonicalMedia?.title ?? null,
    reviewQueueEntryId: record.reviewQueueEntryId,
    submittedByName: record.submittedByName,
    submittedByEmail: record.submittedByEmail,
    latestActionSummary: record.latestActionSummary,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    reviewedAt: record.reviewedAt,
  };
}

function mapManualTitleSubmissionActionRecord(
  record: Prisma.ManualTitleSubmissionActionGetPayload<Record<string, never>>,
): ManualTitleSubmissionActionRecord {
  return {
    id: record.id,
    submissionId: record.submissionId,
    actorId: record.actorId,
    actionType: unmapManualSubmissionActionType(record.actionType),
    summary: record.summary,
    notes: record.notes,
    statusAfter: record.statusAfter ? unmapManualSubmissionStatus(record.statusAfter) : null,
    createdAt: record.createdAt,
  };
}

const moderationReportListInclude = {
  media: {
    select: {
      id: true,
      publicId: true,
      title: true,
      slug: true,
    },
  },
  resource: {
    select: {
      id: true,
      publicId: true,
      kind: true,
      label: true,
      episode: {
        select: {
          publicId: true,
          title: true,
        },
      },
    },
  },
  repairQueueEntry: {
    select: {
      id: true,
      status: true,
    },
  },
} satisfies Prisma.ModerationReportInclude;

const moderationReportDetailInclude = {
  ...moderationReportListInclude,
  actions: {
    orderBy: {
      createdAt: "desc",
    },
  },
} satisfies Prisma.ModerationReportInclude;

const manualTitleSubmissionListInclude = {
  canonicalMedia: {
    select: {
      id: true,
      publicId: true,
      title: true,
    },
  },
} satisfies Prisma.ManualTitleSubmissionInclude;

const manualTitleSubmissionDetailInclude = {
  ...manualTitleSubmissionListInclude,
  actions: {
    orderBy: {
      createdAt: "desc",
    },
  },
} satisfies Prisma.ManualTitleSubmissionInclude;

type ModerationReportDetailPayload = Prisma.ModerationReportGetPayload<{
  include: typeof moderationReportDetailInclude;
}>;

type ManualTitleSubmissionDetailPayload = Prisma.ManualTitleSubmissionGetPayload<{
  include: typeof manualTitleSubmissionDetailInclude;
}>;

function mapModerationReportDetailRecord(record: ModerationReportDetailPayload): ModerationReportDetailRecord {
  return {
    report: mapModerationReportRecord(record),
    actions: record.actions.map((action) => mapModerationReportActionRecord(action)),
  };
}

function mapManualTitleSubmissionDetailRecord(
  record: ManualTitleSubmissionDetailPayload,
): ManualTitleSubmissionDetailRecord {
  return {
    submission: mapManualTitleSubmissionRecord(record),
    actions: record.actions.map((action) => mapManualTitleSubmissionActionRecord(action)),
  };
}

const reviewQueueDetailInclude = {
  normalizedCandidate: {
    include: {
      aliases: { orderBy: [{ source: "asc" }, { comparableValue: "asc" }] },
      matchSuggestions: { orderBy: [{ confidence: "desc" }, { createdAt: "desc" }] },
      duplicateSignals: { orderBy: [{ confidence: "desc" }, { createdAt: "desc" }] },
      stagingCandidate: {
        include: {
          ingestRun: {
            select: {
              requestId: true,
              actorId: true,
              mode: true,
              scope: true,
              startedAt: true,
              finishedAt: true,
            },
          },
        },
      },
    },
  },
  decisions: {
    orderBy: { createdAt: "desc" },
  },
  publishOperations: {
    orderBy: { createdAt: "desc" },
  },
  audits: {
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.ReviewQueueEntryInclude;

type ReviewQueueDetailPayload = Prisma.ReviewQueueEntryGetPayload<{
  include: typeof reviewQueueDetailInclude;
}>;

function mapReviewQueueDetailRecord(record: ReviewQueueDetailPayload): ReviewQueueDetailRecord {
  return {
    queueEntry: mapQueueEntryRecord(record),
    candidate: mapNormalizedCandidateRecord(record.normalizedCandidate),
    aliases: record.normalizedCandidate.aliases.map((alias) => mapAliasRecord(alias)),
    matchSuggestions: record.normalizedCandidate.matchSuggestions.map((suggestion) => mapMatchSuggestionRecord(suggestion)),
    duplicateSignals: record.normalizedCandidate.duplicateSignals.map((signal) => mapDuplicateSignalRecord(signal)),
    decisions: record.decisions.map((decision) => mapReviewDecisionRecord(decision)),
    publishOperations: record.publishOperations.map((operation) => mapPublishOperationRecord(operation)),
    audits: record.audits.map((audit) => mapPublishAuditRecord(audit)),
  };
}

export class ReviewWorkflowRepository extends BaseRepository implements ReviewWorkflowRepositoryContract {
  public constructor(context: RepositoryContext) {
    super(context);
  }

  async upsertReviewQueueEntry(input: ReviewQueueEntryUpsertInput): Promise<PersistedReviewQueueEntryRecord> {
    const record = await this.db.reviewQueueEntry.upsert({
      where: {
        normalizedCandidateId: input.normalizedCandidateId,
      },
      create: {
        normalizedCandidateId: input.normalizedCandidateId,
        assignedReviewerId: input.assignedReviewerId,
        queuedAt: toDate(input.queuedAt),
      },
      update: {
        assignedReviewerId: input.assignedReviewerId,
      },
    });

    return mapQueueEntryRecord(record);
  }

  async updateReviewQueueEntry(
    queueEntryId: string,
    input: ReviewQueueEntryUpdateInput,
  ): Promise<PersistedReviewQueueEntryRecord> {
    const record = await this.db.reviewQueueEntry.update({
      where: {
        id: queueEntryId,
      },
      data: {
        status: mapReviewQueueStatus(input.status),
        assignedReviewerId: input.assignedReviewerId,
        startedAt: toDate(input.startedAt),
        reviewedAt: toDate(input.reviewedAt),
        latestDecisionType: input.latestDecisionType ? mapReviewDecisionType(input.latestDecisionType) : undefined,
        latestDecisionSummary: input.latestDecisionSummary,
        canonicalMediaId: input.canonicalMediaId,
        scheduledPublishAt:
          input.scheduledPublishAt === undefined
            ? undefined
            : input.scheduledPublishAt === null
              ? null
              : toDate(input.scheduledPublishAt),
      },
    });

    return mapQueueEntryRecord(record);
  }

  async createReviewDecision(input: ReviewDecisionCreateInput): Promise<PersistedReviewDecisionRecord> {
    const record = await this.db.reviewDecision.create({
      data: {
        queueEntryId: input.queueEntryId,
        normalizedCandidateId: input.normalizedCandidateId,
        decisionType: mapReviewDecisionType(input.decisionType),
        actorId: input.actorId,
        targetCanonicalMediaId: input.targetCanonicalMediaId,
        notes: input.notes,
        createdAt: toDate(input.createdAt),
      },
    });

    return mapReviewDecisionRecord(record);
  }

  async createPublishOperation(input: PublishOperationCreateInput): Promise<PersistedPublishOperationRecord> {
    const record = await this.db.publishOperation.create({
      data: {
        queueEntryId: input.queueEntryId,
        reviewDecisionId: input.reviewDecisionId,
        normalizedCandidateId: input.normalizedCandidateId,
        actorId: input.actorId,
        operationType: mapPublishOperationType(input.operationType),
        status: mapPublishOperationStatus(input.status ?? "pending"),
        targetCanonicalMediaId: input.targetCanonicalMediaId,
        operationSummary: input.operationSummary,
        startedAt: toDate(input.startedAt),
      },
    });

    return mapPublishOperationRecord(record);
  }

  async updatePublishOperation(
    operationId: string,
    input: PublishOperationUpdateInput,
  ): Promise<PersistedPublishOperationRecord> {
    const record = await this.db.publishOperation.update({
      where: {
        id: operationId,
      },
      data: {
        status: mapPublishOperationStatus(input.status),
        resultingCanonicalMediaId: input.resultingCanonicalMediaId,
        operationSummary: input.operationSummary,
        failureSummary: input.failureSummary,
        completedAt: toDate(input.completedAt),
      },
    });

    return mapPublishOperationRecord(record);
  }

  async createPublishAudit(input: PublishAuditCreateInput): Promise<PersistedPublishAuditRecord> {
    const record = await this.db.publishAuditRecord.create({
      data: {
        queueEntryId: input.queueEntryId,
        reviewDecisionId: input.reviewDecisionId,
        publishOperationId: input.publishOperationId,
        normalizedCandidateId: input.normalizedCandidateId,
        actorId: input.actorId,
        action: mapPublishAuditAction(input.action),
        actionSummary: input.actionSummary,
        targetCanonicalMediaId: input.targetCanonicalMediaId,
        metadata: toJsonValue(input.metadata),
        createdAt: toDate(input.createdAt),
      },
    });

    return mapPublishAuditRecord(record);
  }

  async listReviewQueue(): Promise<ReviewQueueListItemRecord[]> {
    const records = await this.db.reviewQueueEntry.findMany({
      include: {
        normalizedCandidate: {
          include: {
            aliases: true,
            matchSuggestions: true,
            duplicateSignals: true,
            stagingCandidate: {
              include: {
                ingestRun: {
                  select: {
                    requestId: true,
                    actorId: true,
                    mode: true,
                    scope: true,
                    startedAt: true,
                    finishedAt: true,
                  },
                },
              },
            },
          },
        },
        publishOperations: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ queuedAt: "asc" }],
    });

    return records.map((record) => ({
      queueEntry: mapQueueEntryRecord(record),
      candidate: mapNormalizedCandidateRecord(record.normalizedCandidate),
      aliasCount: record.normalizedCandidate.aliases.length,
      matchSuggestionCount: record.normalizedCandidate.matchSuggestions.length,
      duplicateSignalCount: record.normalizedCandidate.duplicateSignals.length,
      latestPublishOperation: record.publishOperations[0] ? mapPublishOperationRecord(record.publishOperations[0]) : null,
    }));
  }

  async getReviewQueueDetail(queueEntryId: string): Promise<ReviewQueueDetailRecord | null> {
    const record = await this.db.reviewQueueEntry.findUnique({
      where: {
        id: queueEntryId,
      },
      include: reviewQueueDetailInclude,
    });

    return record ? mapReviewQueueDetailRecord(record) : null;
  }

  async getReviewDecisionDetail(reviewDecisionId: string): Promise<ReviewDecisionDetailRecord | null> {
    const decision = await this.db.reviewDecision.findUnique({
      where: {
        id: reviewDecisionId,
      },
      include: {
        queueEntry: {
          include: reviewQueueDetailInclude,
        },
      },
    });

    if (!decision) {
      return null;
    }

    return {
      queueEntry: mapQueueEntryRecord(decision.queueEntry),
      decision: mapReviewDecisionRecord(decision),
      candidate: mapNormalizedCandidateRecord(decision.queueEntry.normalizedCandidate),
      aliases: decision.queueEntry.normalizedCandidate.aliases.map((alias) => mapAliasRecord(alias)),
      matchSuggestions: decision.queueEntry.normalizedCandidate.matchSuggestions.map((suggestion) =>
        mapMatchSuggestionRecord(suggestion),
      ),
      duplicateSignals: decision.queueEntry.normalizedCandidate.duplicateSignals.map((signal) => mapDuplicateSignalRecord(signal)),
    };
  }

  async createModerationReport(input: CreateModerationReportInput): Promise<ModerationReportRecord> {
    const record = await this.db.moderationReport.create({
      data: {
        publicId: `modr_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
        kind: mapModerationReportKind(input.kind),
        status: "OPEN",
        mediaId: input.mediaId,
        resourceId: input.resourceId,
        title: input.title,
        summary: input.summary,
        detail: input.detail,
        reporterName: input.reporterName,
        reporterEmail: input.reporterEmail,
        sourceUrl: input.sourceUrl,
        evidence: toJsonValue(input.evidence),
      },
      include: moderationReportListInclude,
    });

    return mapModerationReportRecord(record);
  }

  async updateModerationReportStatus(
    publicId: string,
    input: ModerationReportStatusUpdateInput,
  ): Promise<ModerationReportRecord> {
    const resolvedAt = input.status === "resolved" ? new Date() : input.status === "dismissed" ? null : undefined;
    const dismissedAt = input.status === "dismissed" ? new Date() : input.status === "resolved" ? null : undefined;
    const record = await this.db.moderationReport.update({
      where: {
        publicId,
      },
      data: {
        status: mapModerationReportStatus(input.status),
        repairQueueEntryId: input.linkedRepairQueueEntryId,
        latestActionSummary: input.notes?.trim() || undefined,
        resolvedAt,
        dismissedAt,
      },
      include: moderationReportListInclude,
    });

    return mapModerationReportRecord(record);
  }

  async createModerationReportAction(input: ModerationReportActionCreateInput): Promise<ModerationReportActionRecord> {
    const record = await this.db.moderationReportAction.create({
      data: {
        reportId: input.reportId,
        actorId: input.actorId,
        actionType: mapModerationReportActionType(input.actionType),
        summary: input.summary,
        notes: input.notes,
        statusAfter: input.statusAfter ? mapModerationReportStatus(input.statusAfter) : undefined,
        repairQueueEntryId: input.linkedRepairQueueEntryId,
        metadata: toJsonValue(input.metadata),
        createdAt: toDate(input.createdAt),
      },
    });

    return mapModerationReportActionRecord(record);
  }

  async listModerationReports(query: ModerationReportQuery = {}): Promise<ModerationReportRecord[]> {
    const search = query.q?.trim();
    const records = await this.db.moderationReport.findMany({
      where: {
        kind: query.kinds?.length
          ? {
              in: query.kinds.map((kind) => mapModerationReportKind(kind)),
            }
          : undefined,
        status: query.statuses?.length
          ? {
              in: query.statuses.map((status) => mapModerationReportStatus(status)),
            }
          : undefined,
        resource: query.resourcePublicId
          ? {
              publicId: query.resourcePublicId,
            }
          : undefined,
        media: query.mediaPublicId
          ? {
              publicId: query.mediaPublicId,
            }
          : undefined,
        OR: search
          ? [
              { title: { contains: search, mode: "insensitive" } },
              { summary: { contains: search, mode: "insensitive" } },
              { detail: { contains: search, mode: "insensitive" } },
              { media: { title: { contains: search, mode: "insensitive" } } },
              { resource: { label: { contains: search, mode: "insensitive" } } },
            ]
          : undefined,
      },
      include: moderationReportListInclude,
      orderBy: [{ queuedAt: "desc" }, { createdAt: "desc" }],
    });

    return records.map((record) => mapModerationReportRecord(record));
  }

  async getModerationReportDetailByPublicId(publicId: string): Promise<ModerationReportDetailRecord | null> {
    const record = await this.db.moderationReport.findUnique({
      where: {
        publicId,
      },
      include: moderationReportDetailInclude,
    });

    return record ? mapModerationReportDetailRecord(record) : null;
  }

  async createManualTitleSubmission(input: CreateManualTitleSubmissionInput): Promise<ManualTitleSubmissionRecord> {
    const record = await this.db.manualTitleSubmission.create({
      data: {
        publicId: `mts_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
        status: "SUBMITTED",
        title: input.title,
        originalTitle: input.originalTitle,
        typeHint: mapManualTitleTypeHint(input.typeHint ?? "unknown"),
        releaseYear: input.releaseYear,
        originCountry: input.originCountry,
        language: input.language,
        summary: input.summary,
        notes: input.notes,
        sourceUrl: input.sourceUrl,
        submittedByName: input.submittedByName,
        submittedByEmail: input.submittedByEmail,
        latestActionSummary: "Manual title submission created.",
      },
      include: manualTitleSubmissionListInclude,
    });

    return mapManualTitleSubmissionRecord(record);
  }

  async updateManualTitleSubmissionStatus(
    publicId: string,
    input: ManualTitleSubmissionStatusUpdateInput,
  ): Promise<ManualTitleSubmissionRecord> {
    const reviewedAt =
      input.status === "accepted" || input.status === "rejected" || input.status === "needs_followup" ? new Date() : undefined;
    const record = await this.db.manualTitleSubmission.update({
      where: {
        publicId,
      },
      data: {
        status: mapManualSubmissionStatus(input.status),
        canonicalMediaId: input.canonicalMediaId,
        reviewQueueEntryId: input.reviewQueueEntryId,
        latestActionSummary: input.notes?.trim() || undefined,
        reviewedAt,
      },
      include: manualTitleSubmissionListInclude,
    });

    return mapManualTitleSubmissionRecord(record);
  }

  async createManualTitleSubmissionAction(
    input: ManualTitleSubmissionActionCreateInput,
  ): Promise<ManualTitleSubmissionActionRecord> {
    const record = await this.db.manualTitleSubmissionAction.create({
      data: {
        submissionId: input.submissionId,
        actorId: input.actorId,
        actionType: mapManualSubmissionActionType(input.actionType),
        summary: input.summary,
        notes: input.notes,
        statusAfter: input.statusAfter ? mapManualSubmissionStatus(input.statusAfter) : undefined,
        metadata: toJsonValue(input.metadata),
        createdAt: toDate(input.createdAt),
      },
    });

    return mapManualTitleSubmissionActionRecord(record);
  }

  async listManualTitleSubmissions(query: ManualTitleSubmissionQuery = {}): Promise<ManualTitleSubmissionRecord[]> {
    const search = query.q?.trim();
    const records = await this.db.manualTitleSubmission.findMany({
      where: {
        status: query.statuses?.length
          ? {
              in: query.statuses.map((status) => mapManualSubmissionStatus(status)),
            }
          : undefined,
        typeHint: query.typeHints?.length
          ? {
              in: query.typeHints
                .map((typeHint) => mapManualTitleTypeHint(typeHint))
                .filter((value): value is NonNullable<typeof value> => Boolean(value)),
            }
          : undefined,
        OR: search
          ? [
              { title: { contains: search, mode: "insensitive" } },
              { originalTitle: { contains: search, mode: "insensitive" } },
              { summary: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: manualTitleSubmissionListInclude,
      orderBy: [{ createdAt: "desc" }],
    });

    return records.map((record) => mapManualTitleSubmissionRecord(record));
  }

  async getManualTitleSubmissionDetailByPublicId(publicId: string): Promise<ManualTitleSubmissionDetailRecord | null> {
    const record = await this.db.manualTitleSubmission.findUnique({
      where: {
        publicId,
      },
      include: manualTitleSubmissionDetailInclude,
    });

    return record ? mapManualTitleSubmissionDetailRecord(record) : null;
  }
}

export function createReviewWorkflowRepository(context: RepositoryContext) {
  return new ReviewWorkflowRepository(context);
}

export function createDefaultReviewWorkflowRepository() {
  return createReviewWorkflowRepository(createRepositoryContext(requireDb()));
}

export * from "./types";
