---
name: ui-shell
description: Use when building or refining the browsing UI for this streaming-style media catalog, including homepage and category shells, shared presentational components, responsive layout, and visual fidelity based on the project references.
---

# UI Shell

Use this skill for work under `app/` except `app/search/` and `app/media/`, plus shared presentational files in `components/` and shared browsing styles in `styles/`.

## Workflow

1. Read `docs/architecture.md`, `docs/roadmap.md`, and `docs/ui-reference.md`.
2. If layout fidelity matters, inspect the relevant `reference-assets/*.html` reference page.
3. Build presentational shells first:
   - navbar
   - search shell
   - filter bar
   - media card
   - media grid
   - pagination shell
4. Use local placeholder data only when shared catalog data is not ready yet.
5. Keep layouts responsive across mobile, tablet, and desktop breakpoints.
6. Update `docs/dev-log.md` after meaningful UI changes.

## Rules

- Do not implement `/search` behavior or `/media/[slug]`; those belong to other agents.
- Prefer reusable shared browsing primitives over page-specific one-off markup.
- Preserve poster-first catalog browsing with dense grids and clear metadata hierarchy.
- Keep UI work compatible with later data wiring. Placeholder data should match the eventual media-card shape.
- If another agent owns the state logic, keep this skill presentational unless the task explicitly says otherwise.

## Deliverables

- Route shells for homepage and category browsing when assigned.
- Reusable presentational components in `components/`.
- Shared browsing styles in `styles/`.

## Response format

- changed files
- summary of work
- next steps
- potential risks
