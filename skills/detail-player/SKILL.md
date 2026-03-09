---
name: detail-player
description: Use when building the media detail route and playback shell for this streaming-style media catalog, including `app/media/[slug]`, `components/detail/`, and `components/player/`.
---

# Detail Player

Use this skill for `app/media/`, `components/detail/`, and `components/player/`.

## Workflow

1. Read `docs/architecture.md`, `docs/roadmap.md`, `types/media.ts`, `data/media.ts`, and the relevant `reference-assets/page.html` reference when layout fidelity matters.
2. Resolve the route around a catalog item identified by `slug`.
3. Split the page into focused pieces:
   - detail hero
   - metadata panel
   - actions area
   - synopsis or long-form copy
   - player shell
4. Reuse shared catalog helpers for lookup instead of embedding ad hoc data access in the route.
5. Keep the playback surface shell presentational unless the task explicitly includes playback logic.
6. Update `docs/dev-log.md` after meaningful changes.

## Rules

- The detail route should compose around the shared media schema, not invent a parallel shape.
- Keep detail components under `components/detail/` and player-specific chrome under `components/player/`.
- Preserve a clean boundary between metadata rendering and playback resource rendering.
- Do not take ownership of shared search state or unrelated browsing pages.

## Deliverables

- `/media/[slug]` route.
- Detail subcomponents for hero, metadata, actions, and synopsis.
- Player shell component ready for later playback wiring.

## Response format

- changed files
- summary of work
- next steps
- potential risks
