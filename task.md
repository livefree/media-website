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

### Public URL Identity Round 5

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Data Catalog extends shared public-list discovery, sharing, and queue-style watch contracts
3. UI Shell builds the richer public list discovery and sharing surfaces
4. Detail Player extends `/watch` with a stronger playlist-style list queue experience using shared list data
5. Reviewer validates public list discovery, public sharing surfaces, queue-style watch behavior, residual slug leakage, and adherence to Round 5 scope before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Public URLs, public list discovery/sharing surfaces, and richer playlist-style watch routing within the existing public list model
- Owned surfaces:
  - Data Catalog: `data/`, `types/`, `lib/media*`, `prisma/schema.prisma`, and import payload/planning artifacts if required for public-list discovery/sharing planning
  - UI Shell: `app/`, `components/`, and `styles/` for public list discovery/sharing entry surfaces
  - Detail Player: `app/media/`, `app/watch/`, `components/player/`, `components/detail/` for queue-style watch context
  - Planner/Reviewer: docs and acceptance only
- No unrelated browse redesign, auth flow, or admin/list-authoring implementation unless explicitly required by the scoped public list flow

Acceptance criteria:
- Canonical public media entry points must continue to default to `/watch?...` rather than `/media/[slug]`
- Public watch URLs must continue to avoid leaking media slugs, episode slugs, or provider labels in clear text
- A broader public list discovery flow must exist beyond a single homepage section, using shared list data and canonical opaque list identities
- Public list pages must expose share-ready public identity affordances without falling back to readable slug URLs as canonical identity
- The watch page must preserve list context across episode/resource/source transitions and expose a stronger playlist-style queue experience for the active public list
- Existing `/media/[slug]` links may remain only as compatibility entry points; they should not become canonical again
- Round 5 must stay inside public discovery/sharing/queue scope and must not drift into authenticated list authoring, editing, or admin workflows
- Reviewer sign-off must confirm the Round 5 public list flow works end-to-end without regressing the accepted Round 3/4 canonical watch behavior

Current user-requested improvement to implement:
1. Continue beyond the accepted Round 3/4 baseline into a real Round 5 slice for public list discovery, sharing, and playlist-style queue UX.
2. Keep using opaque public identities and canonical `/watch?...&list=...&li=...` URLs rather than readable slugs.
3. Improve the public list experience without pulling in authenticated list authoring, editing, or admin functionality yet.

Current baseline:
- Round 1 introduced opaque `publicId` fields for media/episodes/resources, a canonical `/watch` route, and compatibility redirects from `/media/[slug]`.
- Round 2 migrated shared public entry points to canonical `/watch?...` URLs and made `list` / `li` explicit in shared contracts and seed-level URL composition.
- Round 3 added a real `/list/[publicId]` page plus a visible homepage featured-lists entry surface.
- Round 4 made `/watch` visibly list-aware with shared previous/next list-item navigation and in-scope `list` / `li` preservation.
- What is still missing is the richer public list product layer: broader list discovery, stronger share-ready list surfaces, and a more playlist-style queue experience once playback has started.
