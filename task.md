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

### Source Management And Healthcheck Round F

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator sets the Round F scope against `docs/backend-spec.md`, `docs/architecture.md`, and `docs/roadmap.md`
2. Planner defines the implementation breakdown, ownership boundaries, and acceptance checklist for source management and healthcheck
3. Media Ingest implements source-ingest and source-refresh workflow pieces that belong in provider/ingest boundaries
4. Data Catalog implements source inventory, source status, repair-queue, and published-source contracts in Prisma, repository, and server source/health modules
5. Detail Player integrates watch-page source preference and health-aware source resolution without breaking canonical URL behavior
6. Reviewer validates source-state isolation, health/repair workflow discipline, watch/runtime correctness, and ownership boundaries before merge
7. User review remains authoritative for planning direction; rejected backend structure must not be represented as accepted

Scope for this round:
- Establish the first source-management and healthcheck layer on top of the accepted published catalog serving foundation described in `docs/backend-spec.md`, `docs/architecture.md`, and `docs/roadmap.md`
- Add backend support for source inventory, source ordering, health state, repair queue creation, and health-aware watch-page source preference
- Owned surfaces:
  - Planner: architecture, roadmap alignment, round-specific handoff docs
  - Media Ingest: `lib/server/provider/`, `lib/server/ingest/`, and related ingest-side workflow files needed for source refresh or repair intake
  - Data Catalog: Prisma/schema, backend contracts, `lib/db/`, `lib/server/source/`, `lib/server/health/`, `lib/server/catalog/`, and related shared backend files required for source-state and health-aware serving
  - Detail Player: `app/media/`, `app/watch`, `components/player/`, `components/detail/`, and related source-selection integration points for published detail/watch data
  - Reviewer: acceptance and findings docs only
- No public browse/search redesign
- No admin workflow redesign beyond narrow operator-facing state needed to support repair/health boundaries
- No player redesign beyond source-state integration
- No new auth/session work

Acceptance criteria:
- Sources can be represented with explicit health/availability state such as healthy, degraded, broken, replaced, or offline without rewriting canonical title identity
- Automated health/refresh checks feed repair-oriented backend workflow state instead of silently mutating public runtime data
- Watch-page source resolution can prefer healthy published sources while preserving canonical `/watch?...&r=...` behavior and existing public identity rules
- Staging-only, normalized-only, review-only, or rejected records do not leak into source inventory or public runtime contracts
- The project remains buildable after Round F changes

Current user-requested improvement to implement:
1. Begin Round F: source management and healthcheck

Current baseline:
- Round A monolith foundations are present under `lib/server/` and `lib/db/`
- Round B provider adapter contracts and staging persistence now exist and have passed reviewer acceptance
- Round C normalization and dedup persistence now exist and have passed reviewer acceptance
- Round D review/publish workflow and admin review surface now exist and have passed reviewer acceptance
- Round E canonical catalog serving is accepted, so public browse/search/detail/watch/list now resolve through published backend read boundaries
- The repo still lacks explicit source inventory, health state transitions, repair queue flow, and health-aware source preference on the watch page
