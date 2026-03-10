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

### Public URL Identity Rounds 3 and 4

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Data Catalog extends shared public list data, canonical href generation, and database planning for real public list playback context
3. UI Shell builds the public list/list-item entry surfaces and related canonical public-entry links
4. Detail Player extends canonical watch behavior so list-aware playback is user-visible and stateful inside `/watch`
5. Reviewer validates public list entry behavior, list-aware watch transitions, residual slug leakage, and the recorded Round 5 plan before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Public URLs, public list entry surfaces, and list-aware watch/detail routing
- Owned surfaces:
  - Data Catalog: `data/`, `types/`, `lib/media*`, `prisma/schema.prisma`, and import payload/planning artifacts if required for public-list/public-ID planning
  - UI Shell: `app/`, `components/`, and `styles/` for public list/list-item entry surfaces
  - Detail Player: `app/media/`, `app/watch/`, `components/player/`, `components/detail/`
  - Planner/Reviewer: docs and acceptance only
- No unrelated browse redesign or player-control redesign unless explicitly required by the new public URL flow

Acceptance criteria:
- Canonical public media entry points must continue to default to `/watch?...` rather than `/media/[slug]`
- Public watch URLs must continue to avoid leaking media slugs, episode slugs, or provider labels in clear text
- A real public list entry surface must exist and must compose canonical `/watch?...&list=...&li=...` URLs from shared data, not hard-coded page-local strings
- The watch page must preserve list context across episode/resource/source transitions and must expose enough UI context that users can tell they are navigating a list-backed playback flow
- Existing `/media/[slug]` links may remain only as compatibility entry points; they should not become canonical again
- Round 5 must be recorded as a planned future scope for full playlist/list management, sharing, and richer playback controls, but must not be pulled into Round 3/4 implementation
- Reviewer sign-off must confirm the new public list flow works end-to-end and that Round 5 remains documented as future work

Current user-requested improvement to implement:
1. Implement Round 3 by turning the existing list/list-item public-ID groundwork into real public-facing list pages and entry flows.
2. Implement Round 4 by making the canonical `/watch` playback flow truly list-aware across episode/resource/source transitions.
3. Record Round 5 as the planned follow-up for fuller playlist/list management, sharing, and richer playlist-style controls without prematurely implementing it now.

Current baseline:
- Round 1 introduced opaque `publicId` fields for media/episodes/resources, a canonical `/watch` route, and compatibility redirects from `/media/[slug]`.
- Round 2 migrated shared public entry points to canonical `/watch?...` URLs and made `list` / `li` explicit in shared contracts and seed-level URL composition.
- The codebase already contains minimal public list seed data and list-aware watch-context helpers, but there is no user-facing public list page yet and the watch experience does not yet surface list navigation as a first-class flow.
