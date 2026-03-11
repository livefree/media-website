import "server-only";

import { Prisma } from "@prisma/client";

import type { RepositoryContext } from "../types";
import { BaseRepository, createRepositoryContext } from "../types";
import { requireDb } from "../../client";

import type {
  MatchReason,
  MatchSuggestionKind,
  NormalizedAliasValue,
  NormalizedCandidateDraft,
  NormalizedMediaType,
  NormalizedSeasonEpisodeHints,
  NormalizedSourceSummary,
} from "../../../server/normalize";
import type {
  DuplicateSignalPersistenceStatus,
  NormalizationMatchTargetSource,
  NormalizationPersistenceRepository as NormalizationPersistenceRepositoryContract,
  NormalizedCandidatePersistenceStatus,
  PersistNormalizationBatchInput,
  PersistNormalizationBatchResult,
  PersistedCandidateAliasRecord,
  PersistedDuplicateSignalRecord,
  PersistedMatchSuggestionRecord,
  PersistedNormalizedCandidateRecord,
} from "./types";

const normalizedMediaTypeMap = {
  movie: "MOVIE",
  series: "SERIES",
  anime: "ANIME",
  variety: "VARIETY",
  documentary: "DOCUMENTARY",
  special: "SPECIAL",
  unknown: "UNKNOWN",
} as const;

const normalizedCandidateStatusMap = {
  normalized: "NORMALIZED",
  warning: "WARNING",
  failed: "FAILED",
} as const;

const candidateAliasSourceMap = {
  title: "TITLE",
  original_title: "ORIGINAL_TITLE",
  derived: "DERIVED",
} as const;

const matchTargetSourceMap = {
  canonical: "CANONICAL",
  normalized_candidate: "NORMALIZED_CANDIDATE",
} as const;

const matchSuggestionKindMap = {
  exact: "EXACT",
  probable: "PROBABLE",
  ambiguous: "AMBIGUOUS",
  none: "NONE",
} as const;

const duplicateSignalKindMap = {
  candidate_candidate: "CANDIDATE_CANDIDATE",
  candidate_canonical: "CANDIDATE_CANONICAL",
} as const;

const duplicateSignalStatusMap = {
  active: "ACTIVE",
  superseded: "SUPERSEDED",
} as const;

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

function mapNormalizedMediaType(value: NormalizedMediaType) {
  return normalizedMediaTypeMap[value];
}

function mapNormalizedCandidateStatus(value: NormalizedCandidatePersistenceStatus) {
  return normalizedCandidateStatusMap[value];
}

function mapCandidateAliasSource(value: NormalizedAliasValue["source"]) {
  return candidateAliasSourceMap[value];
}

function mapMatchTargetSource(value: NormalizationMatchTargetSource) {
  return matchTargetSourceMap[value];
}

function mapMatchSuggestionKind(value: MatchSuggestionKind) {
  return matchSuggestionKindMap[value];
}

function mapDuplicateSignalKind(value: PersistedDuplicateSignalRecord["kind"]) {
  return duplicateSignalKindMap[value];
}

function mapDuplicateSignalStatus(value: DuplicateSignalPersistenceStatus) {
  return duplicateSignalStatusMap[value];
}

function unmapNormalizedMediaType(value: string): NormalizedMediaType {
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
    case "UNKNOWN":
      return "unknown";
  }

  throw new Error(`Unsupported normalized media type: ${value}`);
}

function unmapNormalizedCandidateStatus(value: string): NormalizedCandidatePersistenceStatus {
  switch (value) {
    case "NORMALIZED":
      return "normalized";
    case "WARNING":
      return "warning";
    case "FAILED":
      return "failed";
  }

  throw new Error(`Unsupported normalized candidate status: ${value}`);
}

function unmapCandidateAliasSource(value: string): NormalizedAliasValue["source"] {
  switch (value) {
    case "TITLE":
      return "title";
    case "ORIGINAL_TITLE":
      return "original_title";
    case "DERIVED":
      return "derived";
  }

  throw new Error(`Unsupported candidate alias source: ${value}`);
}

