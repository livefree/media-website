# Planner Handoff: Public URL Identity Round 2

## Task summary

Public URL Identity Round 2 is the rollout round after the Round 1 identity foundation.

Round 1 introduced:

- opaque `publicId` fields for media, episodes, and resources
- a canonical `/watch` route
- compatibility support for old `/media/[slug]` links

Round 2 now shifts the app-facing public entry surfaces so they stop defaulting to compatibility links and instead default to canonical `/watch?...` hrefs.

This round also extends the shared app-facing contracts so future `list` and `li` watch context is explicitly modeled in URL composition and shared data shapes, without turning this round into a full playlist feature.

## Round 2 goals

This handoff is focused on exactly these outcomes:

1. switch remaining public media entry points from compatibility `/media/[slug]` hrefs to canonical `/watch?...` hrefs
2. extend shared contracts so future `list` and `li` watch context is first-class in app-facing URL composition
3. keep `/media/[slug]` as compatibility-only, not canonical
4. define which surfaces must migrate now and which can stay compatibility-only for this round

## Exact owned-file boundaries

### Data Catalog owned scope

- `data/`
- `types/`
- `lib/media*`
- `prisma/schema.prisma`
- import payload or planning artifacts only if needed to represent list/list-item public identity in shared data planning

### UI Shell or shared-link owner scope

- shared browse/search/recommendation entry surfaces in `app/`, `components/`, and `styles/` where public media hrefs are still composed from compatibility slug links
- this includes shared card/grid/list entry components, but not player-control redesign or unrelated layout work

### Detail Player owned scope

- `app/media/`
- `app/watch/`
- `components/player/`
- `components/detail/`

### Reviewer scope

- runtime/browser validation
- link-target validation across touched public entry surfaces
- no implementation takeover of Data Catalog, UI/shared-link, or Detail Player owned files

### Out of scope

- a full playlist feature
- queue management UI
- user list management UI
- public sharing/privacy policy for lists
- unrelated browse redesign
- unrelated player-control redesign
- removing the compatibility `/media/[slug]` route entirely

## Concrete execution order

1. `planner`
- publish this Round 2 handoff

2. `data-catalog`
- extend the shared URL and data contracts so canonical watch href generation is the default public path
- add explicit shared support for future `list` and `li` watch context

3. `ui-shell` or shared-link owner
- switch remaining browse/search/shared public entry links to canonical `/watch?...` hrefs where they still point to `/media/[slug]`

4. `detail-player`
- keep `/watch` canonical behavior intact
- keep `/media/[slug]` compatibility intact
- update detail-owned public entry links to use canonical watch hrefs where applicable
- preserve future `list` and `li` watch context when composing canonical watch URLs

5. `reviewer`
- validate that touched public entry surfaces now prefer canonical watch URLs
- validate that compatibility slug routes remain fallback-only
- validate that list/list-item identity planning is concrete in shared contracts even though full playlist playback is deferred

## Surfaces in scope this round

These surfaces should default to canonical `/watch?...` hrefs after Round 2:

### Browse and catalog entry surfaces

- homepage media cards
- category-route media cards on `/movie`, `/series`, and `/anime`
- shared media grids
- any shared browse list items or poster links that are meant to open a playable title

### Search entry surfaces

- `/search` result cards
- shared search result links
- search suggestion links if they are intended as public playback entry points

### Recommendation and related-content surfaces

- related media links on the detail/watch surface
- any shared recommendation strip or sidebar entry that opens a title for playback

### Shared public detail-entry links

- any shared helper-generated href that currently represents the default public way to open a title
- if a component uses a compatibility slug href by default but is clearly user-facing and watch-oriented, it is in scope

## Surfaces that may remain compatibility-only for now

These do not need to be fully migrated in Round 2:

- direct user-entered `/media/[slug]` URLs
- legacy bookmarks and old inbound links that rely on `/media/[slug]`
- compatibility redirects and fallback entry logic
- internal docs or examples that describe old links historically
- admin/editorial-only tools if they are not the public app-facing entry flow
- future playlist/list playback UI
- non-watch public entities such as people/collections unless they already participate in watch-entry href generation

The rule for this round is:

- canonical public app entry points must prefer `/watch?...`
- `/media/[slug]` may remain only as compatibility entry

## Data Catalog implementation checklist

### 1. Make canonical watch hrefs the default shared public href

- Shared app-facing data shapes should expose canonical watch hrefs as the primary public entry href.
- Compatibility slug hrefs may still exist, but they should be clearly secondary and used only for fallback or legacy behavior.

### 2. Extend shared contracts for future `list` and `li`

