# Reviewer Acceptance: Normalization And Dedup Pipeline Round C

Status: accepted

Verdict:
- Accepted.

What passes:
- Normalization consumes staged data rather than public/runtime data. The staging bridge for normalization explicitly accepts `PersistedStagingCandidateRecord` and `PersistedProviderItemRecord` and builds a `StagingNormalizationRecord` from those staged sources in [lib/server/normalize/staging.ts](/Users/livefree/projects/media-website-v2/lib/server/normalize/staging.ts#L11).
- The normalize service remains pre-review and suggestion-only. It produces normalized candidate drafts, canonical match suggestions, and duplicate signals in-memory without writing canonical records or publish state in [lib/server/normalize/service.ts](/Users/livefree/projects/media-website-v2/lib/server/normalize/service.ts#L12).
- Persistence for normalized candidates and dedup signals is separate from the canonical catalog. Round C adds dedicated `NormalizedCandidate`, `CandidateAlias`, `MatchSuggestion`, and `DuplicateSignal` models in [prisma/schema.prisma](/Users/livefree/projects/media-website-v2/prisma/schema.prisma#L814), all distinct from `MediaTitle`.
- The repository write path stays inside pre-review state. `persistNormalizationBatch(...)` upserts normalized candidates, writes aliases, and records match/duplicate suggestions in [lib/db/repositories/normalization/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/normalization/index.ts#L357), while `upsertNormalizedCandidate(...)` only writes `normalizedCandidate` and `candidateAlias` rows in [lib/db/repositories/normalization/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/normalization/index.ts#L493).
- Dedup and match outputs remain suggestion-only and pre-review. The persistence contract stores confidence-bearing suggestions and signals through `PersistedMatchSuggestionRecord` and `PersistedDuplicateSignalRecord` in [lib/db/repositories/normalization/types.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/normalization/types.ts#L65), not merge or publish decisions.
- I did not find review/publish or canonical write shortcuts introduced by the integrated Round C implementation. The only remaining direct canonical-import helper is still the separately quarantined legacy script path from Round B, not part of the Round C normalization pipeline.
- I did not find public route leakage. `app/` and `components/` do not import the normalize or normalization repository modules.

Buildability:
- `npm run build` passed on the latest integrated `main`.

Residual note:
- The integrated Round C slice establishes normalization and dedup persistence plus orchestration helpers, but it still stops short of a full review workflow by design. That is consistent with the round scope and not a blocker.
