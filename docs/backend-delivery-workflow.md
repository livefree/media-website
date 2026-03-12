# Backend Delivery Workflow

Status: tracked backend delivery workflow complete under the agreed scope.

This document is now a historical backend-program record plus a fixed delivery rulebook.

Execution now uses a two-layer model:

- [docs/project-frame.md](/Users/livefree/projects/media-website-v2/docs/project-frame.md) for persistent program state, workstreams, blockers, launch criteria, and approved slice queue
- [task.md](/Users/livefree/projects/media-website-v2/task.md) for the active slice only

This file should not be used as the live current-slice tracker.

This document answers three questions:

1. How far the project is from the target described in `reference-assets/backend.md`
2. What is already complete after Rounds A-F
3. What fixed workflow must be used from the current state to the final backend target

This file remains the maintained backend execution guide. It exists so later work does not drift into temporary or ad hoc process.

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

- `0.31.1`

## Naming Convention

Use only these labels for backend execution going forward:

- `Phase N` in [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md)
- `Workstream N / Slice M` in [task.md](/Users/livefree/projects/media-website-v2/task.md) and new handoff files

`Round A-F` remains historical shorthand for the already completed backend baseline only. New work should not be named as new rounds.

## 2. Distance To The Backend Target

Measured against `reference-assets/backend.md`, the tracked backend program is now complete under its agreed scope, but broader post-launch and expansion work still remains outside that tracked scope.

The easiest way to think about the gap is:

- architecture and data-flow foundation: largely in place
- operator control plane: complete within the tracked backend scope
- real provider operation: one-provider lane operational, broader coverage still incomplete
- production hardening: accepted through final launch validation and readiness confirmation

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
  - review UI, published catalog UI, source inventory UI, repair queue UI, moderation/manual-submission flows, and lifecycle mutations now exist
  - broader post-launch control-plane expansion may still remain, but the tracked operator-control slices are accepted
- source maintenance
  - health state, repair queue, and bounded lifecycle workflows exist in backend form
  - broader production policy automation may still remain beyond the tracked backend scope

### Still outside the completed tracked scope

- broader provider coverage and production worker deployment model
- post-launch infrastructure automation and expansion work

## 3. Completion Assessment

If the target is the tracked backend program defined through `task.md`, `docs/backend-spec.md`, and this workflow, the queue is now complete. If the target is the full long-horizon platform vision implied by `backend.md`, additional out-of-scope follow-on work still remains.

A practical assessment is:

- foundational backend architecture: strong
- operational backend completeness under tracked scope: strong
- launch-readiness under tracked scope: accepted

The project is now past the "prototype backend" stage and has closed the tracked operator-ready backend queue, but it is not yet the full long-horizon post-launch platform.

Residual follow-on work is concentrated in:

1. broader provider coverage beyond the first operational lane
2. post-launch infrastructure and expansion work outside the tracked backend queue

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

The tracked backend queue has now been exhausted.

### Final remaining queue

Accepted to date:

- Workstream 1 exit gate complete
- Workstream 2 exit gate complete
- Workstream 3 exit gate complete
- Workstream 4 / Slices 1-8 accepted

Remaining deliverables:

- none inside the completed tracked backend queue

Exit gate:

- met: the backend is operator-ready under the tracked scope, with final launch-validation coverage and a documented readiness decision
- met: the system can run as an operated development backend without direct DB intervention for the tracked operator workflows

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
- Workstream 4 / Slice 6
- Workstream 4 / Slice 7
- Workstream 4 / Slice 8
- Workstream 2 / Slice 3
- Workstream 3 / Slice 2

The currently active slice should always be read from [task.md](/Users/livefree/projects/media-website-v2/task.md), not inferred from this historical sequence.

## 8B. Current Queue After Workstream 1 Exit Gate

With Workstreams 1, 2, and 3 accepted plus Workstream 4 / Slices 1-8 accepted, the fixed tracked backend queue is exhausted.

No new backend work packages should be treated as automatic continuation of this queue unless tracked docs are explicitly reopened through the Project Frame and an active slice is set in `task.md`.

## 9. Launch Gate

The backend target from `backend.md` should only be considered substantially complete when all of the following are true:

- provider intake is real and operational
- review and publish are productized
- public serving is fully backend-driven
- source management and health workflows are operational
- admin and moderation workflows are productized
- observability and security are in place
- key operations no longer require direct database manipulation

Those gates are met for the tracked backend scope. Any future work beyond this point should be treated as a new tracked program, not silent continuation of the completed backend queue.
