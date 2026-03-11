import "server-only";

import type { ProviderContentTypeHint, StagingSourceFragment } from "../provider";

export const normalizedMediaTypes = ["movie", "series", "anime", "variety", "documentary", "special", "unknown"] as const;

export type NormalizedMediaType = (typeof normalizedMediaTypes)[number];

export const matchSuggestionKinds = ["exact", "probable", "ambiguous", "none"] as const;

export type MatchSuggestionKind = (typeof matchSuggestionKinds)[number];

export const duplicateSignalKinds = ["candidate_candidate", "candidate_canonical"] as const;

export type DuplicateSignalKind = (typeof duplicateSignalKinds)[number];

export interface StagingNormalizationRecord {
  stagingCandidateId: string;
  providerId: string;
  providerKey?: string;
  providerItemId: string;
  title: string;
  originalTitle?: string | null;
  summary?: string | null;
  releaseYear?: number | null;
  region?: string | null;
  language?: string | null;
  rawCategory?: string | null;
  rawEpisodeText?: string | null;
  typeHint: ProviderContentTypeHint;
  sourceFragments: StagingSourceFragment[];
  warnings?: string[];
  providerUpdatedAt?: string | Date | null;
}

export interface NormalizedTextValue {
  display: string;
  comparable: string;
}

export interface NormalizedAliasValue extends NormalizedTextValue {
  source: "title" | "original_title" | "derived";
}

export interface NormalizedSeasonEpisodeHints {
  isEpisodic: boolean;
  seasonNumbers: number[];
  episodeNumbers: number[];
  totalEpisodeCount?: number;
  latestEpisodeNumber?: number;
  notes: string[];
}

export interface NormalizedSourceSummary {
  fragmentCount: number;
  streamCount: number;
  downloadCount: number;
  subtitleCount: number;
  languages: string[];
  qualities: string[];
  providerLineKeys: string[];
}

export interface NormalizedCandidateDraft {
  stagingCandidateId: string;
  providerId: string;
  providerItemId: string;
  title: NormalizedTextValue;
  originalTitle?: NormalizedTextValue;
  aliases: NormalizedAliasValue[];
  summary?: string | null;
  mediaType: NormalizedMediaType;
  releaseYear?: number;
  region?: string;
  language?: string;
  seasonEpisodeHints: NormalizedSeasonEpisodeHints;
  sourceSummary: NormalizedSourceSummary;
  warnings: string[];
  evidence: {
    rawCategory?: string | null;
    rawEpisodeText?: string | null;
    sourceFragmentCount: number;
  };
}

export interface MatchTargetRecord {
  id: string;
  source: "canonical" | "normalized_candidate";
  title: string;
  originalTitle?: string | null;
  aliases?: string[];
  releaseYear?: number | null;
  mediaType?: NormalizedMediaType;
  region?: string | null;
  language?: string | null;
}

export interface MatchReason {
  code:
    | "title_exact"
    | "title_alias_overlap"
    | "title_token_overlap"
    | "year_exact"
    | "year_nearby"
    | "type_match"
    | "region_match"
    | "language_match";
  weight: number;
  detail: string;
}

export interface MatchSuggestionDraft {
  sourceCandidateId: string;
  targetId: string;
  targetSource: MatchTargetRecord["source"];
  kind: MatchSuggestionKind;
  confidence: number;
  reasons: MatchReason[];
}

export interface DuplicateSignalDraft {
  sourceCandidateId: string;
  targetId: string;
  kind: DuplicateSignalKind;
  confidence: number;
  reasons: MatchReason[];
}

export interface NormalizationBatchResult {
  normalizedCandidates: NormalizedCandidateDraft[];
  canonicalMatchSuggestions: MatchSuggestionDraft[];
  duplicateSignals: DuplicateSignalDraft[];
}
