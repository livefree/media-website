# Engineering Review

Date: 2026-03-10

## Summary

The codebase is no longer in a chaotic prototype state. Route direction, player behavior, browse/search semantics, and the public URL model are generally consistent. The main quality gap is not random inconsistency; it is concentrated technical debt in a few high-change surfaces.

## Findings

### 1. Player logic is too concentrated

- File: `components/player/PlayerShell.tsx`
- Risk level: medium

`PlayerShell.tsx` currently combines transport state, keyboard shortcuts, autoplay intent, resume persistence, immersive chrome state, episode switching, popup state, routing, and rendering. This makes player changes expensive and increases regression risk whenever one behavior is refined.

Relevant areas:

- state/timers and transport setup near `components/player/PlayerShell.tsx:320`
- immersive visibility logic near `components/player/PlayerShell.tsx:500`
- UI render surface from `components/player/PlayerShell.tsx:1076` onward

### 2. Watch-route resolution logic is duplicated

- Files:
  - `app/watch/page.tsx`
  - `app/media/[slug]/page.tsx`
- Risk level: medium

The canonical `/watch` route and the compatibility `/media/[slug]` route both carry their own episode/resource/download resolution helpers. They use different identities (`publicId` vs `slug`) but the logic pattern is nearly the same. This is a future drift risk whenever playback selection rules change.

Relevant areas:

- `app/watch/page.tsx:22`
- `app/media/[slug]/page.tsx:15`

### 3. Browse-card contract has drifted from the UI

- Files:
  - `types/media.ts`
  - `lib/media-utils.ts`
  - `components/MediaCard.tsx`
- Risk level: low to medium

The current browse card UI no longer uses the old metadata/stats fields, but the shared card type and builder still compute and carry them. This is mild redundancy today, but it will make future refactors noisier and blur the real shared contract.

Relevant areas:

- `types/media.ts:182`
- `lib/media-utils.ts:245`
- `components/MediaCard.tsx:7`

### 4. State documentation is stale

- File: `docs/current-state-overview.md`
- Risk level: low

The overview doc still reports date `2026-03-09` and version `0.7.0`, while the project is now materially beyond that state. This does not break runtime behavior, but it weakens operational clarity.

Relevant area:

- `docs/current-state-overview.md:1`

## Recommended improvements

### Near term

1. Split `PlayerShell` into hooks and smaller render modules
   - suggested seams: resume/progress, autoplay intent, immersive idle manager, keyboard shortcuts, episode navigation, transport bar UI

2. Create a shared watch-state resolver module
   - move query parsing and source/download/episode resolution into one shared utility used by both `/watch` and `/media/[slug]`

3. Trim the browse-card contract
   - remove or deprecate fields that the UI no longer consumes

4. Refresh state-of-project documentation
   - update `docs/current-state-overview.md` to the current version and feature set

### Mature-project gaps

1. Add linting and a minimum automated QA gate
   - the project currently has `build` and `typecheck`, but no enforced lint/test gate

2. Add browser interaction coverage for player flows
   - immersive hide/show
   - next-episode autoplay
   - episode selector keyboard flow
   - fullscreen/theater mode behavior

3. Move runtime reads behind a repository layer
   - the app is still primarily seed-backed; a mature implementation would unify page/API reads through DB-backed repositories

4. Reduce doc/process noise
   - the handoff archive is useful, but at this point should be periodically condensed into durable architecture/engineering docs

## Overall judgment

The project is coherent enough to continue building. The current weaknesses are concentrated and fixable. The most important improvement area is player modularity; the second is deduplicating watch-route resolution.
