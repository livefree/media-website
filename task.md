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

### Provider Adapter And Staging Schema Round B

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator sets the Round B scope against `docs/backend-spec.md`, `docs/architecture.md`, and `docs/roadmap.md`
2. Planner defines the implementation breakdown, ownership boundaries, and acceptance checklist for provider adapters and staging schema
3. Media Ingest implements adapter contracts, ingest-safe provider boundaries, and staging-intake scaffolding only within its owned scope
4. Data Catalog implements Prisma/schema and shared backend contract changes required for staging persistence and candidate records
5. Reviewer validates module boundaries, staging isolation, schema/contract drift, and ownership discipline before merge
5. User review remains authoritative for planning direction; rejected backend structure must not be represented as accepted

Scope for this round:
- Establish the first lawful adapter-based intake path and staging persistence model described in `docs/backend-spec.md`, `docs/architecture.md`, and `docs/roadmap.md`
- Keep all external-provider intake isolated from the live catalog and public routes
- Keep the runtime catalog withdrawn; this round is not for reintroducing public content
- Owned surfaces:
  - Planner: architecture, roadmap alignment, round-specific handoff docs
  - Media Ingest: `scripts/`, `import-data/`, backend ingest/provider files, and package script entries when needed for safe intake tooling
  - Data Catalog: Prisma/schema, backend contracts, `lib/db/`, and related shared backend files required for staging persistence
  - Reviewer: acceptance and findings docs only
- No publish or public-catalog restoration
- No normalization, dedup, or merge decision logic beyond ingest-safe candidate shaping
- No admin UI yet
- No player or public route redesign in this round

Acceptance criteria:
- At least one adapter contract exists under the server-side provider/ingest boundaries
- Staging-focused Prisma/schema structures exist for provider items, raw payloads, ingest jobs, or candidate records as defined by the round handoff
- Raw provider shapes remain isolated from public runtime and canonical catalog reads
- Backend scaffolding does not leak provider or staging logic into public route files
- The project remains buildable after Round B changes

Current user-requested improvement to implement:
1. Enter Round B: provider adapter and staging schema

Current baseline:
- Public runtime catalog has already been withdrawn from the site
- Round A monolith foundations are now present under `lib/server/` and `lib/db/`
- The repo still lacks concrete provider adapter contracts and staging persistence/schema structures
