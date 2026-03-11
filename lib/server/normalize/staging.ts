import "server-only";

import type {
  PersistedProviderItemRecord,
  PersistedStagingCandidateRecord,
} from "../../db/repositories/staging/types";
import type { StagingSourceFragment } from "../provider";

import type { StagingNormalizationRecord } from "./types";

export interface StagingNormalizationSourceRecord {
  candidate: PersistedStagingCandidateRecord;
  providerItem: PersistedProviderItemRecord;
  providerKey?: string;
  summary?: string | null;
  releaseYear?: number | null;
  region?: string | null;
  language?: string | null;
  rawCategory?: string | null;
  rawEpisodeText?: string | null;
  sourceFragments?: StagingSourceFragment[];
  warnings?: string[];
  providerUpdatedAt?: string | Date | null;
}

export function buildNormalizationRecordFromStaging(
  source: StagingNormalizationSourceRecord,
): StagingNormalizationRecord {
  return {
    stagingCandidateId: source.candidate.id,
    providerId: source.candidate.providerId,
    providerKey: source.providerKey,
    providerItemId: source.providerItem.externalId,
    title: source.candidate.title,
    originalTitle: source.candidate.originalTitle,
    summary: source.summary,
    releaseYear: source.releaseYear,
    region: source.region,
    language: source.language,
    rawCategory: source.rawCategory,
    rawEpisodeText: source.rawEpisodeText,
    typeHint: source.candidate.typeHint,
    sourceFragments: source.sourceFragments ?? [],
    warnings: source.warnings ?? [],
    providerUpdatedAt: source.providerUpdatedAt ?? source.providerItem.providerUpdatedAt ?? undefined,
  };
}
