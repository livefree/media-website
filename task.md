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

### Workstream 1 Slice 2: Scheduled Refresh And Probe Jobs

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator aligns the work package to `docs/backend-spec.md`, `docs/roadmap.md`, and `docs/backend-delivery-workflow.md`
2. Planner defines the implementation breakdown, ownership boundaries, testing scope, and acceptance checklist for scheduled refresh/probe jobs with durable job state
3. Media Ingest implements scheduled refresh/probe job execution paths in provider/ingest boundaries
4. Data Catalog adds any missing backend contract or persistence support required by durable job state without broadening scope
5. Reviewer validates adapter discipline, execution-path correctness, testing coverage, and ownership boundaries before merge
6. User review remains authoritative for planning direction; rejected backend structure must not be represented as accepted

Scope for this round:
- Establish the first scheduled refresh/probe job layer on top of the accepted real-provider execution path and source-health foundation described in `docs/backend-spec.md`, `docs/roadmap.md`, and `docs/backend-delivery-workflow.md`
- Implement durable backend job execution for source refresh and source probe workflows, with tests
- Owned surfaces:
  - Planner: architecture, roadmap alignment, round-specific handoff docs
  - Media Ingest: `lib/server/provider/`, `lib/server/ingest/`, `scripts/`, and `package.json` script entries needed for job execution and tests
  - Data Catalog: narrow Prisma/schema, `lib/db/`, or shared backend support only if durable job state reveals a missing persistence/contract dependency
  - Reviewer: acceptance and findings docs only
- No public route redesign
- No admin redesign
- No player work
- No auth/session work
- No auto-publish behavior

Acceptance criteria:
- Source refresh and source probe can execute through durable backend job state rather than only direct helper calls
- Job state is explicit and testable, not transient in route-local or script-local logic
- The implementation is covered by executable tests using fixtures or mocks so the scheduled job path is verifiable without requiring live network availability in CI
- Repair/health workflow remains separated from published catalog and public runtime routes
- The project remains buildable and the relevant tests pass after this slice

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
- The repo still lacks scheduled refresh/probe job execution with durable job state
