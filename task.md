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

### Catalog Withdrawal Round 1

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Data Catalog removes currently listed video titles from the runtime catalog
2. Reviewer validates that public browse/search/watch entry points no longer expose listed titles
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Withdraw all currently listed video titles from the public runtime catalog before backend development continues
- Owned surfaces:
  - Data Catalog: `data/`, `lib/media*`, `types/` only as needed for catalog withdrawal
  - Reviewer: docs and acceptance only
- No player redesign, no new ingestion architecture changes, and no route-model rewrite in this round

Acceptance criteria:
- Public browse routes must show no listed titles
- Search results must resolve to empty-state behavior rather than returning current listed titles
- Watch and compatibility entry points for withdrawn titles must no longer expose playable listed content
- Current public list/list-directory views must not expose catalog items as active listed entries
- Existing empty-state and not-found behavior must remain coherent

Current user-requested improvement to implement:
1. Remove all currently listed videos from the website before backend work continues.

Current baseline:
- The runtime catalog is still populated from the shared seed-backed `mediaCatalog`.
- Browse/search/list/watch routes currently derive their public entries from that same runtime catalog.
