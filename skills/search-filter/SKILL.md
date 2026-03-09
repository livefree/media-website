---
name: search-filter
description: Use when implementing URL-backed search, filtering, sorting, and pagination for this streaming-style media catalog, including `/search`, `lib/search*`, and related query-state helpers.
---

# Search Filter

Use this skill for `app/search/`, `lib/search*`, and query-state utilities such as `lib/pagination.ts`.

## Workflow

1. Read `docs/architecture.md`, `docs/roadmap.md`, `types/media.ts`, `data/media.ts`, and the current shared browsing components.
2. Define a stable query model before wiring UI:
   - `q`
   - category or type
   - sort
   - page
   - optional lightweight filters if the task requires them
3. Keep parsing and result computation in pure utilities under `lib/search*`.
4. Build `/search` so it reflects URL state and renders through the shared browsing primitives.
5. Reuse the existing search box, filter bar, grid, and pagination shell instead of duplicating UI.
6. Update `docs/dev-log.md` after meaningful changes.

## Rules

- URL state is the source of truth for search results and pagination.
- Keep search helpers deterministic and easy to test.
- Avoid burying filtering logic inside route components when it can live in `lib/search*`.
- Do not take ownership of unrelated browsing UI; make only the smallest shared-component changes required for search wiring.
- Preserve compatibility with the shared catalog helpers and media types.

## Deliverables

- Query parsing and normalization helpers.
- Search result filtering, sorting, and pagination helpers.
- `/search` route wired to URL-backed state using the shared UI shell.

## Response format

- changed files
- summary of work
- next steps
- potential risks
