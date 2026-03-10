# Planner Handoff: Public URL Identity Rounds 3 and 4

## Task summary

Public URL Identity Rounds 3 and 4 turn the existing public-ID and canonical watch foundation into a real list-backed public flow.

Current baseline:

- Round 1 introduced opaque public IDs plus canonical `/watch?...` playback URLs.
- Round 2 moved public media entry links to canonical watch URLs and carried `list` / `li` through shared watch-context contracts.
- Shared data already includes minimal public list seed data and list-aware watch helpers.
- What is still missing is the user-facing list experience:
  - there is no real public list page yet
  - there is no user-visible public list entry flow
  - the watch page preserves list query state technically, but does not yet make list-backed playback feel like a first-class navigation mode

Rounds 3 and 4 should fix exactly that.

## Round split

### Round 3: public list page and public list entry flow

Round 3 creates a real public list page and a real public entry path into it. This round is about pages, shared data composition, and canonical list-to-watch link generation.

### Round 4: list-aware watch playback flow

Round 4 makes `/watch` visibly and behaviorally list-aware once the user arrives from a public list. This round is about watch-context preservation, list navigation expectations, and user-visible list state inside playback.

### Round 5: future planned scope only

Round 5 must be recorded as future scope only. It is not part of implementation in this task.

Planned Round 5 topics:

- fuller playlist/list management
- richer playlist-style controls
- public list sharing flows
- list authoring and reordering
- queue-style playback UX

## Recommended route and URL model for Rounds 3 and 4

Canonical watch URL remains:

```text
/watch?v=<mediaPublicId>[&e=<episodePublicId>][&r=<resourcePublicId>][&list=<listPublicId>][&li=<listItemPublicRef>]
```

Recommended canonical public list page route:

```text
/list/<listPublicId>
```

Rationale:

- `list` is already the canonical watch query key
- the route can stay opaque and public-ID based
- it cleanly separates list-page identity from watch-state identity
- it avoids falling back to readable list slugs as canonical external identity

Readable list slugs may remain as secondary metadata, but not as the canonical public list-page identity.

## Execution order

1. `planner`
- publish this Round 3/4 handoff

2. `data-catalog`
- extend shared list/page/watch contracts and canonical href composition
- make public list page data real and app-facing

3. `ui-shell`
- build the real public list page(s) and user-facing list entry flow

4. `detail-player`
- make `/watch` list-aware in visible behavior and state preservation

5. `reviewer`
- validate the list page flow, canonical URL composition, list-aware watch transitions, and that Round 5 remains future-only

## Exact ownership boundaries

### Data Catalog owned scope

- `data/`
- `types/`
- `lib/media*`
- `prisma/schema.prisma`
- import payload/planning artifacts only if needed for public-list identity planning

### UI Shell owned scope

- `app/`
- `components/`
- `styles/`

UI Shell owns the public list-page route and the list-entry surfaces because those are public browsing/layout surfaces, not player logic.

### Detail Player owned scope

- `app/media/`
- `app/watch/`
- `components/player/`
- `components/detail/`

Detail Player owns list-aware playback context inside `/watch` and any detail/player-adjacent list-navigation affordances shown there.

### Reviewer scope

- docs and runtime/browser validation only
- no implementation takeover of Data Catalog, UI Shell, or Detail Player files

## In scope

### Round 3 in scope

- one real public list page route keyed by public list identity
- real list-page data from shared contracts rather than page-local hard-coded strings
- at least one real public entry surface that lets a user discover and open a public list page
- list-page item links composed from shared canonical watch helpers using `v`, `e`, `list`, and `li`
- list item metadata sufficient for a user to understand what they are opening

### Round 4 in scope

- visible watch-page indication that playback is happening inside a list-backed context
- preservation of `list` and `li` across watch-state transitions that stay inside the same list item
- user-visible list navigation expectations when moving between items in the same list
- canonical share/copy/watch-state URLs continuing to reflect the active list context when applicable

## Out of scope

