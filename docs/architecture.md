# Architecture

## Current implemented state

The repository already has the public-side groundwork:

- Next.js App Router frontend
- browse, search, detail, and watch routes
- player interaction groundwork
- opaque public watch URL structure
- shared TypeScript contracts and helpers
- an initial Prisma schema

The repository no longer has a public runtime catalog feeding real content into those surfaces. In practical terms, the frontend is now a shell waiting for a real backend.

## Reframed target state

The next target is not “finish a self-hosted streaming stack.” The next target is a small/medium media aggregation backend that powers the existing frontend.

That backend should center on:

- external provider ingestion
- staging and raw-payload retention
- normalization into internal canonical content models
- review and publish gates
- playback-source and download-source management
- source health checking and replacement

This target should be implemented as a monolith with modular boundaries unless there is a real operational reason to split it later.

## Architectural stance

### Monolith first

Recommended shape:

- one deployable Next.js/Node.js application
- PostgreSQL via Prisma
- Redis for queueing, caching, and job coordination
- background job runners for ingest and health checks
- object storage for posters, screenshots, and static assets only

Why:

- the product scope is operationally rich but not yet large enough to justify a service split
- staging, normalization, review, publish, and healthcheck all need tight shared data access
- premature service boundaries would increase coordination cost faster than they improve scale

### Adapter-based external integrations

All external providers must enter through adapters, not directly through route handlers or catalog logic.

Provider classes:

- `catalog_provider`
- `playback_provider`
- `download_provider`
- `subtitle_provider`
- `manual_submission_provider`

The internal platform should never expose raw provider payloads as its public contract.

## Core backend flow

Recommended backend flow:

```text
Provider Adapter
-> Ingest Job
-> Raw Payload Store
-> Staging Candidate
-> Normalization / Match / Dedup
-> Review Queue
-> Publish Service
-> Canonical Catalog
-> Public Browse / Search / Detail / Watch
-> Healthcheck / Repair / Refresh
```

This order is the core system design, not just an implementation preference.

## Proposed module boundaries inside the monolith

### `lib/server/provider/`

Purpose:

- adapter contracts
- provider-specific fetchers
- provider normalization helpers local to each adapter

Responsibilities:

- fetch pages or detail payloads
- map provider-specific fields into staging-safe intermediate shapes
- isolate unstable provider formats from the rest of the codebase

### `lib/server/ingest/`

Purpose:

- intake orchestration
- raw payload capture
- incremental/backfill job logic

Responsibilities:

- create and run ingest jobs
- persist raw payloads
- checkpoint pagination/update markers
- retry, throttle, and rate-limit provider access

### `lib/server/normalize/`

Purpose:

- turn staged provider records into internal candidate data

Responsibilities:

- title matching
- alias/year matching
- season and episode resolution
- category/region/language mapping
- source candidate parsing
- duplicate and merge suggestion generation

### `lib/server/review/`

Purpose:

- gate staged candidates before they enter the live catalog

Responsibilities:

- review queue
- approve / reject / merge actions
- publish payload preparation
- unpublish and replace workflow hooks
- review audit trail

### `lib/server/catalog/`

Purpose:

- own the canonical published catalog

Responsibilities:

- titles, seasons, episodes, sources, downloads, subtitles
- published-only reads for public browse/search/detail/watch
- search and facet inputs from published data
- stable public identity resolution

### `lib/server/source/`

Purpose:

- manage playback, download, and subtitle sources after publish

Responsibilities:

- line ordering and visibility
- source replacement
- source grouping by provider and type
- manual overrides and temporary disable

### `lib/server/health/`

Purpose:

- maintain source availability and freshness

Responsibilities:

- source probes
- broken-link detection
- degraded/offline state transitions
- repair queue creation
- metadata refresh and episode update checks

### `lib/server/search/`

Purpose:

- serve catalog-backed search and filtering

Responsibilities:

- published search documents
- facet calculation
- ranking inputs
- query analytics

### `lib/server/admin/`

Purpose:

