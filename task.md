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

### Normalization And Dedup Pipeline Round C

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator sets the Round C scope against `docs/backend-spec.md`, `docs/architecture.md`, and `docs/roadmap.md`
2. Planner defines the implementation breakdown, ownership boundaries, and acceptance checklist for normalization and dedup
3. Media Ingest implements normalization-input preparation, candidate-shaping helpers, and matching/dedup orchestration boundaries only within its owned scope
4. Data Catalog implements Prisma/schema and repository/persistence changes required for normalized candidates, match decisions, and duplicate signals
5. Reviewer validates normalization boundaries, dedup safety, schema/contract drift, and ownership discipline before merge
5. User review remains authoritative for planning direction; rejected backend structure must not be represented as accepted

Scope for this round:
- Establish the first normalization and dedup layer on top of staging data as described in `docs/backend-spec.md`, `docs/architecture.md`, and `docs/roadmap.md`
- Keep normalization and duplicate handling isolated from publish and public catalog reads
- Keep the runtime catalog withdrawn; this round is not for reintroducing public content
- Owned surfaces:
  - Planner: architecture, roadmap alignment, round-specific handoff docs
  - Media Ingest: `scripts/`, `import-data/`, backend ingest/provider/normalize files, and package script entries when needed for safe ingest tooling
  - Data Catalog: Prisma/schema, backend contracts, `lib/db/`, and related shared backend files required for normalized candidates, matching, and duplicate-state persistence
  - Reviewer: acceptance and findings docs only
- No publish or public-catalog restoration
- No review/publish workflow yet
- No canonical catalog writes
- No admin UI yet
- No player or public route redesign in this round

Acceptance criteria:
- Normalization logic consumes staged provider records rather than raw public-route payloads
- The repo has explicit persistence/state for normalized candidates, match outcomes, or duplicate signals as defined by the round handoff
- Dedup or match suggestions do not write directly into canonical `MediaTitle` / published catalog records
- Backend scaffolding does not leak normalization or dedup logic into public route files
- The project remains buildable after Round C changes

Current user-requested improvement to implement:
1. Enter Round C: normalization and dedup pipeline

Current baseline:
- Public runtime catalog has already been withdrawn from the site
- Round A monolith foundations are present under `lib/server/` and `lib/db/`
- Round B provider adapter contracts and staging persistence now exist and have passed reviewer acceptance
- The repo still lacks canonical title resolution, alias/year matching, season-episode resolution, and persisted duplicate/match outcomes
