# Planner Handoff: Canonical Catalog Serving Round E Follow-up

## Task summary

Round E was blocked because public list discovery and list pages still bypass the published catalog backend.

This follow-up is intentionally narrow. It exists to finish the missing list-facing portion of Round E:

- `/lists` must read published backend list data only
- `/list/[publicId]` must read published backend list data only
- homepage featured-list discovery must stop reading withdrawn seed helpers
- canonical `/watch?...&list=...&li=...` and `/list/<publicId>` identity must remain intact
- no staging/review leakage is allowed
- no source-health workflow is introduced yet

Round E is not complete until public browse, search, detail, watch, and list surfaces all serve from published backend reads.

## Execution order

1. `planner`
- publish this follow-up handoff

2. `data-catalog`
- add any missing published list-directory and list-detail backend contracts and service functions

3. `search-filter`
- rewire homepage featured-list discovery if it still flows through browse/search page data

4. `ui-shell`
- reconnect `/lists`, `/list/[publicId]`, and shared public list presentation surfaces to published backend data

5. `detail-player`
- only participate if watch/list context propagation needs correction after the public list migration

6. `reviewer`
- validate final published-only public serving across browse/search/detail/watch/list before merge

## Narrow scope

This follow-up covers only the remaining public list-facing gaps in Round E:

- public list-directory serving
- public list-detail serving
- homepage featured-list discovery serving
- watch/list canonical identity preservation if list migrations expose a gap

## Explicit non-goals

- no source-health workflow
- no provider adapter changes
- no review/publish redesign
- no new public search semantics
- no player redesign
- no admin workflow changes

## Required published list read model scope

The published-catalog backend must now expose public-safe list read contracts for:

- list directory discovery
- featured public lists for homepage discovery
- list detail by `publicId`
- list item watch context for canonical `/watch?...&list=...&li=...`

These contracts must be:

- published-only
- public-safe
- independent from seed helpers and withdrawn runtime catalog readers
- isolated from staging, normalized, review, and rejected state

## Public list surfaces that must stop bypassing the backend

The following surfaces are in scope for this follow-up:

- `/lists`
- `/list/[publicId]`
- homepage featured-list discovery or featured-list strip if present
- shared public list cards, list summaries, and list-link presentation surfaces used by those routes

If these surfaces currently read from seed helpers or withdrawn runtime helpers, that is the exact gap this follow-up must close.

## Ownership split

## Data Catalog owns

Round E follow-up `data-catalog` should own:

- `prisma/`
- `lib/db/`
- `lib/server/catalog/`
- shared published-list read contracts and identity resolvers

Responsibilities:

- add or complete published list-directory service functions
- add or complete published list-detail service functions
- expose public-safe featured-list discovery functions
- preserve canonical `list` and `li` public identity behavior
- ensure only published list records and published list items are exposed

`data-catalog` must **not**:

- leak staging, normalized-only, review, or rejected list state into public contracts
- make UI components fall back to seed helper data
- add source-health workflow

## Search Filter owns

Round E follow-up `search-filter` should own:

- homepage featured-list discovery wiring only if that surface still flows through browse/search page data or search-owned browse integration

Responsibilities:

- stop homepage featured-list discovery from reading withdrawn seed helpers
- consume published featured-list contracts from `data-catalog`
- keep the integration thin and public-safe

`search-filter` must **not**:

- redefine list contracts owned by `data-catalog`
- reintroduce seed-only helpers
- broaden this follow-up into general browse redesign

## UI Shell owns

Round E follow-up `ui-shell` should own:

- `/lists`
- `/list/[publicId]`
- shared public list presentation surfaces in `app/`, `components/`, and `styles/`

Responsibilities:

- reconnect public list directory and list detail pages to published backend reads
- preserve the existing public presentation structure unless a small integration adjustment is required
- keep public list presentation free of staging/review/operator state

`ui-shell` must **not**:

- own published list business rules
- bypass published backend contracts with seed helpers
- mix in admin/review UI

## Detail Player owns

Round E follow-up `detail-player` participates only if list migration exposes a watch-context issue.

