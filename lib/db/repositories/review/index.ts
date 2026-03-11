import "server-only";

import { Prisma } from "@prisma/client";

import type { RepositoryContext } from "../types";
import { BaseRepository, createRepositoryContext } from "../types";
import { requireDb } from "../../client";

import type { MatchReason, MatchSuggestionKind, NormalizedAliasValue, NormalizedMediaType, NormalizedSeasonEpisodeHints, NormalizedSourceSummary } from "../../../server/normalize";
import type {
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
import type {
  PersistedPublishAuditRecord,
  PersistedPublishOperationRecord,
  PersistedReviewDecisionRecord,
  PersistedReviewQueueEntryRecord,
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
  publish_started: "PUBLISH_STARTED",
  publish_succeeded: "PUBLISH_SUCCEEDED",
  publish_failed: "PUBLISH_FAILED",
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

function unmapNormalizedMediaType(value: keyof typeof normalizedMediaTypeMap): NormalizedMediaType {
  return normalizedMediaTypeMap[value];
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
    case "PUBLISH_STARTED":
      return "publish_started";
    case "PUBLISH_SUCCEEDED":
      return "publish_succeeded";
    case "PUBLISH_FAILED":
      return "publish_failed";
  }

  throw new Error(`Unsupported publish audit action: ${value}`);
}

function mapNormalizedCandidateRecord(
  record: Prisma.NormalizedCandidateGetPayload<Record<string, never>>,
): PersistedNormalizedCandidateRecord {
  return {
    id: record.id,
    stagingCandidateId: record.stagingCandidateId,
    providerId: record.providerId,
    providerItemId: record.providerItemId,
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

const reviewQueueDetailInclude = {
  normalizedCandidate: {
    include: {
      aliases: { orderBy: [{ source: "asc" }, { comparableValue: "asc" }] },
      matchSuggestions: { orderBy: [{ confidence: "desc" }, { createdAt: "desc" }] },
      duplicateSignals: { orderBy: [{ confidence: "desc" }, { createdAt: "desc" }] },
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
}

export function createReviewWorkflowRepository(context: RepositoryContext) {
  return new ReviewWorkflowRepository(context);
}

export function createDefaultReviewWorkflowRepository() {
  return createReviewWorkflowRepository(createRepositoryContext(requireDb()));
}

export * from "./types";
