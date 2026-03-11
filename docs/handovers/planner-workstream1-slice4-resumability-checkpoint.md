# Planner Handoff: Workstream 1 / Slice 4 - Resumability And Checkpoint Hardening

## Task Summary

This slice hardens the provider pipeline for restart-safe continuation by tightening checkpoint correctness, resumable execution, and idempotent recovery for provider jobs. The goal is to ensure that an interrupted or restarted provider job can continue from durable state predictably without duplicating work, losing progress, or corrupting job outcome semantics.

Required execution order for this slice:

1. `planner`
2. `media-ingest`
3. `data-catalog` only if durable backend support is required outside existing ingest boundaries
4. `reviewer`

`ui-shell`, `search-filter`, and `detail-player` do not participate in this slice.

## Implementation Scope

This slice is limited to resumability and checkpoint hardening for provider jobs.

In scope:

- restart-safe continuation for one narrow provider-job path
- deterministic checkpoint correctness rules for that path
- idempotent recovery behavior when a job resumes after interruption
- fixture-backed, offline-safe recovery tests
- build validation

Expected outcomes:

- a provider job can resume from durable checkpoint state after interruption or restart
- resumed execution does not silently duplicate staged work or regress checkpoint progress
- checkpoint state remains coherent with accepted job-state and telemetry behavior

## Preferred Slice Shape

This slice should prefer:

1. one deterministic interrupted-job recovery path
2. explicit checkpoint advancement rules
3. idempotent re-entry at the last safe durable boundary
4. fixture-backed offline-safe recovery tests

It should not expand into a broad reliability program or retry-policy redesign.

## Explicit Non-Goals

Out of scope for this slice:

- broad infrastructure migration
- new public behavior
- public route redesign
- player or watch-page changes
- admin redesign
- general operations-suite expansion
- broad retry/throttling redesign beyond what is minimally required for restart-safe continuation
- multi-provider matrix recovery testing

## Ownership Split

### Media Ingest

Primary owner for this slice.

Allowed scope:

- `lib/server/provider/`
- `lib/server/ingest/`
- provider-job checkpoint handling
- worker restart or re-entry support inside existing ingest boundaries
- fixture-backed recovery tests

Responsibilities:

- define the restart-safe continuation path for one narrow provider-job flow
- harden checkpoint write and resume semantics so the last durable safe point is explicit
- ensure resumed execution is idempotent relative to already persisted work
- keep job-state and telemetry coherence during interrupted and resumed execution

Must not:

- broaden into a large worker-platform redesign
- redesign public routes or admin surfaces
- expand the slice into a full retry or throttling program

### Data Catalog

Participates only if resumability needs durable support outside existing ingest boundaries.

Allowed scope:

- `lib/db/`
- only the minimal repository or durable-state support needed to complete checkpoint correctness or idempotent recovery cleanly

Responsibilities if needed:

- add the smallest possible durable support for checkpoint correctness outside ingest-owned boundaries
- keep any new support isolated from public-route and admin-surface behavior

Must not:

- broaden into unrelated catalog or admin work
- expand the slice into general backend refactors

### Reviewer

Owns acceptance validation for restart-safe continuation, checkpoint correctness, idempotent recovery, offline-safe tests, and build health.

## Checkpoint Rule

Checkpoint state must represent the last durable safe continuation point, not just the last attempted step. Resumed execution should re-enter from a state that is safe to replay deterministically and should not assume that in-memory progress from the interrupted process still exists.

## Test Requirements

Mandatory:

- offline-safe tests for interrupted-job resume from checkpoint
- offline-safe tests for idempotent recovery after interruption
- offline-safe tests that verify checkpoint advancement only occurs at the intended safe boundary
- offline-safe tests that verify resumed execution keeps job state and telemetry coherent
- build and test path remain healthy

Tests should prove:

- a provider job interrupted after partial progress can continue from durable checkpoint state
- resumed execution does not create duplicate staged outputs beyond the slice's allowed idempotent model
- checkpoint state does not advance past uncommitted or unsafe work
- terminal job outcome and telemetry remain coherent after recovery

## Reviewer Acceptance Checklist

This slice is accepted only if all of the following are true:

- provider jobs now have a real restart-safe continuation path through durable checkpoint state
- checkpoint correctness is explicit and enforced at the intended safe boundary
- resumed execution is idempotent enough to avoid duplicate or corrupted downstream state in the chosen path
- the slice stays narrow and does not broaden into infra migration, public behavior changes, player work, admin redesign, or ops-suite expansion
- offline-safe tests and build validation are present and passing

## Implementation Checklist Per Owning Agent

### Media Ingest Checklist

- choose one stable provider-job flow for the resumability path
- define the exact durable checkpoint boundary for that flow
- ensure resumed execution re-enters from that boundary rather than from process-local assumptions
- harden staged-write or handoff behavior so resumed execution is idempotent
- keep accepted job-state and telemetry coherent during interruption and recovery
- add deterministic tests for interrupt, resume, checkpoint correctness, and idempotent recovery

### Data Catalog Checklist

- participate only if minimal durable support outside ingest boundaries is required
- add the smallest possible repository or durable-state support needed for checkpoint correctness or idempotent recovery
- keep any added support isolated from public-route and admin behavior
- add deterministic tests only for the added durable support if it exists

### Reviewer Checklist

- verify the required execution order was respected
- verify the slice produces a real restart-safe continuation path for provider jobs
- verify checkpoint advancement matches the intended safe durable boundary
- verify resumed execution is idempotent within the chosen path
- verify no public-route changes, player work, admin redesign, infra migration, or ops-suite expansion were introduced
- verify offline-safe tests and build validation are present
- fail the slice if recovery still depends mainly on manual re-runs without deterministic checkpoint semantics