function unmapMatchTargetSource(value: string): NormalizationMatchTargetSource {
  switch (value) {
    case "CANONICAL":
      return "canonical";
    case "NORMALIZED_CANDIDATE":
      return "normalized_candidate";
  }

  throw new Error(`Unsupported match target source: ${value}`);
}

function unmapMatchSuggestionKind(value: string): MatchSuggestionKind {
  switch (value) {
    case "EXACT":
      return "exact";
    case "PROBABLE":
      return "probable";
    case "AMBIGUOUS":
      return "ambiguous";
    case "NONE":
      return "none";
  }

  throw new Error(`Unsupported match suggestion kind: ${value}`);
}

function unmapDuplicateSignalKind(value: string): PersistedDuplicateSignalRecord["kind"] {
  switch (value) {
    case "CANDIDATE_CANDIDATE":
      return "candidate_candidate";
    case "CANDIDATE_CANONICAL":
      return "candidate_canonical";
  }

  throw new Error(`Unsupported duplicate signal kind: ${value}`);
}

function unmapDuplicateSignalStatus(value: string): DuplicateSignalPersistenceStatus {
  switch (value) {
    case "ACTIVE":
      return "active";
    case "SUPERSEDED":
      return "superseded";
  }

  throw new Error(`Unsupported duplicate signal status: ${value}`);
}

function deriveNormalizedCandidateState(
  candidate: NormalizedCandidateDraft,
): Pick<PersistedNormalizedCandidateRecord, "status" | "failureSummary" | "normalizationNotes"> {
  const normalizationNotes = Array.from(new Set(candidate.seasonEpisodeHints.notes.filter(Boolean)));

  if (!candidate.title.display || !candidate.title.comparable) {
    return {
      status: "failed",
      failureSummary: "Missing usable normalized title after cleanup.",
      normalizationNotes,
    };
  }

  if (candidate.warnings.length > 0) {
    return {
      status: "warning",
      failureSummary: null,
      normalizationNotes,
    };
  }

  return {
    status: "normalized",
    failureSummary: null,
    normalizationNotes,
  };
}

function dedupeAliases(aliases: NormalizedAliasValue[]): NormalizedAliasValue[] {
  const seen = new Set<string>();
  const records: NormalizedAliasValue[] = [];

  for (const alias of aliases) {
    const key = `${alias.source}:${alias.comparable}`;

    if (!alias.display || !alias.comparable || seen.has(key)) {
      continue;
    }

    seen.add(key);
    records.push(alias);
  }

  return records;
}

function getDuplicateSignalTargetSource(signal: { kind: PersistedDuplicateSignalRecord["kind"] }): NormalizationMatchTargetSource {
  return signal.kind === "candidate_canonical" ? "canonical" : "normalized_candidate";
}

