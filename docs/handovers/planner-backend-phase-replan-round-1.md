# Planner Handoff: Backend Phase Replan Round 1

## Summary

The project has moved past the phase where the main constraint was frontend structure. The public runtime catalog has been withdrawn, and the next major milestone is a backend for a small/medium media aggregation platform.

The backend should be built around this pipeline:

1. provider adapters
2. staging ingestion
3. normalization and dedup
4. review and publish
5. canonical catalog serving
6. source management and healthcheck

This should stay a monolith with modular boundaries unless a real scale or team split later justifies separate services.

## What changes in planning priority

The old priority was:

- frontend browse/search/detail/player composition

The new priority is:

- backend ingestion and staging safety
- internal canonical data modeling
- operator review and publish workflow
- source management and health-aware public serving

Do not treat the next phase as “more UI plus some API routes.” The next phase is backend infrastructure and operator workflow.

## Recommended agent redistribution

Current frontend-era roles can still be used, but they should be reinterpreted for backend work.

### Recommended mapping

- `Planner`
  - architecture, sequencing, round definitions, acceptance criteria

- `Data Catalog`
  - should effectively become the catalog-backend owner
  - owns Prisma evolution, repositories, canonical published models, shared backend contracts, and search inputs

- `Media Ingest`
  - owns provider adapters, raw payload capture, ingest jobs, checkpoints, staging models, and normalization inputs

- `Search Filter`
  - should shift toward catalog-backed search/filter API integration and indexing behavior instead of only route-local UI query logic

- `UI Shell`
  - becomes primarily an admin/operator-shell owner when review, publish, and source-management surfaces need UI

- `Detail Player`
  - remains owner of detail/watch integration, but now consumes published catalog and health-aware source state rather than mock catalog assumptions

- `Reviewer`
  - expands from layout/runtime QA into backend workflow acceptance
  - validates schema/contract drift, adapter safety, staging isolation, review/publish rules, and runtime fallback behavior

### Recommended future split only if needed

If workload grows, split these out later:

- `Review Publish Ops`
- `Source Health`

For now, keep them inside the monolith and assign their code to the existing backend-capable agents above.

## Recommended major-round workflow

### Round A: backend monolith foundation

Execution order:

1. `planner`
2. `data-catalog`
3. `reviewer`

Deliver:

- server module boundaries
- DB repository conventions
- queue/job expectations
- config/logging/error boundaries

Why first:

- without this, provider, review, and health logic will sprawl into routes and utility files

### Round B: provider adapter and staging schema

Execution order:

1. `planner`
2. `media-ingest`
3. `data-catalog`
4. `reviewer`

Deliver:

- provider adapter contracts
- raw payload persistence
- ingest jobs and checkpoints
- staging tables for provider items and candidates

Acceptance focus:

- providers are adapter-based
- raw payloads never become public catalog rows directly

### Round C: normalization and dedup pipeline

Execution order:

1. `planner`
2. `media-ingest`
3. `data-catalog`
4. `reviewer`

Deliver:

- title matching
- alias/year matching
- season/episode resolution
- category/region/language mapping
- duplicate and merge suggestion flow

Acceptance focus:

- ambiguous matches are flagged, not silently published

### Round D: review and publish workflow

Execution order:

1. `planner`
2. `data-catalog`
3. `ui-shell` when admin UI is needed
4. `reviewer`

Deliver:

- review queue data model and service
- approve / reject / merge / publish / unpublish actions
- audit trail
- optional first admin/operator review shell

Acceptance focus:

- no staged candidate reaches public catalog visibility without review or publish

### Round E: canonical catalog serving

Execution order:

1. `planner`
2. `data-catalog`
3. `search-filter`
4. `detail-player`
5. `reviewer`

Deliver:

- published catalog read layer
- public search/filter backed by published records
- detail/watch backed by published source inventory
- stable public ID resolution from the backend

Acceptance focus:

- public browse/search/detail/watch consume published catalog data only

### Round F: source management and healthcheck

Execution order:

1. `planner`
2. `media-ingest`
3. `data-catalog`
4. `detail-player`
5. `reviewer`

Deliver:

- source inventory and line ordering
- health probes
- degraded/offline status
- repair queue
- watch fallback behavior tied to source health

Acceptance focus:

- broken or degraded lines are visible to operators and handled predictably at runtime

## Workflow rules for the backend phase

1. Every new external provider must enter through an adapter.
2. Every ingest flow must land in staging first.
3. Every public catalog record must come from an explicit publish step.
4. Every watch-facing source must be health-aware.
5. Every backend round should be validated against staging isolation and publish-gate rules, not just build success.

## In-scope backend modules for the next phase

- `lib/server/provider/`
- `lib/server/ingest/`
- `lib/server/normalize/`
- `lib/server/review/`
- `lib/server/catalog/`
- `lib/server/source/`
- `lib/server/health/`
- `lib/db/`
- `prisma/`
- admin-facing route shells only when a round explicitly requires them

## Out of scope for the immediate backend replan

- premature microservice split
- unauthorized scraping or protected-host bypass
- treating raw provider payload shape as the public app contract
- rebuilding the public frontend shell before backend data flow exists
- self-hosting main video files as the primary platform model

## Acceptance gate for this replan

This backend-phase replan is successful only if downstream rounds now follow:

- staging before normalization
- normalization before review/publish
- review/publish before public catalog serving
- source management with healthcheck as a first-class backend concern

If the next rounds fall back into route-local provider logic or skip staging/review gates, the replan has failed.
