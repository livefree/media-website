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

### Public URL Identity Round 2

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Data Catalog extends shared public URL contracts, canonical hrefs, and future list/list-item public identity support
3. UI Shell or shared-link owners switch remaining public media entry points to canonical watch URLs where they are still using compatibility hrefs
4. Detail Player extends canonical watch behavior to remain list-aware and preserves compatibility redirects
5. Reviewer validates canonical public entry behavior, residual slug leakage, and list/list-item planning before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Public URLs and watch/detail routing
- Owned surfaces:
  - Data Catalog: `data/`, `types/`, `lib/media*`, `prisma/schema.prisma`, and import payload/planning artifacts if required for public-ID planning
  - Detail Player: `app/media/`, new public watch route(s), `components/player/`, `components/detail/`
  - Planner/Reviewer: docs and acceptance only
- No unrelated browse redesign or player-control redesign unless explicitly required by the new public URL flow

Acceptance criteria:
- Canonical public media entry points across browse/search/recommendation surfaces must default to `/watch?...` rather than `/media/[slug]`
- Public watch URLs must continue to avoid leaking media slugs, episode slugs, or provider labels in clear text
- Shared URL contracts and data planning must now explicitly cover future `list` and `li` playback context, not only `v`, `e`, and `r`
- The shared data/model layer must define how a public list/list-item context composes with a canonical watch URL
- Existing `/media/[slug]` links may remain only as compatibility entry points; they should not remain the default public href where this round touches the surface
- Reviewer sign-off must confirm the main public entry flows now prefer canonical watch URLs and that future list/list-item support has a concrete shared-data path

Current user-requested improvement to implement:
1. Continue the public URL migration after Round 1 by making canonical `/watch?...` links the default public entry points instead of leaving most browse/search surfaces on compatibility hrefs.
2. Extend the shared URL/data/database planning so future playlists/lists are not just theoretical query params, but part of the public identity model.
3. Keep the old slug route only as a compatibility layer, not as the normal public URL.

Current baseline:
- Round 1 introduced opaque `publicId` fields for media/episodes/resources, a canonical `/watch` route, and compatibility redirects from `/media/[slug]`.
- However, several shared public entry points still default to compatibility hrefs instead of canonical watch hrefs.
- Future list/list-item playback context is planned in the schema, but not yet carried through shared app-facing contracts and seed-level public URL generation.
