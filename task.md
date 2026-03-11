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

### Workstream 3: Moderation And Manual Submission Workflows

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator aligns the work package to `docs/backend-spec.md`, `docs/roadmap.md`, and `docs/backend-delivery-workflow.md`
2. Planner defines the implementation breakdown, ownership boundaries, testing scope, and acceptance checklist for moderation and manual submission workflows
3. Data Catalog implements the repository, contract, and backend workflow support required for moderation and manual submission
4. UI Shell implements the admin moderation and manual submission surfaces
5. Reviewer validates operator workflow correctness, scope discipline, and test/build coverage before merge
6. User review remains authoritative for planning direction; rejected backend structure must not be represented as accepted

Scope for this round:
- Establish the first operator-facing moderation and manual submission workflows on top of the accepted review/publish, published catalog, and source-management backend foundation described in `docs/backend-spec.md`, `docs/roadmap.md`, and `docs/backend-delivery-workflow.md`
- Implement narrow moderation and manual submission workflows backed by existing backend modules
- Owned surfaces:
  - Planner: architecture, roadmap alignment, round-specific handoff docs
  - Data Catalog: Prisma/schema only if narrowly required, `lib/db/`, `lib/server/review/`, `lib/server/source/`, `lib/server/admin/`, and related shared backend support for moderation and manual submission workflows
  - UI Shell: admin pages, components, and styling for moderation and manual submission surfaces
  - Reviewer: acceptance and findings docs only
- No public route redesign
- No player work
- No auth/session work
- No broad admin suite expansion beyond moderation and manual submission workflows

Acceptance criteria:
- Moderation workflows for broken-source reports or equivalent operator report handling exist without direct DB edits
- Manual submission workflows for title/source intake exist in operator-facing form without bypassing backend boundaries
- The new surfaces are backed by backend review/source/admin boundaries rather than seed helpers or ad hoc route-local logic
- Actions remain narrow, auditable, and scoped to this workflow slice
- The implementation includes the necessary tests and remains buildable after this slice
- No public route redesign, player work, auth expansion, or broader admin/control-plane drift is introduced

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
- Workstream 2 / Slice 2 is accepted, so operator-facing published catalog listing and inspection UI are now in place
- The repo still lacks moderation workflows and manual submission workflows in operator-facing form
