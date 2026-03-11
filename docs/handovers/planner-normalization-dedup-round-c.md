# Planner Handoff: Normalization And Dedup Pipeline Round C

## Task summary

Round C establishes the first normalization and dedup layer on top of the accepted Round B staging foundation.

This round exists to answer one question safely:

- given staged provider records, what normalized candidate shape and duplicate/match signals should be prepared for later review?

This round does **not** decide:

- what gets published
- what writes into the canonical catalog
- what becomes publicly visible

Round C should leave the repo with:

- normalization inputs derived from staged provider records
- normalization outputs stored as normalized-candidate and match/duplicate state
- a clear ownership split between `media-ingest` and `data-catalog`

## Accepted Round B baseline this round depends on

Round C assumes Round B already established:

- provider adapter contracts under server-only boundaries
- staging persistence for providers, ingest jobs, raw payloads, provider items, and staged candidates
- clear isolation between provider/staging data and the canonical catalog

Round C must build on those boundaries, not replace them.

## Execution order

1. `planner`
- publish this handoff

2. `media-ingest`
- implement normalization-input preparation and dedup orchestration boundaries within ingest/normalize ownership

3. `data-catalog`
- implement persistence/state for normalized candidates, match suggestions, and duplicate signals

4. `reviewer`
- validate normalization scope, dedup safety, ownership boundaries, and non-goal discipline before merge

## In scope

- normalization-input preparation from staged provider records
- canonical-title candidate shaping
- alias/year/category/region/language normalization preparation
- season/episode structure normalization preparation
- source-fragment normalization preparation
- duplicate and match suggestion generation
- persistence for normalized candidates and match/duplicate signals

## Explicit non-goals

- no review/publish workflow
- no canonical catalog writes
- no direct writes to `MediaTitle`, published `Season`, published `Episode`, or published `Source`
- no public route changes
- no runtime catalog restoration
- no admin UI

## Normalization scope

Round C normalization should transform staged provider records into a stable internal pre-review candidate shape.

Normalization in this round includes:

- title cleanup and display-title shaping
- alias extraction and alias comparison inputs
- year parsing and confidence handling
- category/type mapping into internal media-type candidates
- region and language mapping into internal normalized values
- season and episode interpretation from staged text or source fragments
- summary/source-field cleanup needed for later review
- source-fragment grouping for later review, without publishing those sources

Normalization should produce internal candidate data that is:

- more structured than staged provider input
- still reversible back to staging provenance
- still clearly pre-review and pre-publish

Normalization should **not**:

- silently create canonical catalog records
- overwrite existing canonical records
- mark a duplicate as merged
- decide publish visibility

## Dedup scope

Dedup in this round means suggestion and signaling only.

Dedup includes:

- candidate-to-candidate duplicate signals
- staged-or-normalized candidate to existing canonical-title match suggestions
- confidence-bearing similarity signals based on:
  - title
  - aliases
  - year
  - media type
  - region/language context
  - season/episode structure when relevant

Dedup should produce:

- exact-match suggestions
- probable-match suggestions
- ambiguous-match signals
- no-match outcomes

Dedup should **not** produce:

- auto-merge into canonical catalog
- auto-publish
- irreversible duplicate deletion
- operator-review shortcuts hidden inside persistence logic

## What counts as normalization input

Normalization input belongs to `media-ingest` and is derived from Round B staging state.

Normalization input includes:

- staged candidate records
- provider item identity
- provider metadata context
- raw payload references when needed for re-parsing or evidence
- parsed staging fields from Round B
  - external title fields
  - year text
  - region/language text
  - episode text
  - source fragments
  - provider update metadata

These inputs are external-facing or staging-facing.

They are not yet persistence decisions about normalized or duplicate state.

## What counts as persistence state

Persistence state belongs to `data-catalog` and records the results of normalization and dedup work.

Persistence state includes:

- normalized candidate records
- normalized title, alias, year, region, language, season, episode, and source-fragment fields
- normalization warnings or failure reasons
- match suggestion records
- duplicate signal records
- confidence scores or reasoning summaries where stored
- links back to:
  - staging candidate
  - provider item
  - existing canonical title when a match suggestion exists

Persistence state should be explicit and queryable. It must not be inferred only from logs or transient in-memory structures.

## Ownership split

## Media Ingest owns

Round C `media-ingest` should own:

- `lib/server/provider/` when existing adapter output needs normalization-input support
- `lib/server/ingest/`
- `lib/server/normalize/` for normalization-input preparation, mappers, and orchestration boundaries
- `scripts/`
- `import-data/`
- `package.json` only for safe ingest/normalize script entries if required

Round C responsibilities for `media-ingest`:

- read staged records through shared persistence boundaries
- prepare normalization input from staging data
- implement normalization mappers and dedup orchestration boundaries
- generate match/duplicate suggestions as pre-review outputs
- keep provider-specific parsing and normalize-input preparation isolated from public runtime code

`media-ingest` must **not** own:

- Prisma schema changes for normalized candidate or dedup persistence
- DB repositories for normalized candidate state
- direct writes into canonical published catalog models
- review/publish decisions

## Data Catalog owns

Round C `data-catalog` should own:

- `prisma/`
- `lib/db/`
- backend shared types or contracts needed for normalized candidate persistence
- related shared backend files needed for repository-backed normalized and dedup state

