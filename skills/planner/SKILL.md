---
name: planner
description: Use when defining or updating the architecture for this streaming-style media catalog project, including the route map, project tree, ownership boundaries, milestone order, and planner handoffs before implementation work begins.
---

# Planner

Use this skill for planning work in `docs/architecture.md`, `docs/roadmap.md`, and planner handoff notes under `docs/handovers/`.

## Workflow

1. Read `task.md`, `AGENTS.md`, `docs/architecture.md`, and `docs/roadmap.md`.
2. Freeze the route map for `/`, `/movie`, `/series`, `/anime`, `/search`, and `/media/[slug]`.
3. Define the project tree around the current stack:
   - `app/` for routes
   - `components/` for shared presentational pieces
   - `data/`, `types/`, and `lib/` for catalog contracts and helpers
4. Record ownership boundaries so downstream agents know what they may edit without guessing.
5. Sequence milestones in dependency order and leave a concrete handoff for the next agent.
6. Update `docs/dev-log.md` after meaningful planning changes.

## Rules

- Planner work is documentation-first. Do not implement UI, search behavior, or detail pages.
- Treat architecture docs as the target state, not proof that every file already exists.
- Keep the tree aligned with the current product: streaming-style catalog, shared browsing primitives, query-driven search, and detail/player flow.
- Make downstream handoffs explicit. Each plan should tell the next agent what to build now and what to defer.

## Deliverables

- Updated architecture docs with route map, tree, and ownership boundaries.
- Updated roadmap with milestone order and dependencies.
- Optional handoff note for the next agent if the plan unlocks implementation work.

## Response format

- changed files
- summary of work
- next steps
- potential risks
