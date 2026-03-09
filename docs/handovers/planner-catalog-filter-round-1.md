# Planner Handoff: Catalog Filter Round 1

## Task summary

Catalog Filter Round 1 is a browse/search refinement pass across `/`, `/movie`, `/series`, `/anime`, and `/search`.

This round has four goals only:

1. remove the redundant quick-filter chip row from the browse/home filter section
2. make `Sort`, `Type`, `Genre`, `Region`, and `Year` genuinely selectable
3. remove the `Apply` button and make filter changes update live
4. expand catalog coverage for filter testing, including DB-oriented staging or import payloads where practical

This is not a player/detail task and must not broaden into unrelated browse redesign.

## Exact owned-file boundaries

### Data Catalog owned scope

- `data/`
- `types/`
- `lib/media*`
- import payloads or staging data only where needed to support broader catalog coverage and filter testing

### UI Shell owned scope

- `components/FilterBar.tsx`
- `components/BrowseCatalogPage.tsx`
- related browse/search presentation files inside `components/`, `app/`, and `styles/` only where needed to remove the redundant quick-filter row and keep the filter section coherent without an `Apply` button

### Search Filter owned scope

- `lib/search*`
- `app/search`
- browse-route query plumbing required to make facet selection live and URL-backed on `/`, `/movie`, `/series`, and `/anime`

### Reviewer scope

- runtime/browser validation against the active task
- dataset-aware validation that filters, counts, pagination, and route state behave correctly
- no implementation takeover of Data Catalog, UI Shell, or Search Filter owned files

### Out of scope

- `app/media/`
- `components/player/`
- `components/detail/`
- unrelated navbar redesign
- unrelated card/grid restyling
- backend/auth/admin/player productionization work

## Concrete execution order

1. `planner`
- publish this handoff

2. `data-catalog`
- expand the catalog dataset so browse and search routes have enough media variety to exercise type, genre, region, year, sort, and pagination combinations
- expand matching DB-oriented staging or import payloads where practical so broader coverage is not trapped only in the UI mock layer

3. `ui-shell`
- remove the redundant quick-filter chip row from the browse/home filter section
- remove the visible dependency on an `Apply` button from the filter layout
- keep the filter section visually coherent after those controls are removed

4. `search-filter`
- make `Sort`, `Type`, `Genre`, `Region`, and `Year` actually selectable
- ensure browse and search results react live when those controls change
- keep active filter state URL-backed so refresh, navigation, and shareable URLs preserve the chosen facets

5. `reviewer`
- validate the result in-browser against the expanded dataset before merge
- confirm no duplicate quick-filter row remains and no dead placeholder facets remain

## Data Catalog implementation checklist

- Add enough media records to create meaningful variation across:
  - movie / series / anime type
  - multiple genres
  - multiple regions
  - multiple years
  - enough total results to exercise pagination and sort changes
- Keep the shared catalog shape stable for downstream UI and filter consumers.
- Where the repo already contains DB-oriented staging or import payloads, expand them in parallel when practical so broader catalog coverage is represented beyond the immediate UI seed layer.
- Do not spend this round building new backend systems; this is data coverage for filter realism and testing.

## UI Shell implementation checklist

- Remove the top-row quick-filter chips that repeat `Latest / Popular / Movies / Series / Anime / Top rated`.
- Keep the browse filter section readable and balanced after that row is removed.
- Remove the `Apply` button from the filter presentation.
- Do not convert this task into a broader browse-header redesign.
- Keep the filter controls ready for live-update behavior from Search Filter rather than submit-button behavior.

## Search Filter implementation checklist

- Make `Sort`, `Type`, `Genre`, `Region`, and `Year` controls drive real result changes on browse and search routes.
- Preserve URL-backed state for the active query and facets.
- Update results immediately on control changes instead of waiting for an `Apply` action.
- Keep pagination, counts, and visible grid state synchronized with the current filters.
- Ensure browse routes and `/search` use the same facet semantics where applicable.

## Reviewer validation sequence

Reviewer sign-off must include runtime/browser validation against the expanded dataset.

### 1. Filter section cleanup

- Open the homepage browse filter section.
- Confirm the redundant quick-filter chip row is gone.
- Confirm there is no `Apply` button.

### 2. Live facet behavior

- Change `Sort`, `Type`, `Genre`, `Region`, and `Year` controls one at a time.
- Confirm results react immediately without a separate submit action.

### 3. URL-backed state

- Confirm the current facet state is reflected in the URL.
- Refresh the page and verify the chosen facets persist.
- Navigate between supported browse routes and verify the intended route scope and active facets remain coherent.

### 4. Dataset coverage checks

- Use the expanded catalog to verify that each facet can both narrow and broaden result sets.
- Confirm there is enough data variety to observe meaningful differences in type, genre, region, year, sort order, and pagination.

### 5. Grid/count/pagination checks

- Confirm result counts and visible cards update correctly when filters change.
- Confirm pagination updates consistently with the filtered result set.
- Confirm no dead facet combination leaves obviously broken UI state.

## Acceptance gate

Catalog Filter Round 1 passes only if:

- the redundant quick-filter row is removed from the browse/home filter section
- `Sort`, `Type`, `Genre`, `Region`, and `Year` are genuinely selectable and visibly affect results
- filtering updates live without an `Apply` button
- active filter state remains URL-backed
- the expanded catalog data is broad enough to exercise filter and pagination behavior credibly
- reviewer confirms the behavior in the browser against the expanded dataset

This round fails if the quick-filter row remains, if the facet controls are still placeholder UI, if filtering still depends on an `Apply` button, or if the catalog remains too thin to verify the filter behavior with confidence.
