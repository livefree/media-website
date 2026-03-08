# Architecture

Framework:
- Next.js App Router
- TypeScript
- Shared UI components with portable styling in `app/` and `styles/`

Product shape:
- A streaming-style media catalog with a homepage, category pages, query-driven search, and a media detail route
- Delivery order remains UI shell first, then shared catalog data, then search state, then detail/player behavior

Note:
- The tree below is the target project architecture, not a claim that every file already exists in the repository

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
  player/
    PlayerShell.tsx

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

## Routing structure

`/`
- Homepage shell
- Includes navbar, search box, filter bar, featured grid, and pagination shell

`/movie`
- Movie catalog page
- Reuses the shared browsing primitives with movie-only catalog slices

`/series`
- Series catalog page
- Reuses the shared browsing primitives with series-only catalog slices

`/anime`
- Anime catalog page
- Reuses the shared browsing primitives with anime-only catalog slices

`/search`
- Query-driven results page
- Owns URL search param parsing, filtering, sorting, result counts, and pagination state

`/media/[slug]`
- Media detail page
- Owns artwork, metadata, synopsis, action area, and player shell entry point

## Component tree

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

## Ownership boundaries

Planner:
- `docs/architecture.md`
- `docs/roadmap.md`
- planner handoffs in `docs/handovers/`

UI Shell:
- `app/` except `app/search/` and `app/media/`
- shared presentational files in `components/`
- shared styling in `styles/`

Data Catalog:
- `data/`
- `types/`
- `lib/media*`
- category metadata and reusable mock dataset

Search Filter:
- `app/search/`
- `lib/search*`
- `lib/pagination.ts`
- query state, filtering, sorting, and pagination behavior

Detail Player:
- `app/media/`
- `components/detail/`
- `components/player/`
- detail layout and playback surface

Reviewer:
- consistency review only
- may suggest fixes but should not restructure the architecture

## Integration notes

Phase 1:
- UI Shell may use local placeholders in UI-owned files to prove layout only
- Shared catalog contracts stay deferred until Data Catalog lands

Phase 2:
- Data Catalog introduces `MediaItem`, shared categories, and mock media records
- Homepage and category routes switch to shared data access

Phase 3:
- Search Filter reads from the shared catalog layer and maps URL state into filtered result sets

Phase 4:
- Detail Player resolves a media record by `slug` and renders the detail/player stack
