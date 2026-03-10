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

### Browse Card Simplification Round 1

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Data Catalog may add the minimal shared browse-card field needed for episode-count display
3. UI Shell implements the browse-card copy and layout simplification inside the shared catalog card surface
4. Reviewer validates the simplified card copy and browse-grid presentation before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Shared browse/search/list card copy simplification for cleaner catalog presentation
- Owned surfaces:
  - Data Catalog: minimal shared browse-card contract update only if needed for episode-count display
  - UI Shell: `components/`, `styles/`, and any card-presentational shared UI it owns
  - Planner/Reviewer: docs and acceptance only
- No player changes, routing changes, database changes, or broader browse redesign beyond card copy density

Acceptance criteria:
- Browse cards must stop showing stream/download/stat pills such as `Streams`
- Card copy under the poster should only show the media title
- For `series` and `anime` cards, the card should also show the current contained episode count in a compact secondary line
- `movie` cards should not show the removed stats area or an unnecessary metadata row
- Existing links, poster behavior, badges, and grid alignment must not regress

Current user-requested improvement to implement:
1. Simplify homepage and browse video cards.
2. Remove `Streams` and similar stats from the card body.
3. Only show the title below the poster.
4. If the item is a series/anime, also show the current included episode count.

Current baseline:
- Shared browse cards currently render a title, a year/type metadata row, and up to three stat pills.
- The next refinement is a presentation-only reduction of that card copy without changing routes or poster-level badges.