- Define list-aware watch context in shared types and URL builder inputs.
- Future list/list-item support must not remain a comment-only plan.

Recommended contract direction:

- a shared watch-context shape that can carry:
  - `mediaPublicId`
  - `episodePublicId`
  - `resourcePublicId`
  - `listPublicId`
  - `listItemPublicRef`
- app-facing records should be able to expose canonical watch hrefs built from that shape

### 3. Keep schema/data planning aligned

- If Prisma already contains nullable list-level public fields from Round 1, Round 2 should ensure shared data contracts actually reflect them.
- If list-item public identity is still only implicit, shared types should make room for it now even if there is not yet a real playlist runtime.

### 4. Avoid accidental API drift

- Shared browse cards, detail records, related cards, and search result records should compose canonical hrefs consistently.
- Do not leave one app-facing record type on slug hrefs while another silently moves to watch hrefs.

## UI Shell or shared-link owner implementation checklist

### 1. Switch remaining public entry links to canonical watch hrefs

- Replace remaining default `/media/[slug]` links on browse/search/shared catalog surfaces with canonical `/watch?...` hrefs.
- Prefer shared href helpers rather than hand-building query strings in presentation components.

### 2. Keep the migration narrow

- This is not a visual redesign round.
- Do not use this task to restyle cards, grids, headers, or filter layout unless a small change is strictly required to keep links coherent.

### 3. Preserve compatibility-only paths as non-default

- Do not remove slug compatibility routes.
- Do not keep rendering them as the primary href on public entry cards after touching the surface in this round.

## Detail Player implementation checklist

### 1. Keep canonical watch flow authoritative

- `/watch?...` remains the canonical playback entry route.
- Any detail-owned recommendations or title-entry links should prefer canonical watch hrefs.

### 2. Preserve compatibility behavior

- `/media/[slug]` remains available as a compatibility-only entry path.
- If the compatibility route redirects or resolves into canonical watch state, preserve that behavior.

### 3. Become list-aware without becoming a playlist feature

- Canonical watch-state composition should preserve `list` and `li` when they exist.
- This applies to watch-state transitions such as episode/resource changes if those transitions are composed inside Detail Player-owned files.
- Do not build playlist UI or queue controls in this round.

## Reviewer validation sequence

Reviewer sign-off must cover both canonical-entry rollout and the future list/list-item planning path.

### 1. Public entry-link audit

- Open the main browse/search/recommendation surfaces touched in this round.
- Confirm that the default user-facing media entry links now point to `/watch?...` rather than `/media/[slug]`.

### 2. Residual slug leakage check

- Confirm the canonical public entry href no longer exposes readable media slugs, episode slugs, or provider labels.
- Confirm `/media/[slug]` appears only as a compatibility path where expected.

### 3. Compatibility-path check

- Open at least one old `/media/[slug]` path.
- Confirm it still resolves correctly as a compatibility-only entry flow.

### 4. List/list-item planning check

- Review the shared app-facing contracts touched by this round.
- Confirm `list` and `li` are represented concretely in URL composition or watch-context contracts rather than being left as informal future notes.

### 5. Detail/watch-state preservation check

- If watch-state transitions are touched, confirm canonical watch URLs preserve existing `list` and `li` context when present.

## Acceptance gates

### Round 2 passes only if

- the main public media entry surfaces touched in this round now default to canonical `/watch?...` hrefs
- `/media/[slug]` remains compatibility-only rather than the default public href
- shared app-facing contracts explicitly support future `list` and `li` watch context
- canonical public watch URLs continue to avoid leaking media slugs, episode slugs, or provider labels
- reviewer confirms the canonical-entry rollout and the list/list-item planning path before merge

### Round 2 fails if

- browse/search/recommendation entry links still default to compatibility slug hrefs on touched surfaces
- list/list-item support remains only theoretical and is not represented in shared contracts
- the implementation broadens into unrelated playlist UI or browse redesign work
- canonical watch URLs regress and begin leaking readable slug/provider identity again

## Later-round items intentionally deferred

These belong to later rounds, not Round 2:

- full playlist runtime behavior
- playlist queue UI and controls
- user list management and sharing flows
- global removal of all compatibility slug routes
- non-watch public route redesign for people, collections, or editorial landing pages

## Recommendation summary

Round 2 should be treated as the public-entry migration round:

- Data Catalog makes canonical watch hrefs and list-aware watch context first-class in shared contracts
- UI/shared-link owners switch public entry surfaces to canonical `/watch?...`
- Detail Player keeps watch-state composition list-aware and compatibility-safe
- Reviewer confirms canonical public entry behavior and verifies that `/media/[slug]` is now fallback-only
