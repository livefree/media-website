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

### Workstream 4 / Slice 8: Final Launch Validation

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator aligns the work package to `docs/backend-spec.md`, `docs/roadmap.md`, and `docs/backend-delivery-workflow.md`
2. Planner defines the implementation breakdown, ownership boundaries, testing scope, and acceptance checklist for the active hardening slice
3. Media Ingest implements final validation instrumentation or runtime support when the slice touches ingest execution or validation paths
4. Data Catalog implements the backend support required by the chosen final validation slice
5. UI Shell implements operator-facing admin surface changes only if the slice requires new bounded launch-validation or readiness presentation
6. Reviewer validates operator workflow correctness, scope discipline, and test/build coverage before merge
7. User review remains authoritative for planning direction; rejected backend structure must not be represented as accepted

Scope for this round:
- Continue the fixed backend auto queue from `docs/backend-delivery-workflow.md` on top of the accepted backend foundation
- Implement one narrow hardening slice at a time rather than broad platform-wide changes in a single pass
- Current active slice: `Workstream 4 / Slice 8: Final Launch Validation`
- This slice is mapped to the next remaining Workstream 4 hardening queue item in `docs/backend-delivery-workflow.md` and `docs/roadmap.md`
- Current refinement status: Workstreams 1, 2, and 3 are accepted, and Workstream 4 / Slices 1-7 are now accepted; the next open backend queue item is final launch validation
- Owned surfaces:
  - Planner: architecture, roadmap alignment, round-specific handoff docs
  - Media Ingest: final validation execution, readiness evidence, or bounded probe support required by this slice
  - Data Catalog: `lib/db/`, `lib/server/health/`, `lib/server/admin/`, and schema/support required for bounded launch-validation and operator-readiness evidence in this slice
  - UI Shell: admin/operator surfaces required to expose accepted launch-validation or final-readiness state in this slice
  - Reviewer: acceptance and findings docs only
- No public route redesign
- No player work
- No broad auth/session product expansion
- No broad admin suite expansion beyond the minimal final-validation actions or visibility required by this slice

Acceptance criteria:
- The chosen hardening slice yields deterministic final launch-validation evidence for the accepted backend scope without reopening completed workstreams
- The slice remains narrow, testable, and grounded in tracked backend docs rather than ad hoc changes
- New support remains inside accepted backend boundaries and does not leak into public route logic
- The implementation includes the necessary tests and remains buildable after this slice
- No public route redesign, player work, or broader out-of-scope platform drift is introduced
- Final validation and operator-readiness evidence is expressed through tracked ingest/backend/admin boundaries rather than ad hoc scripts or manual DB inspection alone

Current user-requested improvement to implement:
1. Continue using the fixed backend workflow without ad hoc phases
2. Push the remaining backend multi-round tasks into `task.md`
3. Continue auto-executing the tracked backend work packages until a real blocker occurs
4. Keep the queue fixed and advance directly to the next uncompleted work package after each accepted slice
5. Keep documenting accepted backend milestones, testing coverage, and version bumps as the queue advances
6. Continue through the remaining operator-control, governance, and hardening slices until the backend reaches an operator-ready state or a real blocker occurs
7. Continue the fixed backend queue into the remaining Workstream 4 hardening slices without reopening completed Workstream 1-3 scopes

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
- The repo still lacks the final launch-validation slice and the closing operator-ready readiness sweep needed to close Workstream 4

## Remaining Backend Auto Queue

The Coordinator should continue through the remaining backend work packages in tracked order, without introducing ad hoc phases, until the backend reaches an operator-ready state or a real blocker occurs.

Current queued path after the active slice:

1. Active next slice for the Workstream 4 exit gate:
   - `Workstream 4 / Slice 8: Final Launch Validation`
2. Final backend readiness sweep:
   - reconcile accepted slices against `docs/backend-spec.md`
   - confirm operator-ready exit gate and launch-readiness gaps in tracked docs before any post-backend program starts

Each queued item still requires:

1. task alignment in this file
2. planner handoff
3. specialist implementation in owned scope
4. reviewer acceptance
5. coordinator merge, versioning if warranted, and push
