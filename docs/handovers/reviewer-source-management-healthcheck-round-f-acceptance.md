# Reviewer Acceptance: Source Management And Healthcheck Round F

## Verdict

Accepted on code/build review of the current integrated `main`.

## Acceptance Basis

### 1. Explicit source inventory and ordering now exist

- Published sources remain first-class `Resource` records, now with explicit ordering and preference fields in [prisma/schema.prisma](/Users/livefree/projects/media-website-v2/prisma/schema.prisma#L580).
- The source inventory contract is explicit in [lib/server/source/types.ts](/Users/livefree/projects/media-website-v2/lib/server/source/types.ts#L7), including `priority`, `mirrorOrder`, `isPreferred`, `orderingOrigin`, replacement linkage, and public/active flags.
- Durable source inventory reads/writes and ordering updates are implemented in [lib/db/repositories/source/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/source/index.ts#L290).

### 2. Explicit health and availability state are durable

- Source health is persisted directly on `Resource` via `healthState`, `healthSummary`, `lastCheckedAt`, `lastHealthyAt`, and `failureCount` in [prisma/schema.prisma](/Users/livefree/projects/media-website-v2/prisma/schema.prisma#L592).
- Probe execution history is durable in `SourceProbeRun`, and repair workflow state is durable in `RepairQueueEntry`, both defined in [prisma/schema.prisma](/Users/livefree/projects/media-website-v2/prisma/schema.prisma#L624).
- Health persistence and repair queue updates are implemented in [lib/db/repositories/health/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/health/index.ts#L399).

### 3. Probe/refresh workflow feeds repair-oriented backend state

- Provider ingest now turns source refresh/probe findings into repair-intake plans instead of mutating public route state directly in [lib/server/ingest/service.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/service.ts#L68), [lib/server/ingest/service.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/service.ts#L189), and [lib/server/ingest/service.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/service.ts#L290).
- The health boundary persists probe evidence, updates durable source state, and creates or resolves repair queue entries in [lib/server/health/service.ts](/Users/livefree/projects/media-website-v2/lib/server/health/service.ts#L1) and [lib/db/repositories/health/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/health/index.ts#L455).

### 4. Metadata/source lifecycle decoupling is preserved

- Canonical media identity remains separate from source operational state: source health and repair state live on `Resource`, `SourceProbeRun`, and `RepairQueueEntry`, not on `MediaTitle` identity fields.
- The publish/catalog metadata flow from prior rounds remains intact; Round F updates source operational state without rewriting public media identity.

### 5. Public detail/watch source contracts contain only published source state

- Public catalog contracts now expose published-safe source state only in [lib/server/catalog/types.ts](/Users/livefree/projects/media-website-v2/lib/server/catalog/types.ts#L105): health state, health summary, ordering, preferred flag, usability, and replacement public ID.
- I did not find staging candidates, review notes, rejected items, raw probe logs, or repair queue records exposed in public detail/watch contracts.
- The published catalog repository filters public resources to `isPublic` and `isActive` and maps only published-safe fields in [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L230), [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L274), and [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L631).

### 6. Watch-page source resolution is health-aware while preserving canonical `/watch?...&r=...` behavior

- The published catalog resolver now ranks public resources by usability, preferred flag, priority, health state, status, and mirror order in [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L243).
- Requested `r` is preserved when still usable; otherwise resolution falls back to the next best usable published source with explicit resolution reasons in [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L671).
- The public watch contract keeps canonical `r` identity explicit through `requestedResourcePublicId`, `resolvedResourcePublicId`, and `canonicalWatchHref` in [lib/server/catalog/types.ts](/Users/livefree/projects/media-website-v2/lib/server/catalog/types.ts#L170).
- The watch page consumes the health-aware published resolver rather than re-implementing backend source health logic locally in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L205).

### 7. No staging/review/rejected leakage into public runtime contracts

- Public route composition remains on published catalog boundaries and does not import staging, normalization, review, or repair queue modules directly.
- Public source resolution uses published source state only, while repair/probe state remains isolated behind `lib/server/health` and `lib/db/repositories/health`.

### 8. No auth/session work, browse/search redesign, or player redesign beyond source-state integration

- I did not find new auth/session workflow introduced in the Round F implementation surface.
- Browse/search route structure was not redesigned in this round.
- The public player/watch changes are limited to source-state integration in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L1), not a broader UI redesign.

### 9. Ownership boundaries were respected

- `media-ingest` owns the provider/ingest probe and repair-intake workflows in [lib/server/ingest/service.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/service.ts#L1) and `lib/server/provider/*`.
- `data-catalog` owns schema, source inventory, health persistence, and published source contracts in [prisma/schema.prisma](/Users/livefree/projects/media-website-v2/prisma/schema.prisma#L580), [lib/db/repositories/source/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/source/index.ts#L290), [lib/db/repositories/health/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/health/index.ts#L399), and [lib/server/catalog/types.ts](/Users/livefree/projects/media-website-v2/lib/server/catalog/types.ts#L1).
- `detail-player` ownership is limited to watch-page integration in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L1).

### 10. Buildability

- `npm run build` passed during this review on the integrated Round F state.

## Residual Note

- This acceptance is based on code/build review. I did not perform runtime browser QA in this pass because the requested acceptance focus was on backend state discipline and watch resolution behavior rather than a new interaction-heavy player UI change.
