# Backend Delivery Workflow

Status: active delivery workflow for the post-Round-F backend phase.

This document answers three questions:

1. How far the project is from the target described in `reference-assets/backend.md`
2. What is already complete after Rounds A-F
3. What fixed workflow must be used from the current state to the final backend target

This file is the maintained execution guide. It exists so later work does not drift into temporary or ad hoc process.

## 1. Current Position

The backend-first roadmap is currently complete through:

- Round A: backend monolith foundation
- Round B: provider adapter and staging schema
- Round C: normalization and dedup pipeline
- Round D: review and publish workflow
- Round E: canonical catalog serving
- Round F: source management and healthcheck

The current accepted platform baseline includes:

- server-side module boundaries under `lib/server/` and `lib/db/`
- staging, normalization, review, publish, and published-catalog persistence
- public browse/search/detail/watch/list serving from published backend reads
- source inventory, source ordering, source health state, probe runs, and repair queue persistence
- health-aware watch-page source resolution
- a minimal admin review surface
- a completed one-provider intake-operationalization lane with durable unattended execution, resumability, bounded retry/throttle behavior, deterministic backfill/incremental orchestration, and unattended sync scheduling

Current version baseline:

- `0.25.0`

## Naming Convention

Use only these labels for backend execution going forward:

- `Phase N` in [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md)
- `Workstream N / Slice M` in [task.md](/Users/livefree/projects/media-website-v2/task.md) and new handoff files

`Round A-F` remains historical shorthand for the already completed backend baseline only. New work should not be named as new rounds.

## 2. Distance To The Backend Target

Measured against `reference-assets/backend.md`, the architecture foundation is now mostly in place, but the operational backend is not yet complete.

The easiest way to think about the gap is:

- architecture and data-flow foundation: largely in place
- operator control plane: still incomplete
- real provider operation: still incomplete
- production hardening: still incomplete

### Completed or largely established

- adapter-first backend structure
- staging-first intake model
- normalization and dedup boundaries
- explicit review and publish gate
- published catalog serving
- source-management and health-state model
- canonical watch/list identity

### Partially complete

- provider integration
  - contracts and ingest boundaries exist
  - one provider lane is now operational, but broader provider coverage and production worker deployment remain incomplete
- admin operations
  - review UI, published catalog UI, source inventory UI, repair queue UI, and moderation/manual-submission flows now exist
  - lifecycle mutations and some operator-control completions still remain
- source maintenance
  - health state and repair queue exist in backend form
  - full operator workflows around replacement and retirement still remain

### Not complete

- full admin control plane
- publish scheduling and visibility control
- broader provider coverage and production worker deployment model
- observability, metrics, alerts, and queue visibility
- RBAC / auth hardening for admin operations
- backup, restore, migration safety, and production readiness

## 3. Completion Assessment

If the target is the full backend described in `backend.md`, the project is not at the end state yet.

A practical assessment is:

- foundational backend architecture: strong
- operational backend completeness: medium
- launch-readiness: still incomplete

The project is now past the "prototype backend" stage, but not yet at the "operated media aggregation platform" stage.

The remaining work is concentrated in:

1. operator/admin control plane completion
2. governance completion
3. observability, security, and launch hardening
4. broader provider coverage beyond the first operational lane

## 4. Non-Ad-Hoc Delivery Rule

From this point forward, work must follow the tracked roadmap and this workflow.

The Coordinator must not invent temporary phase names for the main program.

Allowed labels:

- existing roadmap phases
- existing accepted rounds when continuing an already-defined phase slice
- clearly documented work packages that are mapped to a roadmap phase before implementation starts

If a new work package is needed, it must first be added to tracked docs before implementation begins.

## 5. Fixed Development Workflow

Every backend work package must follow this sequence:

1. Coordinator aligns the work package to:
   - `docs/backend-spec.md`
   - `docs/roadmap.md`
   - this file
   - `task.md`
2. Planner produces a handoff with:
   - scope
   - ownership
   - non-goals
   - acceptance criteria
   - implementation order
3. Implementing agents execute strictly in the planned order
4. Reviewer validates the result against the handoff and current task
5. Coordinator merges only accepted work
6. Coordinator updates versioning only if the milestone level changed
7. Coordinator pushes `main`

No specialist-owned runtime work should be merged without reviewer acceptance.

## 6. Fixed Agent Order By Work Type

### Provider and ingest work

Use:

- `planner`
- `media-ingest`
- `data-catalog`
- `reviewer`

