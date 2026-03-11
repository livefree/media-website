# Roadmap

## Current baseline

The frontend and player groundwork is already in place:

- browse/search/detail/watch routes exist
- canonical public watch URLs already use opaque public IDs
- player interaction groundwork exists
- Prisma schema and shared contracts exist

What changed:

- the public runtime catalog has been withdrawn
- the next bottleneck is no longer front-end shell work
- the next milestone is a backend for a small/medium media aggregation platform

This means the roadmap must now optimize for:

- staging external data safely
- normalizing it into internal models
- human review and publish gates
- source management and replacement
- ongoing health checking

The target architecture should remain a monolith with modular boundaries until real scale or team structure justifies a split.

## Backend-phase principles

1. All external providers enter through adapters.
2. External data lands in staging before it can affect the live catalog.
3. Metadata normalization is separate from source management.
4. Review and publish remain explicit gates.
5. Source health and repair are first-class, not cleanup work left for later.
6. Object storage is for posters, screenshots, and static assets; the main platform focus is aggregation and source management, not self-hosting primary video files.

## Phase 1: Backend monolith foundation

Goals:

- establish the code boundaries for a backend-first monolith
- stop treating backend work as incidental route-local logic
- define the canonical module flow:
  - provider adapters
  - staging ingestion
  - normalization
  - review/publish
  - catalog serving
  - healthcheck

Scope:

- define server-only module boundaries under a monolith
- add shared runtime config, secrets, validation, logging, and error conventions
- define job-runner and Redis usage expectations
- define repository and transaction boundaries for Prisma

Exit criteria:

- the repo has a documented backend module map aligned to `backend.md`
- engineers can place new backend code without inventing ad hoc structure
- staging, catalog, review, and health modules are treated as distinct backend responsibilities

## Phase 2: Provider adapter and staging ingestion

Goals:

- establish lawful, adapter-based intake from external providers and manual submissions
- persist raw payloads and staged candidates without touching the live catalog

Scope:

- provider adapter contracts for:
  - catalog providers
  - playback providers
  - download providers
  - subtitle providers
- ingest job model and runner
- raw payload persistence
- incremental and backfill ingest modes
- staging tables for provider items, payloads, and candidate records

Exit criteria:

- at least one provider can be ingested through an adapter
- raw payloads and staged candidates persist independently from the live catalog
- the system supports retries, throttling, and incremental ingest checkpoints

## Phase 3: Normalization and match pipeline

Goals:

- convert staged provider records into normalized internal candidates
- reduce duplicate and inconsistent title creation before human review

Scope:

- canonical title resolver
- alias and year matching
- season and episode resolution
- category, region, and language mapping
- source parsing into internal candidate structures
- duplicate-detection and merge-suggestion workflow

Exit criteria:

- staged items can be normalized into internal candidate records
- probable duplicates and ambiguous matches are flagged instead of silently published
- movies, series, anime, and variety content share one coherent normalization path

## Phase 4: Review and publish workflow

Goals:

- create the operator gate between staged candidates and the live catalog
- make publish, reject, merge, replace, and unpublish explicit workflows

Scope:

- review queue
- candidate comparison UI/API expectations
- approve / merge / reject decisions
- publish service
- unpublish / reorder / replace flows
- audit trail for review actions

Exit criteria:

- new staged content cannot appear publicly without a review or publish action
- operators can merge into existing titles instead of creating duplicates
- review decisions are auditable and reversible through controlled workflows

## Phase 5: Canonical catalog and public serving

Goals:

- build the backend catalog that the existing frontend already expects
- make public browse/search/detail/watch reads come from publishable backend data

Scope:

- canonical `MediaTitle`, `Season`, `Episode`, `Source`, `Download`, and subtitle serving
- repository layer for public reads
- search indexing inputs and filter facets from published catalog data
- stable public watch/list identity resolution backed by database records

Exit criteria:

- public pages can resolve published catalog data from the backend
- unpublished or staging-only records never leak to the public site
- canonical public URLs stay stable while the backing catalog becomes database-driven

## Phase 6: Source management and healthcheck

Goals:

- operate the platform as an aggregator rather than a one-time importer
- detect, degrade, replace, and retire broken lines predictably

Scope:

- source inventory and ordering
- multi-line playback-source management
- availability status and manual override
- health probes for playback and download resources
- repair queue and replacement workflow
- episode update checker and metadata refresh jobs

Exit criteria:

- sources can be marked healthy, degraded, broken, replaced, or offline
- automated checks feed operator workflows instead of silently failing
- the watch page can prefer healthy sources while preserving existing URL behavior

## Phase 7: Admin operations and moderation

Goals:

- give operators a real control plane for the aggregation backend

Scope:

- admin surfaces for staged candidates, review queue, published catalog, and source inventory
- moderation/report handling
- manual title creation and manual source submission
- publish scheduling and visibility control

Exit criteria:

- key catalog and source workflows no longer require direct DB edits
- moderators or editors can process broken-source reports and publish decisions through the product
- operational ownership is clear between ingestion, review, and source maintenance

## Phase 8: Observability, security, and launch hardening

Goals:

- make the backend operable in production

Scope:

- structured logs, metrics, alerts, and job visibility
- queue failure monitoring
- provider rate-limit and failure handling
- auth hardening, RBAC, and audit coverage
- backups, restore drills, and migration safety
- end-to-end validation for ingest -> normalize -> review -> publish -> watch -> healthcheck

Exit criteria:

- failures in adapters, jobs, review flow, and source health are visible
- privileged actions are authenticated and auditable
- backend operations are stable enough for sustained catalog growth

## Recommended downstream workflow order

The next major rounds should follow this order:

1. backend foundation and module boundaries
2. provider adapter contract plus staging schema
3. ingest job runner and raw-payload persistence
4. normalization and dedup pipeline
5. review queue and publish service
6. canonical catalog read layer for public runtime
7. source management and healthcheck jobs
8. admin operations and moderation
9. observability and launch hardening

This order matters because:

- normalization is unsafe without staging
- publish is unsafe without normalization
- public catalog serving is incomplete without publish state
- source health has little value until source records and publish flow exist

## What should not happen next

- do not jump directly into provider-specific business logic in route files
- do not let raw provider payloads become the public catalog contract
- do not split into microservices early; keep one monolith with clear internal modules
- do not auto-publish fresh provider data before review/publish workflows are in place
- do not treat health checking as a post-launch nice-to-have
