---
name: data-catalog
description: Use when building or maintaining the data layer for a streaming-style media platform, including database schema design, media catalog types, mock seed data, playback/download resource modeling, user data, and browse/watch analytics derived from the `web-to-colon` reference.
---

# Data Catalog

Use this skill for work under `data/`, `types/`, `lib/media*`, and any database schema needed to support a streaming-style catalog.

## Workflow

1. Read `docs/architecture.md`, `docs/roadmap.md`, and the relevant `web-to-colon/*.html` page.
2. Split the work into two layers:
   - Persistence contracts in `prisma/`
   - App-facing contracts in `types/`, `data/`, and `lib/media*`
3. Model around the canonical chain:
   - `MediaTitle -> Season -> Episode -> Resource`
   - `User -> SearchQuery / BrowseEvent / WatchProgress / PlaybackSession`
4. Keep metadata normalized, but keep mock catalog records denormalized enough for UI rendering.
5. Expose helpers that downstream agents can use for slug lookup, category slicing, and homepage/category feed assembly.
6. Update `docs/dev-log.md` after meaningful changes.

## Rules

- Prefer a relational schema with explicit enums for lifecycle and availability state.
- Separate media metadata from playback/download resources. Resource health changes faster than title metadata.
- Treat browse/search/playback analytics as append-only events.
- Keep resume state in a dedicated progress record instead of deriving it from raw events.
- When the UI is ahead of the backend, provide shared mock data that already matches the long-term schema shape.
- Keep app-facing types stable and ergonomic even if the persistence layer is more normalized.
- Ensure mock data covers movie, series, and anime routes plus detail/player use cases.

## References

- Read `references/streaming-schema.md` for the entity map and schema invariants.
- Read `references/web-to-colon-mapping.md` to map the reference pages into catalog, resource, and behavior tables.

## Deliverables

- Shared types first.
- Mock data that covers movie, series, and anime branches.
- Pure helper functions in `lib/media*` that downstream agents can reuse.

## Response format

- changed files
- summary of work
- next steps
- potential risks