- operator-facing workflows

Responsibilities:

- staging review surfaces
- publish controls
- source inventory management
- moderation and report handling

### `lib/db/`

Purpose:

- Prisma client, repositories, and transactions

Responsibilities:

- keep DB access behind repository and transaction boundaries
- prevent route handlers from embedding ad hoc data mutations

### `app/`

Purpose:

- frontend routes and API entrypoints only

Responsibilities:

- public UI composition
- admin route composition
- API handlers delegating to server modules

## Data-state separation

The backend should enforce five distinct states of content:

1. raw provider payload
2. staged candidate
3. normalized candidate
4. published canonical catalog record
5. health-managed source state

These must not collapse into one table or one generic status field.

Why:

- ingest retry and provider debugging need raw payload visibility
- review requires pre-publish candidate state
- public pages need published-only reads
- source health changes more frequently than title metadata

## Content and source decoupling

The backend should treat metadata and playable sources as separate lifecycles.

Canonical content:

- title identity
- title metadata
- season and episode structure
- genres, regions, aliases, artwork

Source layer:

- playback lines
- netdisk/download links
- subtitle tracks
- provider provenance
- health and availability state

Why:

- the same title may outlive a specific playback line
- providers change faster than canonical metadata
- healthcheck and repair should update sources without rewriting title identity

## Database direction

The current Prisma schema is a useful baseline but incomplete for the backend phase.

The next schema direction should add explicit models for:

- provider definitions and adapter config
- ingest jobs and ingest checkpoints
- raw provider payloads
- staged candidates
- normalization matches and dedup suggestions
- review decisions and publish actions
- source inventory and source health history
- audit records

The database should distinguish:

- provider identity
- provider item identity
- canonical media identity
- public playback identity

These are not interchangeable.

## Runtime expectations for the existing frontend

The current frontend groundwork stays useful, but its data source changes:

- browse and search should read from published catalog records
- detail pages should read canonical metadata plus published source inventory
- watch pages should resolve published playback sources and health-aware fallbacks
- slug routes may remain compatibility routes, but published data should be keyed internally by stable canonical IDs and public IDs

## Health and maintenance as a core subsystem

Health checking is not an optional operations add-on. It is part of the product.

Required behaviors:

- detect broken playback lines
- mark lines degraded or offline
- keep operator-visible repair queues
- refresh episodic updates from providers
- refresh metadata selectively when provider data changes

Without this layer, the platform is only an importer, not an operable aggregation backend.

## Recommended backend-phase agent redistribution

The current frontend-era agent boundaries are no longer ideal for the next phase.

Recommended direction:

- `Planner`
  - architecture, module boundaries, round sequencing, acceptance criteria
- `Data Catalog` -> evolve into `Catalog Backend`
  - Prisma models, repositories, published catalog reads, search inputs, shared backend contracts
- `Media Ingest`
  - provider adapters, staging ingestion, raw payload persistence, checkpoints, normalization inputs
- `Detail Player`
  - watch/detail integration with published source inventory and health-aware playback resolution
- `UI Shell`
  - admin shell and operator-facing layout work when backend workflows need UI
- `Search Filter`
  - transition from query-only UI behavior to catalog-backed search/filter API integration and indexing behavior
- `Reviewer`
  - backend workflow QA, runtime validation, migration/contract review, and operator-flow acceptance

Recommended additions for later if task volume demands it:

- `Review Publish Ops`
  - candidate review queue, approve/merge/reject/publish/unpublish workflows
- `Source Health`
  - source probes, degraded/offline transitions, repair queue

These do not need to be separate agents immediately; they can remain under `Media Ingest` and `Catalog Backend` until the workload becomes too large.

## Immediate engineering implications

- stop organizing the next milestone around homepage/search/player polish
- build the server modules before provider-specific feature work spreads across the repo
- keep providers behind adapters
- keep staging isolated from the live catalog
- make review/publish an explicit gate before public visibility
- make source health part of the initial backend plan, not a late rescue feature