function mapNormalizedCandidateRecord(
  record: Prisma.NormalizedCandidateGetPayload<Record<string, never>>,
): PersistedNormalizedCandidateRecord {
  return {
    id: record.id,
    stagingCandidateId: record.stagingCandidateId,
    providerId: record.providerId,
    providerItemId: record.providerItemId,
    status: unmapNormalizedCandidateStatus(record.status),
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
    evidence: fromJsonValue<NormalizedCandidateDraft["evidence"]>(record.evidence),
    warnings: record.warnings,
    normalizationNotes: record.normalizationNotes,
    failureSummary: record.failureSummary,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapCandidateAliasRecord(
  record: Prisma.CandidateAliasGetPayload<Record<string, never>>,
): PersistedCandidateAliasRecord {
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

export class NormalizationPersistenceRepository
  extends BaseRepository
  implements NormalizationPersistenceRepositoryContract
{
  public constructor(context: RepositoryContext) {
    super(context);
  }

  async persistNormalizationBatch(input: PersistNormalizationBatchInput): Promise<PersistNormalizationBatchResult> {
    const candidates: PersistedNormalizedCandidateRecord[] = [];
    const aliases: PersistedCandidateAliasRecord[] = [];
    const sourceCandidateMap = new Map<string, PersistedNormalizedCandidateRecord>();

    for (const candidate of input.normalizedCandidates) {
      const persisted = await this.upsertNormalizedCandidate(candidate);
      candidates.push(persisted.candidate);
      aliases.push(...persisted.aliases);
      sourceCandidateMap.set(candidate.stagingCandidateId, persisted.candidate);
    }

    const sourceNormalizedCandidateIds = candidates.map((candidate) => candidate.id);

    if (sourceNormalizedCandidateIds.length > 0) {
      await this.db.matchSuggestion.deleteMany({
        where: {
          normalizedCandidateId: {
            in: sourceNormalizedCandidateIds,
          },
        },
      });

      await this.db.duplicateSignal.deleteMany({
        where: {
          sourceNormalizedCandidateId: {
            in: sourceNormalizedCandidateIds,
          },
        },
      });
    }

    const targetCandidateIds = Array.from(
      new Set(
        [
          ...input.matchSuggestions
            .filter((record) => record.targetSource === "normalized_candidate")
            .map((record) => record.targetId),
          ...input.duplicateSignals
            .filter((record) => getDuplicateSignalTargetSource(record) === "normalized_candidate")
            .map((record) => record.targetId),
        ],
      ),
    );

    const knownTargetCandidates = targetCandidateIds.length
      ? await this.db.normalizedCandidate.findMany({
          where: {
            stagingCandidateId: {
              in: targetCandidateIds,
            },
          },
        })
      : [];

    const targetCandidateMap = new Map<string, string>();

    for (const candidate of knownTargetCandidates) {
      targetCandidateMap.set(candidate.stagingCandidateId, candidate.id);
    }

    for (const candidate of candidates) {
      targetCandidateMap.set(candidate.stagingCandidateId, candidate.id);
    }

    const matchSuggestions: PersistedMatchSuggestionRecord[] = [];

    for (const suggestion of input.matchSuggestions) {
      const sourceCandidate = sourceCandidateMap.get(suggestion.sourceCandidateId);

      if (!sourceCandidate) {
        throw new Error(`Missing normalized candidate for staging candidate ${suggestion.sourceCandidateId}.`);
      }

      const targetNormalizedCandidateId =
        suggestion.targetSource === "normalized_candidate" ? targetCandidateMap.get(suggestion.targetId) : undefined;

      if (suggestion.targetSource === "normalized_candidate" && !targetNormalizedCandidateId) {
        throw new Error(`Missing normalized target candidate for staging candidate ${suggestion.targetId}.`);
      }

      const record = await this.db.matchSuggestion.create({
        data: {
          normalizedCandidateId: sourceCandidate.id,
          targetSource: mapMatchTargetSource(suggestion.targetSource),
          targetCanonicalMediaId: suggestion.targetSource === "canonical" ? suggestion.targetId : undefined,
          targetNormalizedCandidateId,
          kind: mapMatchSuggestionKind(suggestion.kind),
          confidence: suggestion.confidence,
          reasons: toJsonValue(suggestion.reasons) ?? Prisma.JsonNull,
        },
      });

      matchSuggestions.push(mapMatchSuggestionRecord(record));
    }

    const duplicateSignals: PersistedDuplicateSignalRecord[] = [];

    for (const signal of input.duplicateSignals) {
      const sourceCandidate = sourceCandidateMap.get(signal.sourceCandidateId);
      const targetSource = getDuplicateSignalTargetSource(signal);

      if (!sourceCandidate) {
        throw new Error(`Missing duplicate source candidate for staging candidate ${signal.sourceCandidateId}.`);
      }

      const targetNormalizedCandidateId = targetSource === "normalized_candidate" ? targetCandidateMap.get(signal.targetId) : undefined;

      if (targetSource === "normalized_candidate" && !targetNormalizedCandidateId) {
        throw new Error(`Missing duplicate target candidate for staging candidate ${signal.targetId}.`);
      }

      const record = await this.db.duplicateSignal.create({
        data: {
          sourceNormalizedCandidateId: sourceCandidate.id,
          targetSource: mapMatchTargetSource(targetSource),
          targetCanonicalMediaId: targetSource === "canonical" ? signal.targetId : undefined,
          targetNormalizedCandidateId,
          kind: mapDuplicateSignalKind(signal.kind),
          status: mapDuplicateSignalStatus("active"),
          confidence: signal.confidence,
          reasons: toJsonValue(signal.reasons) ?? Prisma.JsonNull,
        },
      });

      duplicateSignals.push(mapDuplicateSignalRecord(record));
    }

    return {
      candidates,
      aliases,
      matchSuggestions,
      duplicateSignals,
    };
  }

  private async upsertNormalizedCandidate(candidate: NormalizedCandidateDraft) {
    const candidateState = deriveNormalizedCandidateState(candidate);
    const record = await this.db.normalizedCandidate.upsert({
      where: {
        stagingCandidateId: candidate.stagingCandidateId,
      },
      create: {
        stagingCandidateId: candidate.stagingCandidateId,
        providerId: candidate.providerId,
        providerItemId: candidate.providerItemId,
        status: mapNormalizedCandidateStatus(candidateState.status),
        titleDisplay: candidate.title.display,
        titleComparable: candidate.title.comparable,
        originalTitleDisplay: candidate.originalTitle?.display,
        originalTitleComparable: candidate.originalTitle?.comparable,
        summary: candidate.summary,
        mediaType: mapNormalizedMediaType(candidate.mediaType),
        releaseYear: candidate.releaseYear,
        region: candidate.region,
        language: candidate.language,
        seasonEpisodeHints: toJsonValue(candidate.seasonEpisodeHints),
        sourceSummary: toJsonValue(candidate.sourceSummary),
        evidence: toJsonValue(candidate.evidence),
        warnings: candidate.warnings,
        normalizationNotes: candidateState.normalizationNotes,
        failureSummary: candidateState.failureSummary,
      },
      update: {
        providerId: candidate.providerId,
        providerItemId: candidate.providerItemId,
        status: mapNormalizedCandidateStatus(candidateState.status),
        titleDisplay: candidate.title.display,
        titleComparable: candidate.title.comparable,
        originalTitleDisplay: candidate.originalTitle?.display,
        originalTitleComparable: candidate.originalTitle?.comparable,
        summary: candidate.summary,
        mediaType: mapNormalizedMediaType(candidate.mediaType),
        releaseYear: candidate.releaseYear,
        region: candidate.region,
        language: candidate.language,
        seasonEpisodeHints: toJsonValue(candidate.seasonEpisodeHints),
        sourceSummary: toJsonValue(candidate.sourceSummary),
        evidence: toJsonValue(candidate.evidence),
        warnings: candidate.warnings,
        normalizationNotes: candidateState.normalizationNotes,
        failureSummary: candidateState.failureSummary,
      },
    });

    await this.db.candidateAlias.deleteMany({
      where: {
        normalizedCandidateId: record.id,
      },
    });

    const dedupedAliases = dedupeAliases(candidate.aliases);

    if (dedupedAliases.length > 0) {
      await this.db.candidateAlias.createMany({
        data: dedupedAliases.map((alias) => ({
          normalizedCandidateId: record.id,
          source: mapCandidateAliasSource(alias.source),
          displayValue: alias.display,
          comparableValue: alias.comparable,
        })),
      });
    }

    const aliasRecords = await this.db.candidateAlias.findMany({
      where: {
        normalizedCandidateId: record.id,
      },
      orderBy: [{ source: "asc" }, { comparableValue: "asc" }],
    });

    return {
      candidate: mapNormalizedCandidateRecord(record),
      aliases: aliasRecords.map((alias) => mapCandidateAliasRecord(alias)),
    };
  }
}

export function createNormalizationPersistenceRepository(context: RepositoryContext) {
  return new NormalizationPersistenceRepository(context);
}

export function createDefaultNormalizationPersistenceRepository() {
  return createNormalizationPersistenceRepository(createRepositoryContext(requireDb()));
}

export * from "./types";
