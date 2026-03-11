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

### Backend Monolith Foundation Round A

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator formalizes backend planning inputs in tracked docs and sets the Round A scope
2. Planner defines the implementation breakdown, module map, and acceptance checklist for the monolith foundation
3. Data Catalog implements backend foundation scaffolding only within backend ownership boundaries
4. Reviewer validates the resulting module boundaries, backend conventions, and ownership drift before merge
5. User review remains authoritative for planning direction; rejected backend structure must not be represented as accepted

Scope for this round:
- Establish the backend-first monolith foundation described in `docs/backend-spec.md`, `docs/architecture.md`, and `docs/roadmap.md`
- Turn the backend phase from “planning only” into a concrete repo module structure and backend convention baseline
- Keep the runtime catalog withdrawn; this round is not for reintroducing public content
- Owned surfaces:
  - Planner: architecture, roadmap alignment, round-specific handoff docs
  - Data Catalog: Prisma/backend contracts, `lib/db/`, `lib/server/`, and related backend foundation files within its backend-phase ownership
  - Reviewer: acceptance and findings docs only
- No provider-specific adapter implementation yet
- No staging-to-publish business logic yet
- No admin UI yet
- No player or public route redesign in this round

Acceptance criteria:
- The repo has a documented backend module map aligned to `docs/backend-spec.md`
- Server-only boundaries exist for provider, ingest, normalize, review, catalog, source, health, search, and admin modules
- Shared backend conventions exist for config, logging, errors, and DB/repository boundaries
- Backend scaffolding does not leak raw provider or staging logic into public route files
- The project remains buildable after Round A changes

Current user-requested improvement to implement:
1. Treat `backend.md` as a key planning source by promoting its guidance into tracked docs
2. Start Round A: backend monolith foundation immediately after the documentation handoff is fixed

Current baseline:
- Public runtime catalog has already been withdrawn from the site
- Backend direction is documented, but the repo still lacks a finalized monolith module skeleton and backend foundation conventions
