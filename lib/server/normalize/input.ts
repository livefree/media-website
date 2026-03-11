import "server-only";

import {
  extractAliasValues,
  mapNormalizedMediaType,
  normalizeLanguage,
  normalizeRegion,
  normalizeSeasonEpisodeHints,
  normalizeTextValue,
  summarizeSourceFragments,
} from "./mappers";

import type { NormalizedCandidateDraft, StagingNormalizationRecord } from "./types";

export function buildNormalizedCandidateDraft(record: StagingNormalizationRecord): NormalizedCandidateDraft {
  const title = normalizeTextValue(record.title);
  const originalTitle = record.originalTitle ? normalizeTextValue(record.originalTitle) : undefined;
  const warnings = [...(record.warnings ?? [])];

  if (!title.display) {
    warnings.push("Missing usable title text after normalization.");
  }

  const mediaType = mapNormalizedMediaType(record.typeHint, record.rawCategory);
  const aliases = extractAliasValues(record.title, record.originalTitle);
  const seasonEpisodeHints = normalizeSeasonEpisodeHints(record.rawEpisodeText, record.sourceFragments);
  const sourceSummary = summarizeSourceFragments(record.sourceFragments);

  return {
    stagingCandidateId: record.stagingCandidateId,
    providerId: record.providerId,
    providerItemId: record.providerItemId,
    title,
    originalTitle,
    aliases,
    summary: record.summary ? record.summary.trim() : null,
    mediaType,
    releaseYear: record.releaseYear ?? undefined,
    region: normalizeRegion(record.region),
    language: normalizeLanguage(record.language),
    seasonEpisodeHints,
    sourceSummary,
    warnings,
    evidence: {
      rawCategory: record.rawCategory,
      rawEpisodeText: record.rawEpisodeText,
      sourceFragmentCount: record.sourceFragments.length,
    },
  };
}
