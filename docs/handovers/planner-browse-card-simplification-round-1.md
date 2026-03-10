# Planner Handoff: Browse Card Simplification Round 1

## Task summary

Browse Card Simplification Round 1 is a presentation-only cleanup of the shared catalog card surface used across homepage, browse, search, and public list contexts.

This round should reduce the card body to the minimum copy needed under the poster:

- `movie`: title only
- `series` / `anime`: title plus a compact episode-count line

It must remove the current stream/download/stat pill copy without changing routes, poster badges, links, or the broader grid structure.

## Execution order

1. `planner`
- publish this handoff

2. `ui-shell`
- simplify the shared browse-card copy and layout in the owned card surface

3. `reviewer`
- validate simplified copy, card consistency, and non-regression of links/badges/grid presentation

## Ownership boundaries

### UI Shell owned scope

- `components/`
- `styles/`
- any shared card-presentational UI owned by the browse shell

### Reviewer scope

- docs and runtime/visual validation only
- no implementation takeover of UI-owned files

## In scope

- removing the `Streams` / stats pill area from shared browse cards
- removing the current year/type metadata row from the visible card body if it is no longer needed to satisfy the simplified spec
- rendering only the title for movie cards
- rendering the title plus a compact episode-count line for series/anime cards
- keeping poster badges, links, poster area, and grid structure intact

## Out of scope

- changing routes
- changing poster badges or poster-level overlay logic
- changing card click targets
- changing broader grid density or responsive grid structure
- redesigning browse headers, filters, or search layout
- player, detail, or database work

## UI Shell implementation checklist

### 1. Remove stats copy

- Remove the visible `media-stats` pill area from the shared card body.
- Do not replace it with another verbose metadata block.

### 2. Simplify card body by media type

- For `movie` cards, show only the title under the poster.
- For `series` and `anime` cards, show:
  - the title
  - one compact secondary line communicating current contained episode count

### 3. Keep supporting surfaces stable

- Do not change public entry links.
- Do not change poster badge positions or behavior.
- Do not disturb the shared grid layout or poster aspect treatment.

### 4. Keep the episode-count line compact

- The secondary line should read as lightweight supporting copy, not a replacement metadata row.
- It should stay short and scan-friendly for dense grids and lists.

## Recommendation on episode-count data

Based on the current shared card surface in [MediaCard.tsx](/Users/livefree/projects/media-website-v2/components/MediaCard.tsx), the card currently consumes:

- `title`
- `yearLabel`
- `typeLabel`
- `stats`

There is no obvious dedicated browse-card field in the current card surface for a compact episode-count line.

### Recommendation

Prefer a light shared data-contract tweak over deriving the count from the existing `stats` pill copy.

Recommended direction:

- add a dedicated browse-card field such as `episodeCountLabel` or equivalent for `series` / `anime`
- leave it absent for `movie`

### Why

- deriving from `stats` is brittle and couples the simplified UI to a removed copy structure
- a dedicated field keeps the new compact card body explicit and stable
- it avoids future copy parsing or assumptions like “the first stat pill happens to be episode count”

If the existing shared card model already contains a non-visible explicit episode-count field elsewhere in UI-owned inputs, UI Shell can reuse it. But from the current `MediaCard` surface alone, a small data-contract tweak is the safer recommendation.

## Reviewer acceptance checklist

### 1. Stats removal

- Confirm browse cards no longer show `Streams` or similar stat pills.
- Confirm no replacement verbose stat row appears.

### 2. Movie card simplification

- Confirm movie cards show only the title under the poster.
- Confirm movie cards no longer show the removed stats area or an unnecessary metadata row.

### 3. Series/anime compact secondary line

- Confirm series and anime cards show the title plus a compact episode-count line.
- Confirm that line is visibly lightweight and not a dense metadata block.

### 4. Non-regression checks

- Confirm poster badges still render correctly.
- Confirm links still open the same destinations.
- Confirm shared grid alignment and poster treatments do not regress.
- Confirm homepage, browse, search, and list card surfaces stay visually consistent where they reuse the shared card.

## Acceptance criteria

Round 1 passes only if:

- the shared browse-card body no longer shows stream/download/stat pill copy
- movie cards show only the title under the poster
- series/anime cards show the title plus a compact episode-count line
- links, poster badges, and broader grid structure remain unchanged
- reviewer confirms the simplified presentation across the touched shared card surfaces

Round 1 fails if:

- stat pills remain visible
- movie cards still show extra metadata rows
- series/anime cards do not expose a compact episode-count line
- card links, poster behavior, badges, or grid alignment regress

## Recommendation summary

This round should stay small:

- UI Shell removes the stats-heavy card body
- UI Shell keeps movie cards title-only
- UI Shell keeps series/anime cards title-plus-episode-count
- if needed, a minimal shared browse-card data tweak should be added for a dedicated episode-count label rather than reusing `stats` copy indirectly
