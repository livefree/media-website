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

### Catalog Filter Round 1

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Data Catalog expands browse/search coverage data and any matching import payloads needed for testing
3. UI Shell removes redundant top-row filter chips from the homepage filter section and keeps the section visually coherent without an Apply button
4. Search Filter implements selectable facets with URL-backed live updates on browse and search routes
5. Reviewer validates the result in-browser and against the expanded dataset before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Routes: `/`, `/movie`, `/series`, `/anime`, `/search`
- Owned surfaces:
  - Data Catalog: `data/`, `types/`, `lib/media*`, import payloads/scripts only if required for broader catalog coverage
  - UI Shell: `components/FilterBar.tsx`, `components/BrowseCatalogPage.tsx`, related browse/search presentation files, and supporting styles
  - Search Filter: `lib/search*`, `app/search`, browse-route query plumbing needed for live facet updates
- No changes to player/detail route behavior unless explicitly approved

Acceptance criteria:
- The quick-filter row that currently repeats `Latest / Popular / Movies / Series / Anime / Top rated` above the facet controls must be removed from the homepage/browse filter section
- The `Sort`, `Type`, `Genre`, `Region`, and `Year` controls must be genuinely selectable on browse and search routes rather than static placeholders
- Filtering must update results immediately from control changes without an `Apply` button
- Active filter state must remain URL-backed so refresh/share/navigation preserve the chosen facets
- The catalog dataset used for browse/search testing must be expanded enough to exercise combinations across type, genre, region, year, sort, and pagination
- Matching import payload / DB-oriented staging data should be expanded where practical so broader catalog coverage is not trapped only in the UI mock layer
- Runtime sign-off must include browser verification that filters react live, counts/grid update correctly, and no duplicate quick-filter row remains

Current user-requested improvement to implement:
1. Remove the `Latest`/`Popular`/`Movies`/`Series`/`Anime`/`Top rated` button row from the filter section because it duplicates the top navigation scope controls.
2. Make the `Sort`, `Type`, `Genre`, `Region`, and `Year` controls actually filter the page.
3. Remove the `Apply` button and make filtering live-update.
4. Fill the catalog and database-oriented staging data with more media so the filter behavior can be tested comprehensively.

Current baseline:
- Browse/search routes already have partial URL-backed query logic in `lib/search-filter.ts`, but the homepage browse filter section is still mostly presentational.
- The quick-filter chip row duplicates higher-level navigation/scope controls and wastes space.
- The current catalog seed set is too small for confident end-to-end filter coverage.
