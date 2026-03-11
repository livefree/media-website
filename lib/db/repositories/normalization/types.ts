import "server-only";

import type {
  DuplicateSignalDraft,
  DuplicateSignalKind,
  MatchReason,
  MatchSuggestionDraft,
  MatchSuggestionKind,
  NormalizedAliasValue,
  NormalizedCandidateDraft,
  NormalizedMediaType,
  NormalizedSeasonEpisodeHints,
  NormalizedSourceSummary,
  NormalizedTextValue,
} from "../../../server/normalize";

export const normalizedCandidatePersistenceStatuses = ["normalized", "warning", "failed"] as const;
export type NormalizedCandidatePersistenceStatus = (typeof normalizedCandidatePersistenceStatuses)[number];

export const normalizationMatchTargetSources = ["canonical", "normalized_candidate"] as const;
export type NormalizationMatchTargetSource = (typeof normalizationMatchTargetSources)[number];

export const duplicateSignalPersistenceStatuses = ["active", "superseded"] as const;
export type DuplicateSignalPersistenceStatus = (typeof duplicateSignalPersistenceStatuses)[number];

export interface PersistNormalizationBatchInput {
  normalizedCandidates: NormalizedCandidateDraft[];
  matchSuggestions: MatchSuggestionDraft[];
  duplicateSignals: DuplicateSignalDraft[];
}

export interface PersistedCandidateAliasRecord {
  id: string;
  normalizedCandidateId: string;
  source: NormalizedAliasValue["source"];
  displayValue: string;
  comparableValue: string;
  note?: string | null;
  createdAt: Date;
}

export interface PersistedNormalizedCandidateRecord {
  id: string;
  stagingCandidateId: string;
  providerId: string;
  providerItemId: string;
  status: NormalizedCandidatePersistenceStatus;
  title: NormalizedTextValue;
  originalTitle?: NormalizedTextValue | null;
  summary?: string | null;
  mediaType: NormalizedMediaType;
  releaseYear?: number | null;
  region?: string | null;
  language?: string | null;
  seasonEpisodeHints?: NormalizedSeasonEpisodeHints | null;
  sourceSummary?: NormalizedSourceSummary | null;
  evidence?: NormalizedCandidateDraft["evidence"] | null;
  warnings: string[];
  normalizationNotes: string[];
  failureSummary?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistedMatchSuggestionRecord {
  id: string;
  normalizedCandidateId: string;
  targetSource: NormalizationMatchTargetSource;
  targetCanonicalMediaId?: string | null;
  targetNormalizedCandidateId?: string | null;
  kind: MatchSuggestionKind;
  confidence: number;
  reasons: MatchReason[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistedDuplicateSignalRecord {
  id: string;
  sourceNormalizedCandidateId: string;
  targetSource: NormalizationMatchTargetSource;
  targetCanonicalMediaId?: string | null;
  targetNormalizedCandidateId?: string | null;
  kind: DuplicateSignalKind;
  status: DuplicateSignalPersistenceStatus;
  confidence: number;
  reasons: MatchReason[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistNormalizationBatchResult {
  candidates: PersistedNormalizedCandidateRecord[];
  aliases: PersistedCandidateAliasRecord[];
  matchSuggestions: PersistedMatchSuggestionRecord[];
  duplicateSignals: PersistedDuplicateSignalRecord[];
}

export interface NormalizationPersistenceRepository {
  persistNormalizationBatch(input: PersistNormalizationBatchInput): Promise<PersistNormalizationBatchResult>;
}
