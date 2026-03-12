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

### Workstream 2 / Slice 3: Source And Catalog Lifecycle Mutations

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator aligns the work package to `docs/backend-spec.md`, `docs/roadmap.md`, and `docs/backend-delivery-workflow.md`
2. Planner defines the implementation breakdown, ownership boundaries, testing scope, and acceptance checklist for the active operator-control slice
3. Data Catalog implements the backend support required by the chosen operator-control slice
4. UI Shell implements the operator-facing admin surface for the chosen slice
5. Reviewer validates operator workflow correctness, scope discipline, and test/build coverage before merge
6. User review remains authoritative for planning direction; rejected backend structure must not be represented as accepted

Scope for this round:
- Continue the fixed backend auto queue from `docs/backend-delivery-workflow.md` on top of the accepted backend foundation
- Implement one narrow operator-control slice at a time rather than broad platform-wide changes in a single pass
- Current active slice: `Workstream 2 / Slice 3: Source And Catalog Lifecycle Mutations`
- This slice is mapped to the remaining `reorder / replace / unpublish operations` portion of the Workstream 2 exit gate in `docs/backend-delivery-workflow.md` and `docs/roadmap.md`
- Current refinement status: planner, backend, and admin UI implementation are integrated locally for this slice, and reviewer has confirmed the backend-backed reorder / replace / unpublish workflows are real; the only open follow-up is the planner-required deterministic UI coverage for the rendered operator mutation entry points and their narrow result-state wiring on `/admin/catalog/[publicId]`
- Current refinement status: planner, backend, and admin UI implementation are integrated locally for this slice, and reviewer has confirmed the backend-backed reorder / replace / unpublish workflows are real; helper/view-model coverage has been strengthened, but the slice is still blocked on deterministic rendered-surface coverage for the actual reorder / replace / unpublish controls and their visible result-state wiring on `/admin/catalog/[publicId]`
- Owned surfaces:
  - Planner: architecture, roadmap alignment, round-specific handoff docs
  - Data Catalog: `lib/db/`, `lib/server/catalog/`, `lib/server/source/`, `lib/server/admin/`, and schema support required for operator lifecycle actions in this slice
  - UI Shell: admin/operator surfaces required to expose the accepted lifecycle actions in this slice
  - Reviewer: acceptance and findings docs only
- No public route redesign
- No player work
- No broad auth/session product expansion
- No broad admin suite expansion beyond the minimal source/catalog lifecycle actions required by this slice

Acceptance criteria:
- The chosen operator-control slice measurably reduces direct-DB dependence for source/catalog lifecycle management
- The slice remains narrow, testable, and grounded in tracked backend docs rather than ad hoc changes
- New support remains inside accepted backend boundaries and does not leak into public route logic
- The implementation includes the necessary tests and remains buildable after this slice
- No public route redesign, player work, or broader out-of-scope platform drift is introduced
- The rendered operator mutation entry points for reorder / replace / unpublish have deterministic UI-level coverage, not just helper-level coverage

Current user-requested improvement to implement:
1. Continue using the fixed backend workflow without ad hoc phases
2. Push the remaining backend multi-round tasks into `task.md`
3. Continue auto-executing the tracked backend work packages until a real blocker occurs
4. Keep the queue fixed and advance directly to the next uncompleted work package after each accepted slice
5. Keep documenting accepted backend milestones, testing coverage, and version bumps as the queue advances
6. Continue through the remaining operator-control, governance, and hardening slices until the backend reaches an operator-ready state or a real blocker occurs
7. For the current slice, close the reviewer-held gap by adding deterministic UI coverage for the actual admin mutation entry points before treating the slice as accepted
8. The current follow-up must cover the rendered admin detail surface itself, not only helper/view-model functions

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
- The repo still lacks the remaining operator-control completion slices, governance completion slices, and final launch-readiness work

## Remaining Backend Auto Queue

The Coordinator should continue through the remaining backend work packages in tracked order, without introducing ad hoc phases, until the backend reaches an operator-ready state or a real blocker occurs.

Current queued path after the active slice:

1. Active next slice for the Workstream 2 exit gate:
   - `Workstream 2 / Slice 3: Source And Catalog Lifecycle Mutations`
2. Remaining governance slice needed to fully close the Workstream 3 exit gate:
   - `Workstream 3 / Slice 2: Publish Scheduling And Visibility Control`
3. Remaining hardening slices needed to reach the Workstream 4 exit gate:
   - provider failure visibility and alert-ready signaling follow-up where reviewer/planner still identify coverage gaps
   - recovery readiness, backup/restore guardrails, and final launch validation follow-up beyond the accepted migration/e2e slices
4. Final backend readiness sweep:
   - reconcile accepted slices against `docs/backend-spec.md`
   - confirm operator-ready exit gate and launch-readiness gaps in tracked docs before any post-backend program starts

Each queued item still requires:

1. task alignment in this file
2. planner handoff
3. specialist implementation in owned scope
4. reviewer acceptance
5. coordinator merge, versioning if warranted, and push
