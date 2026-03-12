# Project Task

Recreate the front-end structure of a modern streaming-style media catalog website.

Pages required:

/
/movie
/series
/anime
/search
/media/[slug]

Shared components:

Navbar
SearchBox
FilterBar
MediaCard
MediaGrid
Pagination
PlayerShell

## Current Active Task

### Backend Queue Closed

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator aligns the work package to `docs/backend-spec.md`, `docs/roadmap.md`, and `docs/backend-delivery-workflow.md`
2. Planner and Reviewer handoffs remain the authoritative record for the completed readiness sweep
3. Coordinator records final queue status, any explicitly out-of-scope residuals, and the next program must be opened as a new tracked task
4. User review remains authoritative for future planning direction

Scope for this round:
- Continue the fixed backend auto queue from `docs/backend-delivery-workflow.md` on top of the accepted backend foundation
- Record the now-completed backend queue status after the accepted `Final Backend Readiness Sweep`
- Current active item: `Backend Queue Closed`
- The tracked backend queue is complete through accepted Workstream 4 / Slice 8 and the accepted final readiness sweep
- Current refinement status: Workstreams 1, 2, and 3 are accepted, Workstream 4 / Slices 1-8 are accepted, and the backend is accepted as operator-ready under the tracked scope
- Owned surfaces:
  - Planner: completed readiness-sweep handoff docs
  - Reviewer: completed readiness acceptance docs
  - Coordinator: queue closure, versioning, and tracked readiness decision
- No new runtime feature work is active in this closed queue state
- No public route redesign
- No player work
- No broad auth/session product expansion
- No ad hoc roadmap expansion during the sweep

Acceptance criteria:
- The final readiness sweep is accepted and recorded in tracked docs
- The backend is marked operator-ready under the tracked scope
- Residual items are explicitly recorded as out of scope rather than left in an implicit queue

Current user-requested improvement to implement:
1. Continue using the fixed backend workflow without ad hoc phases
2. Push the remaining backend multi-round tasks into `task.md`
3. Continue auto-executing the tracked backend work packages until a real blocker occurs
4. Keep the queue fixed and advance directly to the next uncompleted work package after each accepted slice
5. Keep documenting accepted backend milestones, testing coverage, and version bumps as the queue advances
6. The backend queue is now complete under the tracked scope
7. Any future backend work must be opened as a new tracked program rather than silent continuation

Current baseline:
- Round A monolith foundations are present under `lib/server/` and `lib/db/`
- Round B provider adapter contracts and staging persistence now exist and have passed reviewer acceptance
- Round C normalization and dedup persistence now exist and have passed reviewer acceptance
- Round D review/publish workflow and admin review surface now exist and have passed reviewer acceptance
- Round E canonical catalog serving is accepted, so public browse/search/detail/watch/list now resolve through published backend read boundaries
- Round F source management and healthcheck is accepted, so source inventory, health state, repair queue flow, and health-aware watch-source resolution are now in place
- Workstream 1 / Slice 1 is accepted, so the repo now has a concrete `jszyapi` adapter and executable real-provider ingest path with offline-safe tests
- Workstream 1 / Slice 2 is accepted, so scheduled refresh/probe jobs and durable job state are now in place
- Workstream 2 / Slice 1 is accepted, so operator-facing source inventory and repair queue UI are now in place
- Workstream 2 / Slice 2 is accepted, so operator-facing published catalog listing and inspection UI are now in place
- Workstream 3 is accepted, so moderation/report handling and manual title/source submission workflows are now in place
- Workstream 4 / Slice 1 is accepted, so structured job execution telemetry and failure visibility are now in place for ingest, scheduled refresh, and source-probe flows
- Workstream 4 / Slice 2 is accepted, so existing admin/operator backend surfaces now require explicit server-side access control with correct `401`/`403` behavior
- Workstream 4 / Slice 3 is accepted, so operators now have a privileged queue-failure monitoring surface with deterministic UI coverage
- Workstream 4 / Slice 4 is accepted, so published-catalog runtime now has deterministic migration preflight and fail-closed rollout guardrails
- Workstream 4 / Slice 5 is accepted, so the repo now has one deterministic backend golden path across ingest staging, publish, published read, and watch/health contract validation
- Workstream 1 / Slice 3 is accepted, so the provider pipeline now supports durable unattended worker execution for queued provider jobs
- Workstream 1 / Slice 4 is accepted, so provider page jobs now have restart-safe continuation and durable checkpoint recovery
- Workstream 1 / Slice 5 is accepted, so queued provider page jobs now have bounded retry semantics, provider-aware throttling, and durable backoff timing
- Workstream 1 / Slice 6 is accepted, so one provider lane now supports deterministic backfill and incremental sync orchestration
- Workstream 1 / Slice 7 is accepted, so one provider lane now supports unattended repeatable sync scheduling with durable next-run state and restart-safe restoration
- The Workstream 1 exit gate is now met for one provider lane
- Workstream 2 / Slice 3 is accepted, so audited reorder / replace / unpublish lifecycle mutations are now exposed through deterministic rendered admin coverage and the Workstream 2 operator control-plane exit gate is met
- Workstream 3 / Slice 2 is accepted, so future publish scheduling, schedule clearing/rescheduling, and published visibility hide/restore now flow through bounded review/catalog/admin workflows and the Workstream 3 governance exit gate is met
- Workstream 4 / Slice 6 is accepted, so provider/job failures now surface explicit severity, alert-ready state, and escalation reason through bounded ingest/health/admin contracts with deterministic `/admin/queue-failures` coverage
- Workstream 4 / Slice 7 is accepted, so recovery readiness now exposes explicit bounded `ready` / `degraded` / `blocked` state, backup freshness, and restore rehearsal visibility through deterministic `/admin/recovery-readiness` coverage
- Workstream 4 / Slice 8 is accepted, so final launch validation now exposes explicit backend launch state, per-domain validation outcomes, and blocking/degraded reasons on `/admin/final-launch-validation` with deterministic backend and rendered coverage
- The final backend readiness sweep is accepted, so the backend queue is now closed and the backend is documented as operator-ready under the tracked scope

## Remaining Backend Auto Queue

The fixed backend auto queue has been exhausted. New backend work must be opened as a new tracked task instead of being treated as silent continuation.

Current queue status:

1. Tracked backend queue: closed
2. Follow-on work: not active in this task file until a new tracked program is opened

This closed queue state now requires:

1. preserving the tracked acceptance record
2. opening any future work as a new tracked task instead of extending the closed queue implicitly
