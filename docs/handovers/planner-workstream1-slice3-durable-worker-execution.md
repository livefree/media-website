# Planner Handoff: Workstream 1 / Slice 3 - Durable Worker Execution

## Task Summary

This slice adds durable unattended worker execution for provider jobs on top of the accepted real-provider path, scheduled refresh/probe jobs, durable job state, structured telemetry, and migration-safety baseline. The goal is to move provider execution from process-local or manually triggered paths toward a durable in-repo worker model that can claim, execute, and complete jobs safely without broad infrastructure rewrite.

Required execution order for this slice:

1. `planner`
2. `media-ingest`
3. `data-catalog` only if durable backend support is required outside existing ingest boundaries
4. `reviewer`

`ui-shell`, `search-filter`, and `detail-player` do not participate in this slice.

## Implementation Scope

This slice is limited to durable unattended worker execution for provider jobs.

In scope:

- one in-repo, testable worker abstraction for queued provider jobs
- durable claim, execution, completion, and failure flow for worker-owned provider jobs
- a queue contract that supports unattended worker pickup without requiring broad platform migration
- safe interaction with the already accepted job-state and telemetry model
- offline-safe tests for worker claim, success, failure, and duplicate-pickup protection
- build validation

Expected outcomes:

- provider jobs can be executed by a durable unattended worker loop rather than only by direct invocation
- worker execution uses an explicit queue contract and does not depend on ad hoc process-local assumptions
- existing job-state and telemetry boundaries remain coherent under unattended execution

## Preferred Slice Shape

This slice should prefer:

1. an in-repo worker contract
2. durable claim or lease semantics
3. deterministic worker execution behavior
4. testable failure and completion transitions

It should not start with a broad infrastructure or orchestration rewrite.

## Explicit Non-Goals

Out of scope for this slice:

- full infrastructure or platform migration
- broad CI/CD redesign
- public behavior changes
- public route redesign
- player or watch-page changes
- admin redesign
- multi-worker fleet management
- advanced retry-policy redesign beyond what is minimally required for durable unattended execution
- broad provider-contract redesign

## Ownership Split

### Media Ingest

Primary owner for this slice.

Allowed scope:

- `lib/server/provider/`
- `lib/server/ingest/`
- worker runtime support for provider jobs
- queue claim or lease semantics inside existing ingest boundaries
- fixture-backed execution paths and worker tests

Responsibilities:

- define the narrow in-repo worker abstraction for provider jobs
- ensure the worker can pick up queued jobs durably and execute them unattended
- integrate the worker flow with existing ingest job state and telemetry without reopening accepted boundaries
- prevent obvious duplicate pickup or ambiguous worker ownership within the slice's narrow durability model

Must not:

- broaden into an infrastructure-platform rewrite
- redesign public routes or admin surfaces
- expand the slice into generalized orchestration beyond provider-job execution

### Data Catalog

Participates only if the worker model requires durable backend support outside existing ingest boundaries.

Allowed scope:

- `lib/db/`
- only the minimal durable repository or shared backend support needed to complete the worker contract cleanly

Responsibilities if needed:

- provide minimal durable support that `media-ingest` cannot complete inside current ingest boundaries alone
- keep any added support tightly scoped to worker durability and away from public-route behavior

Must not:

- broaden into unrelated catalog or admin work
- expand the slice into general backend refactors

### Reviewer

Owns acceptance validation for worker durability, scope discipline, offline-safe tests, and build health.

## Queue-Contract Rule

The worker path must rely on one explicit queue contract, not hidden process-local assumptions. A queued job should move through clear ownership and terminal-state transitions so unattended execution is testable and reviewable. The contract may be Redis-backed or equivalent, but the planning target is a narrow in-repo abstraction rather than a large infrastructure swap.

## Test Requirements

Mandatory:

- offline-safe tests for durable worker claim or pickup behavior
- offline-safe tests for successful unattended worker execution
- offline-safe tests for failure handling under worker execution
- offline-safe tests that protect against duplicate pickup or ambiguous concurrent ownership within the chosen worker model
- build and test path remain healthy

Tests should prove:

- a queued provider job can be picked up by the worker through the intended durable contract
- worker execution updates job state and telemetry coherently
- failed worker execution transitions remain deterministic
- duplicate or conflicting pickup is prevented or safely resolved within the slice's chosen durability model

## Reviewer Acceptance Checklist

This slice is accepted only if all of the following are true:

- provider jobs can now run through a durable unattended worker path
- the worker path uses an explicit, testable queue contract rather than ad hoc process-local execution
- job-state and telemetry behavior remain coherent under worker execution
- the slice stays narrow and does not broaden into infra migration, CI/CD redesign, public behavior changes, or admin redesign
- offline-safe tests and build validation are present and passing

## Implementation Checklist Per Owning Agent

### Media Ingest Checklist

- define one narrow worker abstraction for provider jobs
- wire the worker to claim queued jobs through a durable contract
- keep worker execution compatible with accepted job-state and telemetry behavior
- add duplicate-pickup protection appropriate to the chosen contract
- add deterministic tests for claim, success, failure, and duplicate-pickup cases

### Data Catalog Checklist

- participate only if minimal durable backend support is required outside ingest-owned boundaries
- add the smallest possible repository or durable state support needed to complete the worker contract
- keep any new support isolated from public-route and admin-surface behavior
- add deterministic tests only for the added durable support if it exists

### Reviewer Checklist

- verify the required execution order was respected
- verify the slice produces a real durable unattended worker path for provider jobs
- verify the worker path is driven by an explicit queue contract
- verify duplicate-pickup or ambiguous worker ownership is handled safely within the chosen model
- verify no public-route changes, player work, admin redesign, infra-platform migration, or broad CI/CD redesign were introduced
- verify offline-safe tests and build validation are present
- fail the slice if worker execution still depends primarily on manual or process-local invocation patterns
