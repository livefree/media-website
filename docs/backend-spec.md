# Backend Platform Spec

Status: active project spec for the backend-first phase.

This document promotes the planning intent from `reference-assets/backend.md` into the tracked project documentation system. The file in `reference-assets/` remains source material; this file is the maintained spec that downstream planning, implementation, and review should cite.

## Product target

The platform is not a self-hosted video warehouse. It is a small/medium media aggregation backend focused on:

- content intake from external providers and manual submission
- metadata normalization and canonical catalog management
- review and publish gates before public visibility
- playback-source and download-source management
- health checking, repair, replacement, and update tracking

## Core principles

1. External content lands in staging before it can affect the live catalog.
2. Metadata and playback/download sources are managed as separate concerns.
3. Movie, series, anime, and variety content share one canonical content model.
4. Multiple playback lines, resolutions, languages, and providers are supported.
5. Review and publish stay explicit operator gates before automation expands.
6. Source health, degradation, replacement, and retirement are first-class platform concerns.
7. Every external provider must enter through an adapter, never through scattered route-local logic.

## Recommended runtime stack

- Next.js / Node.js / TypeScript
- PostgreSQL
- Prisma
- Redis
- object storage for posters, screenshots, and static assets only
- cron and/or queued workers for ingest and maintenance jobs

## Layered architecture

```text
External Providers
-> Provider Adapter Layer
-> Ingestion Layer
-> Normalization Layer
-> Review & Publish Layer
-> Canonical Content Catalog Layer
-> Frontend Consumption Layer
-> Health & Maintenance Layer
```

### External providers

- provider APIs such as MacCMS-style endpoints
- playback-source providers
- download-link providers
- subtitle providers
- metadata providers
- manual operator submissions

### Provider adapter layer

Responsibilities:

- fetch external pages or item detail payloads
- isolate unstable provider-specific fields
- emit staging-safe intermediate shapes
- parse playback, download, subtitle, and episode candidates

### Ingestion layer

Responsibilities:

- create and run ingest jobs
- capture raw payloads
- checkpoint backfill and incremental sync state
- retry, throttle, and rate-limit provider access

### Normalization layer

Responsibilities:

- canonical title resolution
- alias and year matching
- season and episode resolution
- category, region, and language mapping
- source parsing into internal candidate structures
- duplicate and merge suggestion generation

### Review and publish layer

Responsibilities:

- review queue
- approve, reject, merge, replace, unpublish, and reorder workflows
- publish payload preparation
- review audit trail

### Canonical content catalog layer

Responsibilities:

- published `MediaTitle`, `Season`, `Episode`, `Source`, `Download`, and subtitle records
- public browse/search/detail/watch reads
- stable public identity and canonical URL resolution

### Health and maintenance layer

Responsibilities:

- source probes
- broken-link detection
- degraded/offline state transitions
- repair queue creation
- metadata refresh
- episode update checks

## Service boundaries inside the monolith

The backend should stay in one deployable application for now, with internal module boundaries rather than early microservices:

- `catalog-service`
- `ingest-service`
- `provider-service`
- `review-service`
- `source-service`
- `healthcheck-service`
- `search-service`
- `admin-api`

The corresponding repo layout should live under server-only modules such as:

- `lib/server/provider/`
- `lib/server/ingest/`
- `lib/server/normalize/`
- `lib/server/review/`
- `lib/server/catalog/`
- `lib/server/source/`
- `lib/server/health/`
- `lib/server/search/`
- `lib/server/admin/`
- `lib/db/`

## Core backend flow

```text
Provider API
-> Ingest Job Created
-> Fetch Raw Page / Item
-> Store Raw Payload
-> Convert to Candidate
-> Dedup / Match Existing Title
-> Normalize Metadata
-> Build Source Candidates
-> Review Queue
-> Approve / Merge / Reject
-> Publish to Catalog
-> Frontend Visible
-> Periodic Health Check / Episode Updates
```

## Intake modes

### Backfill / initial import

Used to establish the initial catalog:

- page through providers
- filter by update window where needed
- support throttling, retry, and resumable checkpoints

### Incremental ingest

Used for ongoing updates:

- sync by update time
- run hourly or daily
- default to staging candidates without automatic publish

## Data-state model

The platform should enforce these distinct states:

1. raw provider payload
2. staged candidate
3. normalized candidate
4. published canonical catalog record
5. health-managed source state

## Database planning intent

The schema should clearly represent:

- provider and ingest state
- candidate and review state
- canonical catalog state
- source state
- download and subtitle state
- health and audit state

The existing Prisma schema is a starting point, but backend rounds may evolve it to support staging, review, publish, and source-health workflows explicitly.

## Round mapping

This spec maps directly to the backend-first roadmap:

1. Round A: backend monolith foundation
2. Round B: provider adapter and staging schema
3. Round C: normalization and dedup pipeline
4. Round D: review and publish workflow
5. Round E: canonical catalog serving
6. Round F: source management and healthcheck
7. later: admin ops, moderation, observability, and hardening

## Documentation rule

When `reference-assets/backend.md` and tracked docs diverge, tracked docs win. New backend planning and implementation handoffs should cite this file together with:

- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/backend-delivery-workflow.md`
- `task.md`
