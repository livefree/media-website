# Planner Handoff: Canonical Catalog Serving Round E

## Task summary

Round E reconnects the public application to backend data for the first time in the backend-first phase.

The goal is not “show any backend data.” The goal is:

- public browse/search/detail/watch reads must come from the published canonical catalog only
- staging, normalized-only, rejected, or still-in-review records must remain invisible to public routes

Round E builds on the accepted prior rounds:

- Round B: provider adapter and staging schema
- Round C: normalization and dedup persistence
- Round D: review queue and publish gate

Round E is the first round that should rewire public runtime reads, but only against published catalog boundaries.

## Execution order

1. `planner`
- publish this handoff

2. `data-catalog`
- implement published-catalog read boundaries, stable public identity resolution, and serving contracts

3. `search-filter`
- integrate browse/search filtering against the published catalog backend

4. `detail-player`
- integrate detail/watch reads against the published catalog backend

5. `reviewer`
- validate published-only serving, route integration discipline, public/runtime correctness, and ownership boundaries before merge

## Published catalog read model scope

Round E should establish a public read model that serves:

- browse feed slices
- category listings
- search results
- detail metadata
- watch-page playback-facing metadata
- stable public watch/list identity lookups

This read model should be:

- published-only
- public-safe
- decoupled from staging, normalization, and review persistence structures
- consumed through repository or service boundaries rather than route-local seed shortcuts

The read model should cover canonical public entities such as:

- published `MediaTitle`
- published `Season`
- published `Episode`
- published playback/download/subtitle references that are allowed to be visible in public runtime
- stable public IDs and canonical route resolution state

## What must not leak into public routes

Public browse/search/detail/watch must not read or surface:

- raw provider payloads
- staging candidates
- normalized-but-unpublished candidates
- rejected review items
- pending review items
- review notes or operator-only audit state

Round E succeeds only if this isolation is visible in both code structure and reviewer validation.

## How public routes should reconnect to backend data

Recommended rule:

1. public routes stop depending on withdrawn seed-only runtime data as their primary source
2. public routes resolve data through published-catalog service or repository boundaries
3. those boundaries expose public-safe contracts only
4. route integration does not import staging or review modules directly

Recommended public reconnection pattern:

- `data-catalog` exposes published read contracts and identity resolvers
- `search-filter` consumes published browse/search contracts for `/`, category views if in scope, and `/search`
- `detail-player` consumes published detail/watch contracts for `/media/[slug]` compatibility and `/watch`

The public runtime should still preserve:

- stable public watch/list URL identity
- compatibility route behavior where already supported
- separation between public route composition and backend query logic

## Ownership split

## Data Catalog owns

Round E `data-catalog` should own:

- `prisma/`
- `lib/db/`
- `lib/server/catalog/`
- related shared backend contracts for published public reads
- stable public identity resolution support required by browse/search/detail/watch serving

Round E responsibilities for `data-catalog`:

- define published-only repository or service boundaries
- expose public-safe read contracts for browse, search, detail, and watch
- ensure the published catalog is the only source for public reads
- keep staging/review persistence hidden behind non-public modules
- preserve stable public ID and canonical route resolution semantics

`data-catalog` must **not**:

- let public routes query staging or review tables directly
- make search/detail/watch rely on normalization or review internals
- mix source-health workflow into this round

## Search Filter owns

Round E `search-filter` should own:

- `lib/search*`
- `app/search`
- browse/search integration points needed to consume published catalog query results

Round E responsibilities for `search-filter`:

- reconnect search and filter behavior to published-catalog query results
- consume published browse/search contracts rather than route-local seed helpers
- preserve query-param semantics and user-facing search/filter behavior while the backing source changes

`search-filter` must **not**:

- read staging or review state directly
- redefine published-catalog contracts that belong to `data-catalog`
- add source-health logic

## Detail Player owns

Round E `detail-player` should own:

- `app/media/`
- `app/watch`
- `components/player/`
- `components/detail/`
- related serving integration points for published detail/watch data

Round E responsibilities for `detail-player`:

- reconnect detail and watch surfaces to published detail/watch contracts
- preserve canonical public watch/list identity behavior while the backend source changes
- use published playback-facing metadata only

`detail-player` must **not**:

- pull staging/review data into detail/watch routes
- redesign player UI beyond required data-source integration
- add source-health fallback policy yet

## Shared contract rule

If a contract defines what the public application may read from the published backend, it belongs with `data-catalog`.