Round C responsibilities for `data-catalog`:

- extend schema for normalized candidate state
- add persistence for match outcomes and duplicate signals
- implement repository boundaries used by normalization/dedup orchestration
- keep normalized/pre-review state separate from canonical catalog state

`data-catalog` must **not** own:

- provider-specific normalization heuristics
- adapter parsing logic
- ingest-side orchestration scripts
- auto-publish or canonical-write shortcuts

## Shared contract rule

If a type describes how staged/provider data is transformed into normalize-ready inputs, it belongs with `media-ingest`.

If a type describes how normalized candidates, match suggestions, or duplicate signals are stored or queried, it belongs with `data-catalog`.

If a boundary is ambiguous, prefer:

- `media-ingest` for transformation logic and input shape
- `data-catalog` for stored state and repository contracts

## Recommended normalized persistence concepts

Round C does not need final table names, but it should leave explicit persisted state for:

### NormalizedCandidate

Represents one pre-review normalized candidate derived from staging.

Useful fields:

- staging candidate ref
- normalized title fields
- normalized media type
- normalized year
- normalized region/language
- normalized season/episode structure
- normalized synopsis or summary field
- normalized source-fragment summary
- normalization status
- warnings and parse issues

### CandidateAlias

Stores extracted normalized aliases separately when useful for future matching and review.

Useful fields:

- normalized candidate ref
- alias value
- alias type or origin
- normalization confidence or note if useful

### MatchSuggestion

Represents a suggested relationship between a normalized candidate and an existing canonical record.

Useful fields:

- normalized candidate ref
- canonical media ref
- match type
  - exact
  - probable
  - ambiguous
  - none
- confidence score
- reasoning summary

### DuplicateSignal

Represents a possible duplicate between candidates or between a candidate and an existing record.

Useful fields:

- source candidate ref
- target candidate or canonical ref
- signal type
- confidence score
- reasons
- status

These records are pre-review artifacts only.

## Media Ingest implementation checklist

### 1. Consume staging data through shared boundaries

- read staged records through repositories or persistence contracts from Round B
- do not bypass staging by reading raw provider payloads directly from unrelated files or route-local code

### 2. Add normalization-input preparation

- transform staged provider data into stable normalize-ready input objects
- centralize mappers for:
  - title
  - aliases
  - year
  - category/type
  - region/language
  - season/episode hints
  - source fragments

### 3. Add dedup orchestration boundaries

- define the service or orchestration layer that evaluates possible matches and duplicates
- keep this as suggestion generation only
- do not hide merge or publish decisions here

### 4. Keep all outputs pre-review

- normalization and dedup outputs must remain explicitly pre-review
- no direct writes into canonical published catalog models

## Data Catalog implementation checklist

### 1. Add normalized/pre-review persistence

- extend Prisma for normalized candidates and duplicate/match state
- keep those models distinct from:
  - staging tables
  - published catalog tables

### 2. Add repository boundaries for Round C state

- add repository or persistence helpers for:
  - normalized candidates
  - aliases if modeled separately
  - match suggestions
  - duplicate signals

### 3. Preserve canonical catalog isolation

- do not make `MediaTitle` or other published catalog models the write target for Round C
- do not encode “already published” assumptions into normalized candidate state

### 4. Preserve traceability back to staging

- normalized and dedup records should trace back to the source staging candidate and provider item
- later review must be able to see provenance

## Reviewer acceptance checklist

## 1. Normalization consumes staging, not public/runtime inputs

- confirm normalization logic is driven by staged provider records and shared persistence boundaries
- confirm public routes and public runtime files do not become normalization inputs

## 2. Normalization scope is correct

- confirm Round C introduces normalization of titles, aliases, years, type/category, region/language, season/episode hints, and source fragments
- confirm it stops before review/publish and before canonical writes

## 3. Dedup scope is suggestion-only

- confirm duplicate or match logic creates signals/suggestions only
- confirm there is no auto-merge, auto-publish, or implicit canonical mutation

## 4. Persistence state is explicit

- confirm the repo has explicit persisted state for normalized candidates, match outcomes, or duplicate signals
- confirm these are not encoded only in transient logs or in-memory objects

## 5. Ownership discipline is preserved

- confirm `media-ingest` owns transformation logic and orchestration boundaries
- confirm `data-catalog` owns Prisma and repository-backed normalized/dedup state
- confirm neither agent drifted into public runtime, player, or admin UI work

## 6. Canonical catalog isolation is preserved

- confirm no writes go directly into canonical `MediaTitle` or published catalog records
- confirm the runtime catalog remains withdrawn

## 7. Buildability and module-boundary sanity

- confirm the project remains buildable if build tooling is available
- confirm Round C fits into the Round A and Round B module map rather than reorganizing it

## Acceptance gate

Round C passes only if:

- normalization consumes staged records
- normalized candidates and dedup signals are explicitly persisted
- dedup remains suggestion-only
- no review/publish logic is introduced
- no canonical catalog writes occur
- no public route changes occur
- the ownership split between `media-ingest` and `data-catalog` remains clear

Round C fails if:

- normalization writes straight into published catalog models
- dedup performs hidden merge or publish actions
- public routes become part of the normalization pipeline
- Round C blurs input transformation and persistence ownership enough that Round D would need to redesign the boundary first
