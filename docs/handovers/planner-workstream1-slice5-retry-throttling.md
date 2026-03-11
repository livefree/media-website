# Planner Handoff: Workstream 1 / Slice 5 - Retry And Throttling Guardrails

## Task Summary

This slice hardens queued provider execution by adding bounded retry behavior, provider-aware throttling, and safe backoff semantics for unattended jobs. The goal is to make provider execution rate-aware and failure-tolerant without creating unbounded retry loops, provider hammering, or ambiguous recovery timing.

Required execution order for this slice:

1. `planner`
2. `media-ingest`
3. `data-catalog` only if durable backend support is required outside existing ingest boundaries
4. `reviewer`

`ui-shell`, `search-filter`, and `detail-player` do not participate in this slice.

## Implementation Scope

This slice is limited to bounded retry, provider-aware throttling, and safe backoff semantics for queued provider jobs.

In scope:

- bounded retry rules for one narrow provider-job path
- provider-aware throttling rules that prevent unsafe request cadence
- deterministic backoff timing semantics suitable for offline-safe tests
- integration with accepted durable worker, checkpoint, job-state, and telemetry behavior
- build validation

Expected outcomes:

- queued provider jobs do not retry indefinitely
- provider jobs respect explicit provider-aware throttling boundaries
- failure and retry timing behavior becomes deterministic and reviewable

## Preferred Slice Shape

This slice should prefer:

1. explicit bounded retry counts
2. explicit provider-aware throttle windows
3. deterministic backoff timing
4. fixture-backed offline-safe tests

It should not broaden into a general queue platform or infrastructure rewrite.

## Explicit Non-Goals

Out of scope for this slice:

- broad infrastructure migration
- external queue platform adoption
- public behavior changes
- public route redesign
- player or watch-page changes
- admin redesign
- broad provider-contract redesign
- full multi-provider scheduling optimization
- general operations-suite expansion

## Ownership Split

### Media Ingest

Primary owner for this slice.

Allowed scope:

- `lib/server/provider/`
- `lib/server/ingest/`
- queued provider job execution rules
- retry, throttle, and backoff behavior inside existing ingest boundaries
- fixture-backed deterministic tests

Responsibilities:

- define bounded retry behavior for one narrow queued provider-job path
- define provider-aware throttling semantics for that path
- ensure backoff timing is deterministic and compatible with accepted worker, checkpoint, and telemetry behavior
- prevent unsafe rapid retry loops or provider hammering within the slice's scope

Must not:

- broaden into a full queue-platform redesign
- redesign public routes or admin surfaces
- expand into a broad scheduling or orchestration program

### Data Catalog

Participates only if retry/throttle guardrails need durable backend support outside existing ingest boundaries.

Allowed scope:

- `lib/db/`
- only the minimal repository or durable-state support needed for retry or throttle guardrails outside ingest-owned boundaries

Responsibilities if needed:

- add the smallest possible durable support required for bounded retry or throttle semantics
- keep any added support isolated from public-route and admin-surface behavior

Must not:

- broaden into unrelated catalog or admin work
- expand the slice into general backend refactors

### Reviewer

Owns acceptance validation for bounded retry behavior, provider-aware throttling, deterministic backoff, offline-safe tests, and build health.

## Retry And Throttle Rule

Retry behavior must be bounded and explicit. Throttling must be provider-aware and should prevent the worker path from issuing requests more aggressively than the selected provider guardrail allows. Backoff timing should be deterministic enough to test without live network timing assumptions or flaky wall-clock dependence.

## Test Requirements

Mandatory:

- offline-safe tests for bounded retry limit behavior
- offline-safe tests for provider-aware throttle enforcement
- offline-safe tests for deterministic backoff timing or retry scheduling behavior
- offline-safe tests that verify retry, throttle, and backoff semantics stay coherent with accepted worker/job-state behavior
- build and test path remain healthy

Tests should prove:

- a queued provider job stops retrying when the configured bound is reached
- provider-aware throttle windows block unsafe request cadence
- backoff timing advances predictably across retry attempts
- retry and throttle handling do not corrupt job state, checkpoint state, or telemetry semantics

## Reviewer Acceptance Checklist

This slice is accepted only if all of the following are true:

- queued provider jobs now have explicit bounded retry behavior
- provider-aware throttling prevents unsafe request cadence for the chosen path
- backoff semantics are deterministic and test-backed
- the slice stays narrow and does not broaden into infra migration, external queue adoption, public behavior changes, player work, admin redesign, or operations-suite expansion
- offline-safe tests and build validation are present and passing

## Implementation Checklist Per Owning Agent

### Media Ingest Checklist

- choose one stable queued provider-job path for retry/throttle hardening
- define the retry bound and terminal behavior for that path
- define the provider-aware throttle window and request-cadence rule
- define deterministic backoff timing semantics compatible with offline-safe tests
- keep accepted worker, checkpoint, job-state, and telemetry behavior coherent under retry and throttle conditions
- add deterministic tests for retry bounds, throttle enforcement, and backoff timing

### Data Catalog Checklist

- participate only if minimal durable support outside ingest boundaries is required
- add the smallest possible repository or durable-state support needed for retry or throttle semantics
- keep any added support isolated from public-route and admin behavior
- add deterministic tests only for the added durable support if it exists

### Reviewer Checklist

- verify the required execution order was respected
- verify the slice produces real bounded retry behavior for the chosen queued provider-job path
- verify provider-aware throttling is enforced
- verify backoff timing is deterministic and test-backed
- verify no public-route changes, player work, admin redesign, infra migration, external queue adoption, or operations-suite expansion were introduced
- verify offline-safe tests and build validation are present
- fail the slice if retry behavior remains effectively unbounded or if throttling still depends mainly on undocumented manual discipline
