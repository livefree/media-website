# Planner Handoff: Provider Adapter And Staging Schema Round B

## Task summary

Round B establishes the first real intake boundary for the backend-first phase:

- adapter-based external-provider access
- staging persistence for provider data and ingest state

This round must keep all incoming provider data isolated from:

- the live canonical catalog
- public route logic
- publish/review workflows

Round B is successful only if the repo leaves this round with:

- a clear provider adapter contract under server-only boundaries
- a staging-focused schema and persistence model
- a strict split between `media-ingest` and `data-catalog`

This round does **not** implement:

- normalization or dedup decisions
- review and publish
- public catalog restoration
- player or public route integration

## Execution order

1. `planner`
- publish this handoff

2. `media-ingest`
- implement adapter contracts and ingest-safe staging entrypoints

3. `data-catalog`
- implement Prisma/schema and persistence contracts for staging state

4. `reviewer`
- validate adapter isolation, staging schema scope, ownership boundaries, and acceptance criteria before merge

## Ownership split

## Media Ingest owns

Round B `media-ingest` ownership should cover:

- `lib/server/provider/`
- `lib/server/ingest/`
- `scripts/`
- `import-data/`
- `package.json` only for safe ingest script entries if needed

Round B responsibilities for `media-ingest`:

- define the base adapter contract
- add provider-facing fetch boundaries
- define staging-safe intermediate shapes emitted by adapters
- add ingest entrypoints that create staging records through shared persistence boundaries
- keep provider-specific parsing isolated from the rest of the app

`media-ingest` must **not** own:

- Prisma schema design for staging tables
- DB repository implementations for staging persistence
- canonical catalog schema changes beyond what staging linkage strictly requires

## Data Catalog owns

Round B `data-catalog` ownership should cover:

- `prisma/`
- `lib/db/`
- backend shared types or contracts required for staging persistence
- narrowly related backend foundation files when needed for schema-backed staging boundaries

Round B responsibilities for `data-catalog`:

- design Prisma models and enums for provider and staging state
- implement repository boundaries for ingest jobs, raw payloads, provider items, and staged candidates
- add persistence-facing shared types that `media-ingest` can call without importing Prisma everywhere
- keep staging persistence separate from canonical catalog reads

`data-catalog` must **not** own:

- provider-specific parsing logic
- provider HTTP fetch logic
- ingest scripts
- route-local shortcuts that bypass the staging model

## Shared contract rule

If a type describes provider fetch or provider parsing behavior, it belongs with `media-ingest`.

If a type describes persisted staging state, repository calls, or Prisma-backed records, it belongs with `data-catalog`.

If a boundary is ambiguous, prefer:

- `media-ingest` for external-shape contracts
- `data-catalog` for persistence-shape contracts

## Adapter contract scope

Round B should create the first provider adapter contract, but keep it narrow.

Recommended contract responsibilities:

- identify the provider by stable internal key
- fetch a page or update slice
- fetch an item detail payload when needed
- emit staging-safe intermediate records
- expose provider pagination or checkpoint data
- isolate provider-specific field names from the rest of the backend

Recommended Round B contract surface:

- provider identity and capability metadata
- `fetchPage(...)`
- optional `fetchById(...)`
- parse functions that convert raw provider payloads into:
  - provider item identity
  - raw payload blob or serializable payload object
  - staging-safe metadata candidate
  - playback/download/subtitle candidate fragments if present

Round B adapter constraints:

- adapters may parse into staging-safe shapes
- adapters may not normalize into canonical catalog records
- adapters may not publish directly
- adapters may not write directly to public runtime code

## Staging-safe intermediate shape scope

The adapter output for this round should be enough to support later rounds, but no more.

It should cover:

- provider key
- provider item id
- external title fields
- raw category, region, language, year, episode text if present
- raw source fragments for playback/download/subtitle if present
- raw payload capture
- ingest timestamp and pagination/update cursor metadata

It should not yet decide:

- canonical title match
- duplicate merge result
- review approval
- publish visibility

## Staging schema scope

Round B schema work should persist provider and staging state explicitly.

Minimum staging persistence areas:

- provider definition or provider registry state
- ingest jobs or ingest runs
- ingest checkpoints / cursors
- raw provider payload records
- provider item records or equivalent external-item identity mapping
- staged candidate records

Recommended staging schema concepts:

### Provider

Tracks known providers and adapter keys.