- full playlist editor or list-management UI
- user-authored list creation
- list reordering controls
- queue drawer or advanced playlist controls
- autoplay policy changes unrelated to list context
- social sharing system for lists
- removing compatibility `/media/[slug]` routes
- removing compatibility list slug concepts entirely
- major browse redesign beyond what is needed to surface public lists
- major player-control redesign beyond what is needed to expose list-aware context

## Round 3 implementation handoff

## Round 3 objective

Turn the existing shared `PublicMediaList` groundwork into a real public-facing page and entry flow.

## Round 3 recommended deliverable shape

### Canonical public list page

Recommended route:

- `/list/[publicId]`

Minimum page contents:

- list title
- list description
- list visibility label if relevant (`public` / `unlisted`)
- ordered list items with position
- item-level poster/title metadata
- canonical watch-entry link for each item

### Public list entry flow

Minimum requirement:

- at least one real public UI surface where a user can discover and open a public list page without typing the URL manually

Acceptable examples:

- a homepage featured-lists section
- a browse-shell public-lists section
- a dedicated list index page linked from a shared public surface

This round does not require every possible list entry surface. It does require at least one real user-visible flow into a real list page.

## Round 3 Data Catalog checklist

- Expose a shared app-facing record for public list pages, not just raw seed records.
- Keep canonical list-page href generation centralized and shared.
- Ensure each public list item resolves:
  - media identity
  - optional episode identity
  - canonical watch href carrying both `list` and `li`
- Enrich the existing `PublicMediaList`/`PublicMediaListItem` layer as needed so UI Shell can render a real list page without page-local identity logic.
- Keep the list-page contract aligned with future watch-page list navigation needs.

Recommended shared-contract additions if needed:

- `PublicMediaListPageRecord`
- `canonicalListHref`
- list item poster/title/subtitle presentation fields
- optional `nextItemPublicRef` / `previousItemPublicRef` planning fields if helpful for Round 4

## Round 3 UI Shell checklist

- Build the public list page route using shared data, not ad hoc hard-coded strings.
- Render ordered list items with clear clickable entry links.
- Use shared canonical hrefs for item entry, not local manual query-string assembly.
- Add at least one public entry surface that opens a list page.
- Keep the list page visually coherent with the existing browse shell, but do not turn this into a redesign round.

## Round 3 acceptance criteria

Round 3 passes only if:

- a real public list page exists
- that page is keyed by public list identity
- at least one real user-facing public entry flow leads into that page
- list items open canonical `/watch?...&list=...&li=...` URLs
- canonical list-page and watch-entry links come from shared data/helpers, not page-local string building
- reviewer can trace the flow from public list entry surface -> public list page -> canonical watch URL

Round 3 fails if:

- the list page is still only theoretical or seed-only
- the list page relies on local hard-coded href strings instead of shared canonical composition
- item links drop `list` or `li`
- the only way to reach the list page is by typing the route manually

## Round 4 implementation handoff

## Round 4 objective

Make `/watch` visibly and behaviorally list-aware once a user arrives through a public list flow.

## Round 4 watch-page expectations

When `list` is present and resolves successfully:

- the watch page should show enough UI context that a user can tell they are watching from a named public list
- the current item should be identifiable inside that list context
- the user should have a clear sense of previous/next item navigation within the list

This does not require a full queue UI. It does require visible list-backed playback context.

## Round 4 transitions that must preserve `list` / `li`

These transitions must preserve list context when they stay within the active list-backed playback flow:

- source-tab changes
- resource/provider changes
- episode changes inside the currently active list item
- reload/share/copy of the current watch URL
- next-episode transitions when the current list item represents an episodic title and the user is still inside that same list item

### List-item navigation expectations

If the UI provides previous/next list-item navigation:

- moving to another item in the list must update `v`
- it must update `li`
- it must update `e` when the target item is episode-specific
- it may clear or refresh `r` if the old resource does not belong to the new item
- it must preserve `list`

### When list context may be intentionally dropped

If the user clicks a non-list recommendation or another unrelated media entry not coming from the active list flow, leaving the current list context is acceptable.

