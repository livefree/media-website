# Planner Handoff: Workstream 1 / Slice 6 - Incremental And Backfill Sync Orchestration

## Task Summary

This slice adds sustained provider sync orchestration for incremental and backfill execution on top of the accepted worker, checkpoint, retry, and throttling foundation. The goal is to make one provider's intake flow run through explicit orchestration semantics for backfill and incremental modes, instead of isolated single-job execution only.

Required execution order for this slice:

1. `planner`
2. `media-ingest`
3. `data-catalog` only if durable backend support is required outside existing ingest boundaries
4. `reviewer`

`ui-shell`, `search-filter`, and `detail-player` do not participate in this slice.

## Implementation Scope

This slice is limited to sustained sync orchestration for incremental and backfill execution.

In scope:

- one narrow orchestration path for backfill sync execution
- one narrow orchestration path for incremental sync execution
- deterministic scheduling and coordination semantics between those two modes
- safe prevention of overlapping or conflicting sync runs for the chosen provider path
- fixture-backed, offline-safe orchestration tests
- build validation

Expected outcomes:

- the chosen provider can run through explicit backfill orchestration rather than only ad hoc job launches
- the chosen provider can run through explicit incremental orchestration rather than only isolated refresh triggers
- orchestration semantics make it clear when a sync should start, continue, wait, or yield to another sync mode

## Preferred Slice Shape

This slice should prefer:

1. one provider
2. one deterministic backfill path
3. one deterministic incremental path
4. explicit orchestration rules between them

It should not broaden into a multi-provider orchestration platform.

## Explicit Non-Goals

Out of scope for this slice:

- broad infrastructure migration
- public behavior changes
- public route redesign
- player or watch-page changes
- admin redesign
- multi-provider matrix explosion
- broad scheduling platform work
- general operations-suite expansion

## Ownership Split

### Media Ingest

Primary owner for this slice.

Allowed scope:

- `lib/server/provider/`
- `lib/server/ingest/`
- provider sync planning and execution coordination inside existing ingest boundaries
- fixture-backed orchestration tests

Responsibilities:

- define the narrow orchestration model for one provider's backfill and incremental sync paths
- define how incremental and backfill modes are scheduled or coordinated relative to one another
- prevent unsafe overlapping sync execution within the chosen slice
- keep orchestration semantics compatible with accepted worker, checkpoint, retry, throttle, and telemetry behavior

Must not:

- broaden into a general orchestration platform
- redesign public routes or admin surfaces
- expand into a multi-provider scheduling matrix

### Data Catalog

Participates only if sync orchestration needs durable backend support outside existing ingest boundaries.

Allowed scope:

- `lib/db/`
- only the minimal repository or durable-state support needed for orchestration semantics outside ingest-owned boundaries

Responsibilities if needed:

- add the smallest possible durable support required for sync orchestration state
- keep any added support isolated from public-route and admin-surface behavior

Must not:

- broaden into unrelated catalog or admin work
- expand the slice into general backend refactors

### Reviewer

Owns acceptance validation for deterministic orchestration semantics, offline-safe tests, scope discipline, and build health.

## Orchestration Rule

Backfill and incremental execution must have explicit coordination rules. The chosen provider path should not rely on undocumented operator timing or lucky process ordering to avoid collisions. The slice should make it deterministic when a new incremental run is allowed, deferred, merged, or blocked relative to an active or incomplete backfill run.

## Test Requirements

Mandatory:

- offline-safe tests for deterministic backfill orchestration behavior
- offline-safe tests for deterministic incremental orchestration behavior
- offline-safe tests for coordination or conflict handling between incremental and backfill runs
- offline-safe tests that verify orchestration remains coherent with accepted worker, checkpoint, retry, and throttle behavior
- build and test path remain healthy

Tests should prove:

- a backfill sync can be orchestrated through the intended provider path
- an incremental sync can be orchestrated through the intended provider path
- orchestration rules prevent unsafe overlapping or conflicting sync execution
- sync-state progression remains deterministic and reviewable

## Reviewer Acceptance Checklist

This slice is accepted only if all of the following are true:

- the chosen provider now has explicit orchestration semantics for both backfill and incremental execution
- coordination between backfill and incremental runs is deterministic and test-backed
- the slice stays narrow and does not broaden into infra migration, public behavior changes, player work, admin redesign, or multi-provider orchestration sprawl
- offline-safe tests and build validation are present and passing

## Implementation Checklist Per Owning Agent

### Media Ingest Checklist

- choose one stable provider path for sync orchestration
- define the deterministic orchestration rules for backfill runs
- define the deterministic orchestration rules for incremental runs
- define how the two modes coordinate or block one another
- keep accepted worker, checkpoint, retry, throttle, and telemetry behavior coherent under orchestration
- add deterministic tests for backfill flow, incremental flow, and coordination behavior

### Data Catalog Checklist

- participate only if minimal durable support outside ingest boundaries is required
- add the smallest possible repository or durable-state support needed for orchestration semantics
- keep any added support isolated from public-route and admin behavior
- add deterministic tests only for the added durable support if it exists

### Reviewer Checklist

- verify the required execution order was respected
- verify the slice produces real orchestration semantics for both backfill and incremental execution
- verify overlapping or conflicting sync execution is handled deterministically
- verify no public-route changes, player work, admin redesign, infra migration, or multi-provider sprawl were introduced
- verify offline-safe tests and build validation are present
- fail the slice if orchestration still depends mainly on manual timing or ad hoc operator sequencing