Useful fields:

- adapter key
- provider type
- enabled flag
- base URL or logical source identifier
- last successful sync metadata

### IngestJob

Tracks one backfill or incremental run.

Useful fields:

- job type
- provider id
- mode
- status
- started/finished timestamps
- attempt count
- cursor or checkpoint metadata
- failure summary

### ProviderRawPayload

Stores fetched external payloads for audit and retry/debug use.

Useful fields:

- provider id
- provider item id
- fetch context
- payload format
- raw payload body
- fetched at
- ingest job id

### ProviderItem

Tracks the external item identity separately from canonical media.

Useful fields:

- provider id
- provider item id
- provider-side updated timestamp
- last seen at
- current raw payload ref
- latest staging status

### StagingCandidate

Represents provider data that has been parsed into an internal pre-normalization candidate.

Useful fields:

- provider item ref
- ingest job ref
- candidate status
- parsed title fields
- parsed year / region / language
- parsed episode or season hints
- parsed source fragment summary
- parse warnings / failure metadata

Round B schema constraints:

- staging tables must not double as published catalog tables
- raw payload records must remain separate from parsed candidates
- provider identity must remain separate from canonical media identity

## Media Ingest implementation checklist

### 1. Add the first adapter contract

- create a provider adapter interface under server-only ingest/provider boundaries
- make the contract explicit enough for later providers to conform to
- keep provider field translation inside the adapter boundary

### 2. Add ingest-safe provider entrypoints

- create entrypoints that fetch provider data through the adapter
- prepare payloads for staging persistence
- route persistence calls through shared DB or repository boundaries rather than ad hoc inline writes

### 3. Keep provider parsing pre-normalization

- parse provider data into staging-safe intermediate shapes only
- do not map directly to canonical `MediaTitle`, `Season`, `Episode`, or published `Source`

### 4. Keep public runtime isolated

- do not wire adapters into public browse/search/detail/watch routes
- do not make route handlers depend on raw provider payloads

## Data Catalog implementation checklist

### 1. Add staging schema support

- extend Prisma with staging-focused models and enums
- make provider, ingest, raw payload, and candidate state explicit

### 2. Add persistence boundaries

- add repository or persistence helpers under `lib/db/` for:
  - ingest jobs
  - checkpoints
  - raw payloads
  - provider items
  - staged candidates

### 3. Keep canonical catalog separate

- do not overload published catalog models with staging-only status
- do not make public reads depend on staged records

### 4. Add only the shared contracts Round B actually needs

- add persistence-facing types or repository contracts when required
- avoid broad schema churn unrelated to provider and staging persistence

## Reviewer acceptance checklist

## 1. Adapter isolation

- confirm at least one adapter contract exists under `lib/server/provider/` or `lib/server/ingest/`
- confirm provider-specific field parsing is isolated there
- confirm public routes and public runtime modules do not import raw provider logic

## 2. Staging schema existence

- confirm the schema now has explicit staging-oriented structures for provider and ingest state
- confirm raw payloads, provider items, and staged candidates are not collapsed into one generic model

## 3. Ownership discipline

- confirm `media-ingest` owns provider and ingest boundaries
- confirm `data-catalog` owns Prisma and persistence boundaries
- confirm neither agent crossed into unrelated public route or player surfaces

## 4. No premature business-logic expansion

- confirm Round B does not implement normalization, dedup, merge, publish, or review workflows yet
- confirm there is no hidden shortcut that turns staged data into live catalog data

## 5. Canonical catalog isolation

- confirm raw provider shapes remain isolated from canonical catalog and public reads
- confirm the runtime catalog stays withdrawn after Round B

## 6. Buildability and integration sanity

- confirm the project remains buildable if build tooling is available
- confirm new contracts and schema changes do not obviously conflict with Round A module boundaries

## Acceptance gate

Round B passes only if:

- a provider adapter contract exists under the server-side ingest/provider boundaries
- staging-focused persistence exists for provider data and ingest state
- raw provider data remains isolated from canonical catalog reads and public runtime code
- the ownership split between `media-ingest` and `data-catalog` is visible in the resulting file changes
- the project remains buildable

Round B fails if:

- provider-specific logic leaks into public routes
- staging models double as live catalog models
- normalization or publish logic is smuggled into the round
- adapter and persistence ownership are blurred enough that Round C would need to reorganize Round B first
