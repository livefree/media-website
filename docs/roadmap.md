# Roadmap

## Phase 1: Planning and Homepage Shell

Planner:
- Lock the route map and file ownership boundaries
- Publish the project tree, routing structure, component hierarchy, and implementation sequence

UI Shell:
- Create the homepage shell for `/`
- Add shared layout primitives: navbar, search box, filter bar, media card, media grid, pagination shell
- Establish the visual system and responsive behavior for desktop and mobile

Exit criteria:
- `docs/architecture.md` reflects the agreed route/component plan
- Homepage shell exists without depending on shared dataset or query logic

## Phase 2: Shared Catalog and Category Expansion

Data Catalog:
- Define `MediaItem` and category metadata
- Add reusable mock catalog data for homepage, category pages, and detail routes
- Add data helpers for slug lookup and category slicing

UI Shell follow-up:
- Repoint homepage cards from local placeholders to shared catalog data
- Extend the same visual shell to `/movie`, `/series`, and `/anime`

Exit criteria:
- Shared media schema exists
- Category pages can render from the catalog layer with the existing UI components

## Phase 3: Search and Filtering

Search Filter:
- Implement URL query parsing
- Connect the search box, filter bar, and pagination shell to result state
- Build `/search` against the shared catalog layer
- Centralize filter, sort, and pagination utilities in `lib/search*` and `lib/pagination.ts`

Exit criteria:
- `/search` responds to query parameters
- Filter and pagination state are reflected in the URL

## Phase 4: Detail and Playback

Detail Player:
- Build `/media/[slug]`
- Add detail metadata, hero section, synopsis, action area, and player shell

Exit criteria:
- Detail route resolves catalog entries by slug
- Playback shell is integrated into the detail page layout

## Phase 5: Review and Polish

Reviewer:
- Audit responsive consistency
- Check that shared components align visually across routes
- Flag architecture drift or ownership violations

Exit criteria:
- Layout and navigation feel consistent across all pages
- Open issues are documented for follow-up instead of left implicit

## Milestone order

1. Planner
- Freeze docs and ownership boundaries
- Hand off the approved architecture to downstream agents

2. UI Shell
- Deliver `/` and the shared browsing primitives

3. Data Catalog
- Introduce the shared schema and mock catalog

4. UI Shell follow-up
- Extend the shared browsing shell to `/movie`, `/series`, and `/anime`

5. Search Filter
- Deliver `/search` with URL-backed state and pagination

6. Detail Player
- Deliver `/media/[slug]` with detail and player surfaces

7. Reviewer
- Audit consistency, responsive behavior, and architectural drift