The rule is:

- transitions inside the current list-backed watch flow preserve `list` / `li`
- transitions to unrelated public entry surfaces may intentionally start a new watch context

## Round 4 Data Catalog checklist

- Provide enough shared list metadata for `/watch` to resolve and display list context cleanly.
- Ensure the resolved list item carries display-friendly fields for watch-page context.
- If previous/next list-item navigation is planned in shared data, define it in a reusable way rather than recomputing it ad hoc in presentation code.

Recommended shared additions if needed:

- current-item list position
- total list length
- previous item reference
- next item reference
- display-safe list title/description fields available to watch-page consumers

## Round 4 Detail Player checklist

- Surface active list context in `/watch` when `list` resolves.
- Preserve `list` and `li` across the in-scope watch-state transitions above.
- Ensure watch-state href builders used inside `/watch` remain list-aware.
- If previous/next list-item navigation is added, it must be visibly tied to the current list context and must compose canonical `/watch?...` URLs using shared helpers.
- Keep compatibility `/media/[slug]` behavior intact; this round does not remove compatibility entry paths.

## Round 4 UI Shell checklist

- Only touch UI Shell surfaces if needed to support list entry or list-navigation context outside the player.
- Do not absorb watch-page list-navigation logic that belongs to Detail Player.

## Round 4 acceptance criteria

Round 4 passes only if:

- the watch page shows user-visible list-backed playback context when `list` is present
- in-scope watch-state transitions preserve `list` / `li`
- canonical watch URLs remain opaque and do not regress to slug/provider leakage
- list-item navigation, if present, composes canonical watch URLs from shared data
- reviewer can verify an end-to-end list flow from public list page into list-aware watch playback

Round 4 fails if:

- `/watch` still behaves like an isolated title page with no visible list context
- `list` / `li` is dropped during episode/resource/source transitions that should preserve it
- list navigation is implemented with page-local string building instead of shared canonical composition
- the work broadens into a full playlist-control system

## Reviewer validation sequence

Reviewer sign-off must validate both rounds separately and together.

### Round 3 reviewer checks

- open the real public list entry surface
- enter the real public list page from that surface
- verify the list page is driven by shared data
- verify item links resolve to canonical `/watch?...&list=...&li=...`
- verify no readable media or episode slug leaks into the canonical watch URL

### Round 4 reviewer checks

- open a watch URL from the public list page
- confirm the watch page exposes visible list context
- trigger source/resource transitions and verify `list` / `li` is preserved
- trigger episode transitions where relevant and verify `list` / `li` is preserved
- verify any previous/next list-item navigation composes canonical watch URLs correctly
- verify unrelated non-list entry surfaces are not forced to preserve stale list context

### Round 5 future-scope check

- confirm Round 5 is recorded as future planned work only
- confirm no implementation in this task drifts into full playlist/list-management features

## Acceptance gates by round

### Round 3 gate

Accept Round 3 only if:

- there is a real public list page
- there is a real public entry flow into that page
- item links are canonical and shared-data-driven
- list identity is public-ID based

### Round 4 gate

Accept Round 4 only if:

- `/watch` becomes visibly list-aware
- `list` / `li` survives the required watch-state transitions
- list navigation expectations are met without building a full playlist system

### Combined gate for this task

Accept the combined Rounds 3 and 4 work only if:

- a user can discover a public list
- open that list page
- enter playback through canonical list-backed watch URLs
- remain in a coherent list-backed playback flow inside `/watch`
- and reviewer confirms Round 5 remains future-only

## Round 5 recorded future scope only

Round 5 should be documented as the next likely follow-up but not implemented now.

Planned Round 5 topics:

- fuller list and playlist management
- richer playlist controls inside playback
- public list sharing/distribution flows
- editable list ordering and authoring
- stronger queue-style playback UX

## Recommendation summary

Treat this task as two tightly scoped rounds:

- Round 3 makes public lists real as pages and entry flows
- Round 4 makes `/watch` feel list-aware and stateful once entered from those lists
- Round 5 remains documented future work only
