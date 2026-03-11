import "server-only";

import { buildNormalizedCandidateDraft } from "./input";
import { buildDuplicateSignals, buildMatchSuggestion } from "./match";

import type { MatchTargetRecord, NormalizationBatchResult, StagingNormalizationRecord } from "./types";

export function normalizeStagingRecord(record: StagingNormalizationRecord) {
  return buildNormalizedCandidateDraft(record);
}

export function runNormalizationBatch(
  records: StagingNormalizationRecord[],
  canonicalTargets: MatchTargetRecord[] = [],
): NormalizationBatchResult {
  const normalizedCandidates = records.map((record) => normalizeStagingRecord(record));
  const canonicalMatchSuggestions = normalizedCandidates.flatMap((candidate) =>
    canonicalTargets
      .map((target) => buildMatchSuggestion(candidate, target))
      .filter((suggestion) => suggestion.kind !== "none"),
  );
  const duplicateSignals = buildDuplicateSignals(normalizedCandidates);

  return {
    normalizedCandidates,
    canonicalMatchSuggestions,
    duplicateSignals,
  };
}
