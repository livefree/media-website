import "server-only";

import type {
  PersistedCandidateAliasRecord,
  PersistedDuplicateSignalRecord,
  PersistedMatchSuggestionRecord,
  PersistedNormalizedCandidateRecord,
} from "../normalization/types";
import type {
  PublishAuditAction,
  PublishOperationStatus,
  PublishOperationType,
  ReviewDecisionType,
  ReviewQueueStatus,
} from "../../../server/review";

export interface ReviewQueueEntryUpsertInput {
  normalizedCandidateId: string;
  assignedReviewerId?: string;
  actorId?: string;
  requestId?: string;
  queuedAt?: string;
}

export interface ReviewQueueEntryUpdateInput {
  status: ReviewQueueStatus;
  assignedReviewerId?: string;
  startedAt?: string;
  reviewedAt?: string;
  latestDecisionType?: ReviewDecisionType;
  latestDecisionSummary?: string;
  canonicalMediaId?: string;
}

export interface ReviewDecisionCreateInput {
  queueEntryId: string;
  normalizedCandidateId: string;
  decisionType: ReviewDecisionType;
  actorId?: string;
  targetCanonicalMediaId?: string;
  notes?: string;
  createdAt?: string;
}

export interface PublishOperationCreateInput {
  queueEntryId: string;
  reviewDecisionId: string;
  normalizedCandidateId: string;
  actorId?: string;
  operationType: PublishOperationType;
  status?: PublishOperationStatus;
  targetCanonicalMediaId?: string;
  operationSummary?: string;
  startedAt?: string;
}

export interface PublishOperationUpdateInput {
  status: PublishOperationStatus;
  resultingCanonicalMediaId?: string;
  operationSummary?: string;
  failureSummary?: string;
  completedAt?: string;
}

export interface PublishAuditCreateInput {
  queueEntryId?: string;
  reviewDecisionId?: string;
  publishOperationId?: string;
  normalizedCandidateId?: string;
  actorId?: string;
  action: PublishAuditAction;
  actionSummary: string;
  targetCanonicalMediaId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface PersistedReviewQueueEntryRecord {
  id: string;
  normalizedCandidateId: string;
  canonicalMediaId?: string | null;
  status: ReviewQueueStatus;
  assignedReviewerId?: string | null;
  latestDecisionType?: ReviewDecisionType | null;
  latestDecisionSummary?: string | null;
  queuedAt: Date;
  startedAt?: Date | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistedReviewDecisionRecord {
  id: string;
  queueEntryId: string;
  normalizedCandidateId: string;
  decisionType: ReviewDecisionType;
  actorId?: string | null;
  targetCanonicalMediaId?: string | null;
  notes?: string | null;
  createdAt: Date;
}

export interface PersistedPublishOperationRecord {
  id: string;
  queueEntryId: string;
  reviewDecisionId: string;
  normalizedCandidateId: string;
  actorId?: string | null;
  operationType: PublishOperationType;
  status: PublishOperationStatus;
  targetCanonicalMediaId?: string | null;
  resultingCanonicalMediaId?: string | null;
  operationSummary?: string | null;
  failureSummary?: string | null;
  startedAt: Date;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistedPublishAuditRecord {
  id: string;
  queueEntryId?: string | null;
  reviewDecisionId?: string | null;
  publishOperationId?: string | null;
  normalizedCandidateId?: string | null;
  actorId?: string | null;
  action: PublishAuditAction;
  actionSummary: string;
  targetCanonicalMediaId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface ReviewQueueListItemRecord {
  queueEntry: PersistedReviewQueueEntryRecord;
  candidate: PersistedNormalizedCandidateRecord;
  aliasCount: number;
  matchSuggestionCount: number;
  duplicateSignalCount: number;
  latestPublishOperation?: PersistedPublishOperationRecord | null;
}

export interface ReviewQueueDetailRecord {
  queueEntry: PersistedReviewQueueEntryRecord;
  candidate: PersistedNormalizedCandidateRecord;
  aliases: PersistedCandidateAliasRecord[];
  matchSuggestions: PersistedMatchSuggestionRecord[];
  duplicateSignals: PersistedDuplicateSignalRecord[];
  decisions: PersistedReviewDecisionRecord[];
  publishOperations: PersistedPublishOperationRecord[];
  audits: PersistedPublishAuditRecord[];
}

export interface ReviewDecisionDetailRecord {
  queueEntry: PersistedReviewQueueEntryRecord;
  decision: PersistedReviewDecisionRecord;
  candidate: PersistedNormalizedCandidateRecord;
  aliases: PersistedCandidateAliasRecord[];
  matchSuggestions: PersistedMatchSuggestionRecord[];
  duplicateSignals: PersistedDuplicateSignalRecord[];
}

export interface ReviewWorkflowRepository {
  upsertReviewQueueEntry(input: ReviewQueueEntryUpsertInput): Promise<PersistedReviewQueueEntryRecord>;
  updateReviewQueueEntry(queueEntryId: string, input: ReviewQueueEntryUpdateInput): Promise<PersistedReviewQueueEntryRecord>;
  createReviewDecision(input: ReviewDecisionCreateInput): Promise<PersistedReviewDecisionRecord>;
  createPublishOperation(input: PublishOperationCreateInput): Promise<PersistedPublishOperationRecord>;
  updatePublishOperation(operationId: string, input: PublishOperationUpdateInput): Promise<PersistedPublishOperationRecord>;
  createPublishAudit(input: PublishAuditCreateInput): Promise<PersistedPublishAuditRecord>;
  listReviewQueue(): Promise<ReviewQueueListItemRecord[]>;
  getReviewQueueDetail(queueEntryId: string): Promise<ReviewQueueDetailRecord | null>;
  getReviewDecisionDetail(reviewDecisionId: string): Promise<ReviewDecisionDetailRecord | null>;
}
