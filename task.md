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

### Workstream 4: Observability, Security, And Launch Hardening

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator aligns the work package to `docs/backend-spec.md`, `docs/roadmap.md`, and `docs/backend-delivery-workflow.md`
2. Planner defines the implementation breakdown, ownership boundaries, testing scope, and acceptance checklist for observability, security, and launch hardening work
3. Data Catalog and Media Ingest implement the backend/runtime support required by the chosen hardening slice
4. UI Shell only participates if an operator-facing observability surface is explicitly required by the planned slice
5. Reviewer validates operator workflow correctness, scope discipline, and test/build coverage before merge
6. User review remains authoritative for planning direction; rejected backend structure must not be represented as accepted

Scope for this round:
- Establish the first explicit observability, security, and launch-hardening slice on top of the accepted provider, catalog, source, and admin backend foundation described in `docs/backend-spec.md`, `docs/roadmap.md`, and `docs/backend-delivery-workflow.md`
- Implement one narrow hardening slice at a time rather than broad platform-wide changes in a single pass
- Current hardening slice: `Workstream 4 / Slice 2: Admin Access Control And Route Hardening`
- This slice is mapped to the `RBAC / auth hardening` deliverable under Workstream 4 in `docs/backend-delivery-workflow.md` and Phase 8 in `docs/roadmap.md`
- Owned surfaces:
  - Planner: architecture, roadmap alignment, round-specific handoff docs
  - Data Catalog: Prisma/schema only if narrowly required, `lib/db/`, `lib/server/admin/`, `lib/server/health/`, `lib/server/catalog/`, and related shared backend support for the selected hardening slice
  - Media Ingest: `lib/server/provider/`, `lib/server/ingest/`, job execution, and provider/runtime support for the selected hardening slice
  - UI Shell: only if the planned hardening slice explicitly requires an operator-facing admin surface
  - Reviewer: acceptance and findings docs only
- No public route redesign
- No player work
- No broad auth/session product expansion beyond hardening needs
- No broad admin suite expansion unless the planned slice explicitly requires it

Acceptance criteria:
- The chosen hardening slice improves backend operability, safety, or observability in a measurable way
- The slice remains narrow, testable, and grounded in tracked backend docs rather than ad hoc hardening changes
- New support remains inside accepted backend boundaries and does not leak into public route logic
- The implementation includes the necessary tests and remains buildable after this slice
- No public route redesign, player work, or broader out-of-scope platform drift is introduced

Current user-requested improvement to implement:
1. Continue using the fixed backend workflow without ad hoc phases
2. Continue into the next fixed work package from `docs/backend-delivery-workflow.md`
3. Harden admin and operator-facing surfaces with explicit access-control boundaries before broader launch hardening slices

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
- Workstream 3 is accepted, so moderation/report handling and manual title/source submission workflows are now in place
- Workstream 4 / Slice 1 is accepted, so structured job execution telemetry and failure visibility are now in place for ingest, scheduled refresh, and source-probe flows
- The repo still lacks explicit admin access hardening, broader hardening slices, and final launch-readiness work
