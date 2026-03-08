# Roadmap

## Canonical sequence

The implementation order for this project is fixed:

1. Planner
2. Data Catalog
3. UI Shell
4. Search Filter
5. Detail Player
6. Reviewer

This order exists because later agents depend on contracts created by earlier ones. The Coordinator should not bypass it unless a task is explicitly documentation-only.

## Phase 1: Planner Baseline

Planner:
- Freeze the route map and file ownership boundaries
- Publish the project tree, route composition, and dependency order
- Translate `web-to-colon/main.html` and `web-to-colon/page.html` into explicit route expectations for:
  - homepage
  - category pages
  - search
  - detail page

Exit criteria:
- `docs/architecture.md` and `docs/roadmap.md` describe the full streaming-style delivery plan
- downstream agents have a concrete handoff for what to build and what to defer

## Phase 2: Shared Catalog Contracts

Data Catalog:
- Define `MediaItem` and any supporting title, source, episode, and resource contracts
- Add reusable mock catalog data for homepage, category pages, search, and detail routes
- Add helpers for slug lookup, category slicing, and browsing feed assembly
- Ensure the shared catalog shape supports the reference-informed card and detail surfaces before downstream agents wire routes

Reference targets:
- browsing cards need status, rating, type, year, poster, and availability stats
- detail views need alternate title, metadata lists, synopsis, player sources, optional episodes, and download resources

Exit criteria:
- shared catalog contracts exist and are stable enough for UI, Search, and Detail work
- downstream agents no longer need page-local placeholder schemas

## Phase 3: Shared Browsing Shell

UI Shell:
- Build or refine the shared browsing shell for `/`
- Extend the same shell to `/movie`, `/series`, and `/anime`
- Keep the layout aligned with `web-to-colon/main.html`:
  - compact navbar
  - search area
  - filter controls
  - dense poster grid
  - pagination shell

Exit criteria:
- homepage and category pages share a consistent browsing language
- the shared card, grid, filter, and pagination primitives are in place for search reuse

## Phase 4: URL-Backed Search

Search Filter:
- Implement URL parsing and normalization for query, type, sort, page, and lightweight facets
- Build `/search` on top of the shared catalog and browsing shell
- Preserve the same reference-informed search/filter/grid structure instead of introducing a separate search UI model

Reference targets:
- desktop search should be compatible with hot-search behavior
- mobile search should fit the same route model
- results should stay in the shared poster-grid system

Exit criteria:
- `/search` responds to URL state
- filters, sorting, and pagination stay in sync with the URL

## Phase 5: Detail and Playback Surface

Detail Player:
- Build `/media/[slug]`
- Add the detail header, metadata, actions area, synopsis, player shell, optional episode selector, and download resources
- Keep the layout hierarchy aligned with `web-to-colon/page.html`

Reference targets:
- poster plus metadata header
- rating and credits
- long-form synopsis
- multi-source player surface
- episodic controls when applicable
- provider-grouped download resources with action buttons

Exit criteria:
- detail routes resolve catalog entries by slug
- detail pages render both metadata and playback/download surfaces from shared contracts

## Phase 6: Review and Polish

Reviewer:
- Audit the integrated result after Planner, Data Catalog, UI Shell, Search Filter, and Detail Player work have landed
- Check responsive consistency, ownership adherence, route drift, and layout fidelity against the planner docs
- Flag missing handoffs, duplicated responsibilities, or cross-route inconsistencies

Exit criteria:
- the integrated product remains aligned with the documented architecture
- open issues are documented instead of being left implicit

## Milestone handoffs

1. Planner -> Data Catalog
- Hand off the route map, component boundaries, and data expectations implied by the references

2. Data Catalog -> UI Shell
- Hand off shared media contracts and mock records that match homepage, category, search, and detail needs

3. UI Shell -> Search Filter
- Hand off reusable browsing primitives and route shells that search can wire without restructuring

4. Search Filter -> Detail Player
- Hand off shared query and pagination expectations while leaving detail contracts untouched

5. Detail Player -> Reviewer
- Hand off the completed cross-route implementation for final audit
