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

### Workstream 2 Slice 2: Published Catalog Management UI

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator aligns the work package to `docs/backend-spec.md`, `docs/roadmap.md`, and `docs/backend-delivery-workflow.md`
2. Planner defines the implementation breakdown, ownership boundaries, testing scope, and acceptance checklist for published catalog management UI
3. Data Catalog implements any repository, contract, and backend read/update support required by operator catalog management
4. UI Shell implements the admin published catalog management surfaces
5. Reviewer validates operator workflow correctness, scope discipline, and test/build coverage before merge
6. User review remains authoritative for planning direction; rejected backend structure must not be represented as accepted

Scope for this round:
- Establish the first operator-facing published catalog management surface on top of the accepted review/publish and published-catalog backend foundation described in `docs/backend-spec.md`, `docs/roadmap.md`, and `docs/backend-delivery-workflow.md`
- Implement admin published catalog management UI backed by existing backend modules
- Owned surfaces:
  - Planner: architecture, roadmap alignment, round-specific handoff docs
  - Data Catalog: Prisma/schema only if narrowly required, `lib/db/`, `lib/server/catalog/`, `lib/server/review/`, `lib/server/admin/`, and related shared backend support for operator catalog workflows
  - UI Shell: admin pages, components, and styling for published catalog management surfaces
  - Reviewer: acceptance and findings docs only
- No public route redesign
- No player work
- No auth/session work
- No auto-publish behavior
- No moderation workflow expansion beyond catalog operator handling

Acceptance criteria:
- Operators can inspect and manage published catalog records without direct DB access
- Published catalog surfaces are backed by backend catalog/review/admin boundaries rather than seed helpers or ad hoc route-local logic
- Catalog management actions are visible and constrained to the published/admin scope required by this slice
- The implementation includes the necessary tests and remains buildable after this slice
- No public route redesign, player work, or broader admin/control-plane drift is introduced

Current user-requested improvement to implement:
1. Continue using the fixed backend workflow without ad hoc phases
2. Continue into the next fixed work package from `docs/backend-delivery-workflow.md`

Current baseline:
- Round A monolith foundations are present under `lib/server/` and `lib/db/`
- Round B provider adapter contracts and staging persistence now exist and have passed reviewer acceptance
- Round C normalization and dedup persistence now exist and have passed reviewer acceptance
- Round D review/publish workflow and admin review surface now exist and have passed reviewer acceptance
- Round E canonical catalog serving is accepted, so public browse/search/detail/watch/list now resolve through published backend read boundaries
- Round F source management and healthcheck is accepted, so source inventory, health state, repair queue flow, and health-aware watch-source resolution are now in place
- Workstream 1 / Slice 1 is accepted, so the repo now has a concrete `jszyapi` adapter and executable real-provider ingest path with offline-safe tests
- Workstream 1 / Slice 2 is accepted, so scheduled refresh/probe jobs and durable job state are now in place
- Workstream 2 / Slice 1 is accepted, so operator-facing source inventory and repair queue UI are now in place
- The repo still lacks operator-facing published catalog management UI
