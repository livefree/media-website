import "server-only";

import type {
  DuplicateSignalDraft,
  MatchReason,
  MatchSuggestionDraft,
  MatchSuggestionKind,
  MatchTargetRecord,
  NormalizedCandidateDraft,
} from "./types";

function toComparableTokens(value: string): string[] {
  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function tokenOverlap(a: string, b: string): number {
  const aTokens = new Set(toComparableTokens(a));
  const bTokens = new Set(toComparableTokens(b));

  if (aTokens.size === 0 || bTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(aTokens.size, bTokens.size);
}

function buildCandidateKeys(candidate: NormalizedCandidateDraft): string[] {
  return [
    candidate.title.comparable,
    ...(candidate.originalTitle ? [candidate.originalTitle.comparable] : []),
    ...candidate.aliases.map((alias) => alias.comparable),
  ].filter(Boolean);
}

function buildTargetKeys(target: MatchTargetRecord): string[] {
  return [
    target.title,
    ...(target.originalTitle ? [target.originalTitle] : []),
    ...(target.aliases ?? []),
  ]
    .map((value) =>
      value
        .normalize("NFKC")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function classifySuggestion(confidence: number): MatchSuggestionKind {
  if (confidence >= 0.92) {
    return "exact";
  }
  if (confidence >= 0.72) {
    return "probable";
  }
  if (confidence >= 0.45) {
    return "ambiguous";
  }
  return "none";
}

export function buildMatchSuggestion(
  candidate: NormalizedCandidateDraft,
  target: MatchTargetRecord,
): MatchSuggestionDraft {
  const candidateKeys = buildCandidateKeys(candidate);
  const targetKeys = buildTargetKeys(target);
  const reasons: MatchReason[] = [];
  let score = 0;

  if (candidateKeys.some((key) => targetKeys.includes(key))) {
    reasons.push({ code: "title_exact", weight: 0.55, detail: "Primary or alias title matches exactly." });
    score += 0.55;
  } else if (candidate.aliases.some((alias) => targetKeys.includes(alias.comparable))) {
    reasons.push({ code: "title_alias_overlap", weight: 0.35, detail: "Candidate aliases overlap the target." });
    score += 0.35;
  } else {
    const overlap = Math.max(
      ...candidateKeys.flatMap((candidateKey) => targetKeys.map((targetKey) => tokenOverlap(candidateKey, targetKey))),
      0,
    );

    if (overlap >= 0.5) {
      const weighted = overlap >= 0.8 ? 0.3 : 0.18;
      reasons.push({
        code: "title_token_overlap",
        weight: weighted,
        detail: `Title token overlap measured at ${overlap.toFixed(2)}.`,
      });
      score += weighted;
    }
  }

  if (candidate.releaseYear && target.releaseYear) {
    if (candidate.releaseYear === target.releaseYear) {
      reasons.push({ code: "year_exact", weight: 0.2, detail: "Release year matches exactly." });
      score += 0.2;
    } else if (Math.abs(candidate.releaseYear - target.releaseYear) <= 1) {
      reasons.push({ code: "year_nearby", weight: 0.1, detail: "Release year is within one year." });
      score += 0.1;
    }
  }

  if (target.mediaType && candidate.mediaType === target.mediaType) {
    reasons.push({ code: "type_match", weight: 0.1, detail: "Media type aligns." });
    score += 0.1;
  }

  if (candidate.region && target.region && candidate.region === target.region) {
    reasons.push({ code: "region_match", weight: 0.03, detail: "Region aligns." });
    score += 0.03;
  }

  if (candidate.language && target.language && candidate.language === target.language) {
    reasons.push({ code: "language_match", weight: 0.02, detail: "Language aligns." });
    score += 0.02;
  }

  const confidence = clampConfidence(score);

  return {
    sourceCandidateId: candidate.stagingCandidateId,
    targetId: target.id,
    targetSource: target.source,
    kind: classifySuggestion(confidence),
    confidence,
    reasons,
  };
}

export function buildDuplicateSignals(candidates: NormalizedCandidateDraft[]): DuplicateSignalDraft[] {
  const signals: DuplicateSignalDraft[] = [];

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const source = candidates[i];
      const target = candidates[j];
      const suggestion = buildMatchSuggestion(source, {
        id: target.stagingCandidateId,
        source: "normalized_candidate",
        title: target.title.display,
        originalTitle: target.originalTitle?.display,
        aliases: target.aliases.map((alias) => alias.display),
        releaseYear: target.releaseYear,
        mediaType: target.mediaType,
        region: target.region,
        language: target.language,
      });

      if (suggestion.kind === "none") {
        continue;
      }

      signals.push({
        sourceCandidateId: source.stagingCandidateId,
        targetId: target.stagingCandidateId,
        kind: "candidate_candidate",
        confidence: suggestion.confidence,
        reasons: suggestion.reasons,
      });
    }
  }

  return signals;
}
