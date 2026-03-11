# Reviewer Findings: Provider Adapter And Staging Schema Round B

Status: findings

Verdict:
- Rejected for Round B acceptance.

What passes:
- Adapter isolation is directionally correct. Provider-side contracts and HTTP/runtime boundaries are confined to `lib/server/provider/`, and ingest orchestration remains in `lib/server/ingest/` with staging-oriented persistence plans rather than inline Prisma writes. See [lib/server/provider/types.ts](/Users/livefree/projects/media-website-v2/lib/server/provider/types.ts#L19), [lib/server/provider/adapter.ts](/Users/livefree/projects/media-website-v2/lib/server/provider/adapter.ts#L7), [lib/server/provider/http.ts](/Users/livefree/projects/media-website-v2/lib/server/provider/http.ts#L24), and [lib/server/ingest/service.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/service.ts#L39).
- Staging schema scope exists and is structurally separate from the canonical catalog. Prisma now has explicit `ProviderRegistry`, `IngestJob`, `IngestRun`, `IngestCheckpoint`, `ProviderItem`, `ProviderRawPayload`, and `StagingCandidate` models instead of collapsing them into published catalog tables. See [prisma/schema.prisma](/Users/livefree/projects/media-website-v2/prisma/schema.prisma#L583).
- Repository and persistence boundaries are explicit under `lib/db/repositories/staging/`, including provider registry upserts, ingest jobs/runs, checkpoints, raw payloads, provider items, and staged candidates. See [lib/db/repositories/staging/types.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/staging/types.ts#L27), [lib/db/repositories/staging/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/staging/index.ts#L452), and [lib/db/repositories/staging/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/staging/index.ts#L593).
- I did not find provider or staging leakage into public routes. Public `app/` surfaces are not importing `lib/server/provider/`, `lib/server/ingest/`, or the staging repositories.
- Ownership split is mostly visible and coherent: provider/ingest code and scripts live in `media-ingest` surfaces, while Prisma and `lib/db/` persistence work live in `data-catalog` surfaces.
- `npm run build` passed on the integrated `main`.

Blocking finding:
1. [P1] The integrated Round B tree still exposes a direct shortcut from ingest artifacts into the canonical catalog, which violates the round’s staging-only acceptance gate. `package.json` wires `ingest:prisma` and `ingest:import` as active top-level ingest commands in [package.json](/Users/livefree/projects/media-website-v2/package.json#L10). That path builds `mediaTitle`-shaped payloads from ingest artifacts in [scripts/media-build-prisma-payload.mjs](/Users/livefree/projects/media-website-v2/scripts/media-build-prisma-payload.mjs#L207), then inserts directly into canonical `MediaTitle`, `Season`, `Episode`, and `Resource` tables in [scripts/media-import-prisma.mjs](/Users/livefree/projects/media-website-v2/scripts/media-import-prisma.mjs#L35). The planner handoff explicitly says Round B must not include a hidden shortcut that turns staged data into live catalog data, and this path does exactly that.

Why this blocks acceptance:
- Round B is supposed to stop at adapter contracts plus staging persistence.
- A repo-level ingest command that directly materializes canonical media records means staging is not the only intake lane.
- That makes the canonical/staging separation incomplete at the workflow level, even though the schema and repositories themselves are well structured.

What needs to change before acceptance:
- Remove, quarantine, or clearly demote the direct canonical import path so Round B no longer presents it as part of the active ingest workflow.
- If the direct import tooling must stay in-repo temporarily, it should be explicitly separated from the Round B provider/staging pipeline and no longer appear as the sanctioned ingest path in package scripts or active backend workflow docs.