### Published runtime serving work

Use:

- `planner`
- `data-catalog`
- `search-filter` when browse/search are affected
- `ui-shell` when public list or admin presentation is affected
- `detail-player` when watch/detail are affected
- `reviewer`

### Source-health playback behavior work

Use:

- `planner`
- `data-catalog`
- `detail-player`
- `reviewer`

### Admin and moderation work

Use:

- `planner`
- `data-catalog`
- `ui-shell`
- `reviewer`

### Observability and hardening work

Use:

- `planner`
- `media-ingest` when jobs/providers are involved
- `data-catalog`
- `reviewer`

## 7. Remaining Program Of Work

The remaining path to the backend target should now be run as four fixed workstreams.

### Workstream 1: Make provider intake operational

Mapped to:

- completion hardening of roadmap Phases 2 and 6

Deliverables:

- real provider adapters for target providers
- incremental and backfill job execution
- throttling, retry, checkpoint, and resumability
- scheduled refresh and source probe jobs
- Redis-backed or equivalent operational worker execution

Exit gate:

- the system can continuously ingest and refresh provider data without manual scripts

### Workstream 2: Build the operator control plane

Mapped to:

- roadmap Phase 7

Deliverables:

- review queue management
- published catalog management
- source inventory management
- repair queue management
- reorder / replace / unpublish operations
- manual title creation and manual source submission

Exit gate:

- operators no longer need direct DB edits for core catalog and source workflows

### Workstream 3: Add moderation and content governance

Mapped to:

- roadmap Phase 7

Deliverables:

- broken-source report handling
- moderation queue
- visibility control
- publish scheduling
- audit-friendly operator actions

Exit gate:

- editor and moderator responsibilities are executable inside the product

### Workstream 4: Production hardening

Mapped to:

- roadmap Phase 8

Deliverables:

- structured logging
- metrics and alerts
- queue failure monitoring
- provider failure visibility
- RBAC / auth hardening
- backup and restore procedures
- migration safety
- end-to-end validation across ingest -> normalize -> review -> publish -> watch -> healthcheck

Exit gate:

- the system can run as an operated production backend instead of a development-stage backend

## 8. Immediate Next Planned Sequence

The next approved sequence after Round F was:

1. Workstream 1, slice 1:
   real provider execution path for at least one target provider
2. Workstream 1, slice 2:
   scheduled refresh and probe jobs with durable job state
3. Workstream 2, slice 1:
   admin source inventory and repair queue UI
4. Workstream 2, slice 2:
   published catalog management UI
5. Workstream 3:
   moderation and manual submission workflows
6. Workstream 4:
   observability, security, and launch hardening

This sequence should not be reordered unless tracked docs are updated first.

## 8A. Current Execution Position

The accepted execution baseline now includes:

- Workstream 1 / Slice 1
- Workstream 1 / Slice 2
- Workstream 1 / Slice 3
- Workstream 1 / Slice 4
- Workstream 1 / Slice 5
- Workstream 1 / Slice 6
- Workstream 1 / Slice 7
- Workstream 2 / Slice 1
- Workstream 2 / Slice 2
- Workstream 3
- Workstream 4 / Slice 1
- Workstream 4 / Slice 2
- Workstream 4 / Slice 3
- Workstream 4 / Slice 4
- Workstream 4 / Slice 5

The currently active slice should always be read from [task.md](/Users/livefree/projects/media-website-v2/task.md), not inferred from this historical sequence.

## 8B. Current Queue After Workstream 1 Exit Gate

With Workstream 1 now accepted for one provider lane, the fixed remaining queue is:

1. Workstream 2 / Slice 3
   source and catalog lifecycle mutations required to avoid direct DB edits for replace / reorder / unpublish workflows
2. Workstream 3 / Slice 2
   publish scheduling and visibility control needed to complete the governance exit gate
3. Workstream 4 follow-up slices
   any remaining alert-ready provider failure visibility, recovery readiness, backup/restore, and launch-validation work that reviewer acceptance still leaves open

No new backend work packages should skip ahead of this queue unless tracked docs are updated first.

## 9. Launch Gate

The backend target from `backend.md` should only be considered substantially complete when all of the following are true:

- provider intake is real and operational
- review and publish are productized
- public serving is fully backend-driven
- source management and health workflows are operational
- admin and moderation workflows are productized
- observability and security are in place
- key operations no longer require direct database manipulation

Until those gates are met, the project should be treated as a strong pre-launch backend platform, not a finished aggregation backend.
