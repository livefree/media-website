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

### Review And Publish Workflow Round D

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator sets the Round D scope against `docs/backend-spec.md`, `docs/architecture.md`, and `docs/roadmap.md`
2. Planner defines the implementation breakdown, ownership boundaries, and acceptance checklist for review and publish workflow
3. Data Catalog implements Prisma/schema and repository/service changes required for review queue, review decisions, publish operations, and audit state
4. UI Shell implements any required admin/operator review surface within owned UI scope
5. Reviewer validates review/publish gating, canonical-write discipline, schema/contract drift, UI/operator separation, and ownership discipline before merge
5. User review remains authoritative for planning direction; rejected backend structure must not be represented as accepted

Scope for this round:
- Establish the first explicit review queue and publish gate on top of the accepted staging and normalization layers described in `docs/backend-spec.md`, `docs/architecture.md`, and `docs/roadmap.md`
- Keep review/publish isolated from public browse/search/watch serving; this round is about backend workflow and operator-facing control only
- Keep the runtime catalog withdrawn; this round is not for reintroducing public content
- Owned surfaces:
  - Planner: architecture, roadmap alignment, round-specific handoff docs
  - Data Catalog: Prisma/schema, backend contracts, `lib/db/`, and related shared backend files required for review queue, review decisions, publish state, and audit persistence
  - UI Shell: `app/`, `components/`, `styles/` only for operator/admin review surfaces if needed by the handoff
  - Reviewer: acceptance and findings docs only
- No public catalog restoration yet
- No browse/search/detail/watch rewiring to the published backend yet
- No player redesign
- No provider adapter redesign

Acceptance criteria:
- The repo has explicit persistence/state for review queue entries, review decisions, publish operations, and publish audit data as defined by the round handoff
- Publish and reject flows are explicit backend workflow boundaries rather than implicit direct writes from staging or normalization steps
- Any canonical catalog writes introduced by this round occur only through review/publish service boundaries, not through route-local shortcuts
- If an operator review surface is added, it must stay clearly separated from public site routes
- The project remains buildable after Round D changes

Current user-requested improvement to implement:
1. Enter Round D: review and publish workflow

Current baseline:
- Public runtime catalog has already been withdrawn from the site
- Round A monolith foundations are present under `lib/server/` and `lib/db/`
- Round B provider adapter contracts and staging persistence now exist and have passed reviewer acceptance
- Round C normalization and dedup persistence now exist and have passed reviewer acceptance
- The repo still lacks explicit review queue state, approve/reject/merge decisions, publish service boundaries, and operator review controls
