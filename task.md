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

### Public URL Identity Round 1

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Data Catalog defines the public ID model in shared types/data/schema and updates canonical media/watch href generation
3. Detail Player implements public watch-route resolution and opaque episode/resource selection handling
4. Reviewer validates the URL behavior, route compatibility, and schema/dataset implications before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Public URLs and watch/detail routing
- Owned surfaces:
  - Data Catalog: `data/`, `types/`, `lib/media*`, `prisma/schema.prisma`, and import payload/planning artifacts if required for public-ID planning
  - Detail Player: `app/media/`, new public watch route(s), `components/player/`, `components/detail/`
  - Planner/Reviewer: docs and acceptance only
- No unrelated browse redesign or player-control redesign unless explicitly required by the new public URL flow

Acceptance criteria:
- Public-facing media playback URLs must stop exposing human-readable media slugs and episode slugs
- The public playback URL scheme must support movies, episodic titles, and future playlist/list contexts
- The solution must use stable opaque public IDs rather than reversible “encrypted” strings tied to UI text
- The plan must cover both runtime URL shape and database/storage shape for media, episodes, resources, and future playlists/lists
- The implementation in this round must introduce the shared public-ID foundation and at least one working public watch URL flow
- Existing `/media/[slug]` links may remain temporarily for compatibility, but the canonical new watch URL path/query format must be defined and wired
- Reviewer sign-off must confirm the new public URL no longer leaks title/episode slugs in the primary playback URL

Current user-requested improvement to implement:
1. Replace public URLs like `/media/star-mail-courier?episode=star-mail-courier-s1e1&download=quark` with a YouTube-style opaque watch URL that does not reveal title/episode/provider details in clear text.
2. Plan the database and public-ID model so the same scheme can support movies, series/anime episodes, and future playlists/lists.
3. Develop the first implementation slice of that plan through the normal multi-agent flow.

Current baseline:
- Public media URLs and internal app links still depend heavily on human-readable slugs:
  - media detail routes use `/media/[slug]`
  - episode selection uses episode slugs in the query string
  - current watch/download state leaks readable identifiers like `star-mail-courier-s1e1` and `quark`
- The Prisma schema currently models internal `slug` fields but not a distinct public opaque identifier layer for media, episodes, resources, or user-visible lists.