Possible responsibilities:

- preserve or repair `list` / `li` propagation in canonical watch links after the public list pages switch to backend data
- confirm list-context watch entry still resolves through published identity

`detail-player` should not participate unless the list migration reveals a concrete watch/list context regression.

## Public identity rules

The follow-up must preserve:

- canonical `/list/<publicId>`
- canonical `/watch?...&list=...&li=...`
- stable item-level list context when moving from list page to watch page

The migration must not:

- replace public IDs with slugs
- leak internal IDs into public URLs
- drop `list` / `li` from watch entry links generated by public list pages

## No-leakage rule

Public list discovery and list pages must not surface:

- unpublished lists
- staging or review queue data
- rejected list content
- operator notes or audit state
- withdrawn seed-only fallback data

Only published public list data belongs in these public surfaces.

## Data Catalog implementation checklist

### 1. Complete published list backend contracts

- add or finish published list directory read functions
- add or finish published list detail read functions
- add or finish featured public list discovery functions

### 2. Preserve public-safe list identity

- ensure returned contracts include the data needed to preserve `/list/<publicId>` and `/watch?...&list=...&li=...`
- keep public IDs stable and explicit

### 3. Keep list reads published-only

- ensure no staging/review-only records can appear in list directory, featured-list discovery, or list detail reads

## Search Filter implementation checklist

### 1. Remove homepage featured-list seed dependency

- if homepage featured-list discovery still flows through browse/search-owned data wiring, move it onto the published list discovery contract
- keep query behavior and page composition stable

### 2. Keep integration narrow

- do not broaden this into unrelated homepage/search work
- only repair the featured-list backend source

## UI Shell implementation checklist

### 1. Reconnect public list directory

- `/lists` must render from published list directory backend data only
- no seed helper fallback should remain as the primary read path

### 2. Reconnect public list detail

- `/list/[publicId]` must render from published list detail backend data only
- list item links must preserve canonical watch/list identity

### 3. Preserve public presentation discipline

- keep these routes public-facing, not admin-facing
- do not surface staging, review, or operator state in UI

## Detail Player implementation checklist

### Only if needed after list migration

- verify `list` / `li` propagation survives the move from seed-backed list pages to published backend list pages
- repair watch/list context propagation only if the list migration exposes a bug

## Reviewer acceptance checklist

## 1. `/lists` is published-backend only

- confirm `/lists` reads from published list backend contracts
- confirm it no longer depends on withdrawn seed helpers

## 2. `/list/[publicId]` is published-backend only

- confirm `/list/[publicId]` reads from published list backend contracts
- confirm no staging/review/rejected state leaks into the page

## 3. Homepage featured-list discovery is published-backend only

- confirm homepage featured-list discovery no longer reads withdrawn seed helpers
- confirm it now uses published list discovery/backend contracts only

## 4. Canonical public list/watch identity is preserved

- confirm `/list/<publicId>` remains canonical
- confirm list-item watch links preserve `/watch?...&list=...&li=...`
- confirm no slug or internal-ID regression appears in public URLs

## 5. No staging/review leakage

- confirm public browse/search/detail/watch/list surfaces do not expose staging-only, normalized-only, in-review, or rejected state
- confirm list pages do not leak operator metadata

## 6. No source-health workflow yet

- confirm this follow-up does not introduce health/degraded/offline list or source workflow
- confirm those concerns remain deferred

## 7. Round E completion gate

- confirm public browse, search, detail, watch, and list surfaces now all serve from published backend reads
- if list discovery or list pages still bypass the published backend, Round E remains incomplete

## Acceptance gate

Round E follow-up passes only if:

- `/lists` uses published backend list reads only
- `/list/[publicId]` uses published backend list reads only
- homepage featured-list discovery uses published backend reads only
- canonical `/list/<publicId>` and `/watch?...&list=...&li=...` identity is preserved
- no staging/review leakage appears
- no source-health workflow is introduced

The broader Round E milestone remains incomplete until public browse/search/detail/watch/list all resolve through published backend reads.
