# Architecture

Framework:
- Next.js App Router
- TypeScript
- Shared UI components with portable styling in `app/` and `styles/`

Product shape:
- A streaming-style media catalog with shared browsing routes, URL-backed search, and a detail route with playback and download resource shells
- Delivery order is fixed around the dependency chain `planner -> data-catalog -> ui-shell -> search-filter -> detail-player -> reviewer`

Reference basis:
- `web-to-colon/main.html` defines the browsing shell for homepage, category browsing, and search-adjacent UI
- `web-to-colon/page.html` defines the detail-page composition, player area, episode switching, and download-resource expectations

Note:
- The tree below is the target project architecture, not proof that every file already exists yet

## Project tree

```text
app/
  layout.tsx
  globals.css
  page.tsx
  movie/
    page.tsx
  series/
    page.tsx
  anime/
    page.tsx
  search/
    page.tsx
  media/
    [slug]/
      page.tsx

components/
  Navbar.tsx
  SearchBox.tsx
  FilterBar.tsx
  MediaCard.tsx
  MediaGrid.tsx
  Pagination.tsx
  detail/
    DetailHero.tsx
    DetailMeta.tsx
    DetailActions.tsx
    DetailSynopsis.tsx
    DownloadResources.tsx
  player/
    PlayerShell.tsx
    EpisodeSelector.tsx
    SourceTabs.tsx

data/
  media.ts
  categories.ts

types/
  media.ts

lib/
  media-catalog.ts
  media-utils.ts
  search-params.ts
  search-filter.ts
  pagination.ts

styles/
  homepage.css
  catalog.css
  detail.css

docs/
  architecture.md
  roadmap.md
  dev-log.md
  handovers/
```

## Route map

`/`
- Homepage shell
- Should mirror the `web-to-colon/main.html` hierarchy:
  - compact top navbar
  - desktop search input with hot-search dropdown
  - mobile search surface
  - filter controls beneath search
  - dense poster grid
  - static pagination shell

`/movie`
`/series`
`/anime`
- Category browsing shells
- Reuse the same shared browsing primitives as `/`
- Change only the active category context and dataset slice
- Preserve the same filter bar, dense card grid, and pagination pattern from the homepage reference

`/search`
- Query-driven results page
- Reuses the same browsing shell as `/movie`, `/series`, and `/anime`
- Adds URL-backed state for:
  - query text
  - type
  - sort
  - optional genre, region, and year facets
  - page
- Search results should still read like a reference-informed catalog page rather than a separate product surface

`/media/[slug]`
- Media detail page
- Should mirror the composition implied by `web-to-colon/page.html`:
  - poster and metadata header
  - title plus alternate title
  - year, country, genre list, rating, director, and cast
  - action area
  - long-form synopsis block
  - multi-source player shell
  - episode selector when the media item is episodic
  - download-resource section with provider tabs and actions

## Reference-informed layout expectations

### Browsing shell

Homepage, category pages, and search should all inherit the same browsing language from `web-to-colon/main.html`:

- Compact navbar with first-class routes for movie, series, and anime
- Search box that can support a hot-search dropdown on desktop and a dedicated mobile search flow
- Filter controls that mix quick chips and labeled select-style facets
- Dense poster-first grid with 2:3 artwork and metadata underneath
- Card overlays for status, rating, and availability when the data supports them
- Pagination at the bottom of the grid for catalog continuity

### Category pages

The category routes are not separate design systems. They are filtered views over the same browsing shell:

- `/movie`, `/series`, and `/anime` should keep the homepage search and filter affordances
- the main difference is the active type context and the category-specific media slice
- category pages should be ready for the same sort, genre, region, and year controls seen in the reference

### Search page

The search route should be planned as a reference-aligned results page, not just a plain list:

- query text belongs in the URL
- the search page should preserve the shared browsing chrome
- result cards should stay identical to the shared media-card contract
- empty, partial, and paginated result states should still fit the same grid and filter system

### Detail page

The detail route should be planned around the full reference stack from `web-to-colon/page.html`:

- metadata header with poster, canonical title, alternate title, year, country, genre, rating, director, and cast
- action cluster for share or follow-up controls
- prose synopsis section with enough room for long-form copy
- source tabs for multiple playback providers
- episode selector for series-like content
- aspect-video player shell
- download-resource section with provider grouping, quality labels, copy/open actions, and invalid-resource feedback affordances

## Component system

`RootLayout`
- `Navbar`

`HomePage`
- `SearchBox`
- `FilterBar`
- `MediaGrid`
  - `MediaCard`
- `Pagination`

`CategoryPage`
- `Navbar`
- `SearchBox`
- `FilterBar`
- `MediaGrid`
  - `MediaCard`
- `Pagination`

`SearchPage`
- `Navbar`
- `SearchBox`
- `FilterBar`
- `MediaGrid`
  - `MediaCard`
- `Pagination`

`MediaDetailPage`
- `Navbar`
- `DetailHero`
  - `DetailMeta`
  - `DetailActions`
- `DetailSynopsis`
- `PlayerShell`
  - `SourceTabs`
  - `EpisodeSelector`
- `DownloadResources`

## Ownership boundaries

Planner:
- `docs/architecture.md`
- `docs/roadmap.md`
- planner handoffs in `docs/handovers/`

Data Catalog:
- `data/`
- `types/`
- `lib/media*`
- catalog contracts, category metadata, mock media records, and media lookup helpers

UI Shell:
- `app/` except `app/search/` and `app/media/`
- shared presentational files in `components/`
- shared styling in `styles/`

Search Filter:
- `app/search/`
- `lib/search*`
- `lib/pagination.ts`
- URL state, filtering, sorting, and pagination behavior

Detail Player:
- `app/media/`
- `components/detail/`
- `components/player/`
- detail layout and playback-resource surface

Reviewer:
- consistency review only
- may suggest fixes but should not redefine the architecture

## Implementation sequence

1. Planner
- Freeze the route map, project tree, ownership boundaries, and dependency order
- Hand off reference-informed expectations to downstream agents

2. Data Catalog
- Define `MediaItem` and any related detail/resource contracts
- Provide mock records and helpers that already support:
  - homepage and category cards
  - search facets
  - detail metadata
  - playback sources
  - episodic selectors
  - download resources

3. UI Shell
- Build or refine the shared browsing shell on `/`, `/movie`, `/series`, and `/anime`
- Stay presentational and consume either placeholder or shared catalog-shaped data

4. Search Filter
- Wire `/search` to URL-backed query, filter, sort, and page state
- Reuse the shared browsing shell instead of inventing a separate search layout

5. Detail Player
- Build `/media/[slug]` around the shared catalog contracts
- Compose the metadata header, synopsis, player shell, source tabs, episode selector, and download resources

6. Reviewer
- Audit the integrated result for ownership drift, layout regressions, route drift, and missing handoffs

## Integration notes

Phase handoff constraints:
- UI Shell may use local placeholders only until Data Catalog exposes stable shared contracts
- Search Filter should not start final route wiring until the shared catalog shape and browsing shell are stable
- Detail Player should not invent ad hoc metadata or resource structures outside the shared catalog layer

Reference alignment constraints:
- Browsing routes should remain visually and structurally close to `web-to-colon/main.html`
- The detail route should remain structurally close to `web-to-colon/page.html`
- Exact implementation may simplify behavior, but the layout hierarchy should stay recognizable for homepage, category, search, and detail surfaces
