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

### Workstream 1 Slice 1: Real Provider Execution Path

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator aligns the work package to `docs/backend-spec.md`, `docs/roadmap.md`, and `docs/backend-delivery-workflow.md`
2. Planner defines the implementation breakdown, ownership boundaries, testing scope, and acceptance checklist for a real provider execution path
3. Media Ingest implements at least one real provider adapter and the executable ingest path in provider/ingest boundaries
4. Data Catalog adds any missing backend contract or persistence support required by the real provider execution path without broadening scope
5. Reviewer validates adapter discipline, execution-path correctness, testing coverage, and ownership boundaries before merge
6. User review remains authoritative for planning direction; rejected backend structure must not be represented as accepted

Scope for this round:
- Establish the first real provider execution path on top of the accepted provider/staging backend foundation and fixed backend workflow described in `docs/backend-spec.md`, `docs/roadmap.md`, and `docs/backend-delivery-workflow.md`
- Implement at least one concrete provider adapter for a target external source and make the ingest path executable and testable
- Owned surfaces:
  - Planner: architecture, roadmap alignment, round-specific handoff docs
  - Media Ingest: `lib/server/provider/`, `lib/server/ingest/`, `scripts/`, and `package.json` script entries needed for provider execution and tests
  - Data Catalog: narrow Prisma/schema, `lib/db/`, or shared backend support only if the concrete provider execution path reveals a missing persistence/contract dependency
  - Reviewer: acceptance and findings docs only
- No public route redesign
- No admin redesign
- No player work
- No auth/session work
- No auto-publish behavior

Acceptance criteria:
- At least one concrete provider adapter exists for a real target provider described in `reference-assets/backend.md`
- The adapter can execute the ingest path through the existing provider/ingest boundaries without route-local shortcuts
- The implementation is covered by executable tests using fixtures or mocks so the provider path is verifiable without requiring live network availability in CI
- Raw payload and staging-safe outputs remain separated from published catalog logic
- The project remains buildable and the relevant tests pass after this slice

Current user-requested improvement to implement:
1. Continue using the fixed backend workflow without ad hoc phases
2. Start Workstream 1 / Slice 1 from `docs/backend-delivery-workflow.md`

Current baseline:
- Round A monolith foundations are present under `lib/server/` and `lib/db/`
- Round B provider adapter contracts and staging persistence now exist and have passed reviewer acceptance
- Round C normalization and dedup persistence now exist and have passed reviewer acceptance
- Round D review/publish workflow and admin review surface now exist and have passed reviewer acceptance
- Round E canonical catalog serving is accepted, so public browse/search/detail/watch/list now resolve through published backend read boundaries
- Round F source management and healthcheck is accepted, so source inventory, health state, repair queue flow, and health-aware watch-source resolution are now in place
- The repo still lacks an accepted concrete provider adapter and executable real-provider ingest path for one target source