If code integrates published search/filter results into browse/search route behavior, it belongs with `search-filter`.

If code integrates published detail/watch results into detail/player route behavior, it belongs with `detail-player`.

If a boundary is ambiguous, prefer:

- `data-catalog` for read-model shape and repository/service ownership
- `search-filter` for search-route integration
- `detail-player` for detail/watch integration

## Recommended published read-model concepts

Round E does not require final table names, but it should leave explicit read boundaries for:

### PublishedBrowseFeed

Public-safe browse slices and category listings.

Useful fields:

- title summary cards
- category/type labels
- year and metadata fields needed by public browse UI
- pagination and facet metadata if relevant

### PublishedSearchResult

Public-safe search items and filter metadata.

Useful fields:

- result cards
- facet counts
- pagination
- query normalization result if needed for public behavior

### PublishedDetailRecord

Public-safe detail payload.

Useful fields:

- canonical title metadata
- season/episode metadata
- public-safe synopsis/artwork/credits
- visible playback/download summary metadata

### PublishedWatchRecord

Public-safe watch payload.

Useful fields:

- public watch identity resolution
- episode/public resource selection metadata
- playback-facing metadata required by watch route composition
- list/watch canonical identity support where already part of public behavior

These read models must be sourced from published canonical records only.

## Data Catalog implementation checklist

### 1. Add published-only read boundaries

- create repository or service boundaries dedicated to public serving
- make them return public-safe read contracts
- ensure they query only published canonical records

### 2. Preserve state isolation

- keep staging, normalized, review, and audit state out of public serving contracts
- prevent route code from reaching around the published read layer

### 3. Preserve public identity

- keep stable public ID resolution and canonical URL support intact
- ensure `/watch` and list-aware identity resolution continue to work through published data

### 4. Keep source-health out of scope

- do not add health/degraded/offline source-management workflow in this round
- only serve currently published playback-facing data

## Search Filter implementation checklist

### 1. Reconnect search to published reads

- move search/filter result sourcing onto published catalog contracts
- preserve existing query-param behavior where applicable

### 2. Keep browse/search public-safe

- ensure no staging-only or rejected records can appear in search or browse results
- avoid importing review/staging modules into search route code

### 3. Keep route integration thin

- route files should consume published query results, not become ad hoc repository layers

## Detail Player implementation checklist

### 1. Reconnect detail and watch to published reads

- move detail/watch payload resolution onto published detail/watch contracts
- preserve canonical watch/list URL behavior

### 2. Keep public state clean

- ensure unpublished, rejected, or in-review records do not surface in detail/watch
- keep route integration separate from staging/review modules

### 3. Avoid premature health logic

- do not add source-health workflow, degraded-line handling, or repair logic yet
- keep this round focused on published serving only

## Reviewer acceptance checklist

## 1. Published-only serving is real

- confirm public browse/search/detail/watch now resolve through published-catalog read boundaries rather than withdrawn seed-only runtime data
- confirm the new read path is repository/service-backed, not route-local staging logic

## 2. No staging or rejected leakage

- confirm staging-only, normalized-only, rejected, or still-in-review records cannot appear in public routes
- confirm operator/audit state is not exposed publicly

## 3. Ownership discipline is preserved

- confirm `data-catalog` owns published read models and identity resolution
- confirm `search-filter` owns search/browse integration only
- confirm `detail-player` owns detail/watch integration only

## 4. Public route behavior remains coherent

- confirm browse/search/detail/watch still behave as public routes, not admin or review surfaces
- confirm stable public watch/list identity remains intact

## 5. No source-health workflow yet

- confirm this round does not introduce source-health probing, degraded/offline policies, or health-driven routing behavior
- confirm those concerns remain deferred to Round F

## 6. Buildability and integration sanity

- confirm the project remains buildable if build tooling is available
- confirm the Round E integration fits the accepted Round A-D module map instead of bypassing it

## Acceptance gate

Round E passes only if:

- public browse/search/detail/watch read from published backend data
- staging, normalized-only, rejected, or in-review state does not leak into public routes
- ownership is clear across `data-catalog`, `search-filter`, and `detail-player`
- stable public watch/list identity remains intact
- no source-health workflow is introduced yet
- the project remains buildable

Round E fails if:

- public routes still depend primarily on withdrawn seed-only runtime data
- staging or review state leaks into public serving
- route files become ad hoc direct readers of non-public backend state
- source-health workflow is prematurely mixed into catalog serving
