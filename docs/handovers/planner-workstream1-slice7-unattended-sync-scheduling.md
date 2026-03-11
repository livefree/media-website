# Planner Handoff: Workstream 1 / Slice 7 - Unattended Provider Sync Scheduling

## Task Summary

This slice completes the Workstream 1 exit gate by adding unattended repeatable scheduling for the already accepted one-provider sync lane. The goal is to let that provider lane continue ingest and refresh cycles without manual scripts, using deterministic in-repo scheduling semantics that remain testable and reviewable.

Required execution order for this slice:

1. `planner`
2. `media-ingest`
3. `data-catalog` only if minimal durable support outside existing ingest boundaries is required
4. `reviewer`

`ui-shell`, `search-filter`, and `detail-player` do not participate in this slice.

## Implementation Scope

This slice is limited to unattended repeatable scheduling for the already accepted one-provider sync lane.

In scope:

- deterministic in-repo scheduling semantics for the existing incremental sync lane
- deterministic in-repo scheduling semantics for the existing backfill sync lane where it still applies
- trigger, skip, defer, and reschedule rules for unattended sync execution
- safe coordination between scheduled runs and already accepted worker/orchestration/checkpoint/retry/throttle behavior
- fixture-backed, offline-safe scheduling tests
- build validation

Expected outcomes:

- the chosen provider lane can continue running on unattended scheduling semantics instead of manual script invocation
- repeated sync execution is governed by explicit trigger and skip rules
- scheduled execution remains deterministic and reviewable under offline-safe tests

## Preferred Slice Shape

This slice should prefer:

1. one provider lane
2. one in-repo scheduling contract
3. deterministic trigger and skip rules
4. offline-safe scheduling tests

It should not broaden into a general scheduler platform or fleet-wide orchestration layer.

## Explicit Non-Goals

Out of scope for this slice:

- broad infrastructure migration
- external scheduler platform adoption
- public behavior changes
- public route redesign
- player or watch-page changes
- admin redesign
- multi-provider orchestration sprawl
- general operations-suite expansion

## Ownership Split

### Media Ingest

Primary owner for this slice.

Allowed scope:

- `lib/server/provider/`
- `lib/server/ingest/`
- in-repo sync scheduling semantics for the accepted provider lane
- fixture-backed scheduling tests

Responsibilities:

- define the unattended scheduling contract for the chosen provider lane
- define when incremental runs should trigger, skip, defer, or reschedule
- define how backfill scheduling behaves if the lane still requires backfill coordination
- keep scheduling semantics compatible with accepted worker, checkpoint, retry, throttle, and orchestration behavior
- prevent unsafe overlapping scheduled runs in the chosen lane

Must not:

- broaden into an external scheduling platform
- redesign public routes or admin surfaces
- expand into a multi-provider scheduling matrix

### Data Catalog

Participates only if unattended scheduling needs minimal durable support outside existing ingest boundaries.

Allowed scope:

- `lib/db/`
- only the minimal repository or durable-state support needed for scheduling semantics outside ingest-owned boundaries

Responsibilities if needed:

- add the smallest possible durable support required for unattended scheduling state
- keep any added support isolated from public-route and admin-surface behavior

Must not:

- broaden into unrelated catalog or admin work
- expand the slice into general backend refactors

### Reviewer

Owns acceptance validation for deterministic unattended scheduling semantics, offline-safe tests, scope discipline, and build health.

## Scheduling Rule

Unattended scheduling must be explicit and deterministic. The chosen provider lane should not rely on manual scripts, ad hoc cron wrappers, or undocumented operator timing to continue syncing. The slice should make it reviewable when a scheduled run should fire, when it must skip, and when it must defer because another compatible run is already active or the lane is not ready.

## Test Requirements

Mandatory:

- offline-safe tests for deterministic incremental scheduling behavior
- offline-safe tests for deterministic backfill scheduling behavior if backfill remains part of the chosen lane
- offline-safe tests for skip or defer behavior when a scheduled run should not start
- offline-safe tests that verify scheduling stays coherent with accepted worker, orchestration, checkpoint, retry, and throttle behavior
- build and test path remain healthy

Tests should prove:

- the accepted provider lane can be triggered through unattended scheduling semantics
- scheduled runs follow explicit trigger, skip, or defer rules
- overlapping or conflicting scheduled runs are prevented or deferred deterministically
- scheduled execution remains coherent with the existing durable worker lane

## Reviewer Acceptance Checklist

This slice is accepted only if all of the following are true:

- the accepted provider lane now supports unattended repeatable scheduling without manual scripts
- scheduling behavior is deterministic and test-backed
- trigger, skip, and defer behavior are explicit for the chosen lane
- the slice stays narrow and does not broaden into infra migration, external scheduler adoption, public behavior changes, player work, admin redesign, or multi-provider sprawl
- offline-safe tests and build validation are present and passing

## Implementation Checklist Per Owning Agent

### Media Ingest Checklist

- choose the accepted provider lane for unattended scheduling
- define deterministic trigger rules for incremental runs
- define deterministic backfill scheduling rules only as far as the chosen lane still needs them
- define skip and defer behavior when the lane is already active or not eligible
- keep accepted worker, orchestration, checkpoint, retry, and throttle behavior coherent under unattended scheduling
- add deterministic tests for scheduled trigger, skip, defer, and repeat execution behavior

### Data Catalog Checklist

- participate only if minimal durable support outside ingest boundaries is required
- add the smallest possible repository or durable-state support needed for unattended scheduling semantics
- keep any added support isolated from public-route and admin behavior
- add deterministic tests only for the added durable support if it exists

### Reviewer Checklist

- verify the required execution order was respected
- verify the slice produces real unattended repeatable scheduling for the accepted provider lane
- verify trigger, skip, and defer semantics are deterministic and test-backed
- verify no public-route changes, player work, admin redesign, infra migration, external scheduler adoption, or multi-provider sprawl were introduced
- verify offline-safe tests and build validation are present
- fail the slice if sustained provider sync still depends mainly on manual script invocation or undocumented operator timing
