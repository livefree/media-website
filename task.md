# Project Task

Recreate the front-end structure of a modern streaming-style media catalog website.

Pages required:

/
/movie
/series
/anime
/search
/media/[slug]

Shared components:

Navbar
SearchBox
FilterBar
MediaCard
MediaGrid
Pagination
PlayerShell

## Current Active Task

### Canonical Catalog Serving Round E

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator sets the Round E scope against `docs/backend-spec.md`, `docs/architecture.md`, and `docs/roadmap.md`
2. Planner defines the implementation breakdown, ownership boundaries, and acceptance checklist for canonical catalog serving
3. Data Catalog implements published-catalog read boundaries, stable public identity resolution, and serving contracts for public runtime
4. Search Filter integrates browse/search filtering against the published catalog backend
5. UI Shell integrates public list discovery and list pages against the published catalog backend
6. Detail Player integrates detail/watch serving against the published catalog backend
7. Reviewer validates published-only serving, route integration discipline, public/runtime correctness, and ownership boundaries before merge
8. User review remains authoritative for planning direction; rejected backend structure must not be represented as accepted

Scope for this round:
- Establish the first published canonical catalog serving layer on top of the accepted staging, normalization, and review/publish workflow described in `docs/backend-spec.md`, `docs/architecture.md`, and `docs/roadmap.md`
- Reconnect public browse/search/detail/watch/list reads to published backend data only
- Owned surfaces:
  - Planner: architecture, roadmap alignment, round-specific handoff docs
  - Data Catalog: Prisma/schema, backend contracts, `lib/db/`, `lib/server/catalog/`, and related shared backend files required for published-catalog serving
  - Search Filter: `lib/search*`, `app/search`, and browse/search integration points needed to consume published catalog query results
  - UI Shell: public list discovery, `/lists`, `/list/[publicId]`, and shared browse/list presentation points that must stop reading withdrawn seed helpers
  - Detail Player: `app/media/`, `app/watch`, `components/player/`, `components/detail/`, and related serving integration points for published detail/watch data
  - Reviewer: acceptance and findings docs only
- No source health/fallback management yet
- No new provider adapter work
- No admin workflow redesign
- No player redesign beyond data-source integration

Acceptance criteria:
- Public browse/search/detail/watch/list routes resolve published catalog data from backend read boundaries rather than withdrawn seed-only runtime data
- Staging-only, normalized-only, or rejected records do not leak into public routes
- Stable public watch/list identity remains intact while the backing data source becomes database-driven or repository-driven
- Search/filter inputs, public list discovery, and detail/watch selection logic consume published catalog contracts, not route-local seed shortcuts
- The project remains buildable after Round E changes

Current user-requested improvement to implement:
1. Enter Round E: canonical catalog serving

Current baseline:
- Public runtime catalog is still effectively withdrawn from public routes
- Round A monolith foundations are present under `lib/server/` and `lib/db/`
- Round B provider adapter contracts and staging persistence now exist and have passed reviewer acceptance
- Round C normalization and dedup persistence now exist and have passed reviewer acceptance
- Round D review/publish workflow and admin review surface now exist and have passed reviewer acceptance
- The repo still lacks fully published-catalog-backed serving for public browse/search/detail/watch/list routes; reviewer has confirmed `/lists`, `/list/[publicId]`, and homepage featured-list discovery still need migration
