# Reviewer Acceptance: Provider Adapter And Staging Schema Round B

Status: accepted

Verdict:
- Accepted on re-review.

What passes:
- Adapter and ingest boundaries remain valid and isolated under the server-only backend layer. The provider contract still exposes staging-safe adapter metadata, fetch methods, raw payload capture, and pre-normalization provider item fragments in [lib/server/provider/types.ts](/Users/livefree/projects/media-website-v2/lib/server/provider/types.ts#L19). Ingest orchestration still stops at persistence plans rather than canonical writes in [lib/server/ingest/service.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/service.ts#L39).
- The staging schema remains clearly separated from the canonical catalog. Prisma still uses distinct staging-oriented models for `ProviderRegistry`, `IngestJob`, `IngestRun`, `IngestCheckpoint`, `ProviderItem`, `ProviderRawPayload`, and `StagingCandidate` in [prisma/schema.prisma](/Users/livefree/projects/media-website-v2/prisma/schema.prisma#L583), rather than overloading published catalog tables.
- Staging repositories still persist only provider, ingest, raw payload, checkpoint, and candidate state. The main write path remains `persistPagePlan` / `persistDetailPlan` in [lib/db/repositories/staging/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/staging/index.ts#L593), which writes into staging-facing records and does not materialize canonical `MediaTitle` / `Season` / `Episode` rows.
- I still do not find provider or staging leakage into public routes. The public `app/` runtime remains outside the provider/ingest persistence path.

Prior blocker recheck:
- The old direct ingest-to-canonical path is no longer presented as the active Round B workflow in `package.json`. The exposed commands are now explicitly renamed to `legacy:ingest:prisma` and `legacy:ingest:import` in [package.json](/Users/livefree/projects/media-website-v2/package.json#L13), which materially demotes them out of the active ingest path.
- The legacy scripts themselves now require an explicit quarantine flag and announce that they are not part of the active Round B provider/staging workflow. See [scripts/media-build-prisma-payload.mjs](/Users/livefree/projects/media-website-v2/scripts/media-build-prisma-payload.mjs#L14) and [scripts/media-import-prisma.mjs](/Users/livefree/projects/media-website-v2/scripts/media-import-prisma.mjs#L12).
- That clears the previous acceptance blocker because the direct canonical-import helper is now clearly fenced off as legacy behavior rather than presented as the sanctioned Round B ingest lane.

Buildability:
- `npm run build` passed on the latest integrated `main`.

Residual note:
- The legacy direct-import helper still exists in-repo, but it is now sufficiently quarantined for Round B because it is no longer the active workflow surface and requires explicit opt-in.
