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

### Workstream 1: Make Provider Intake Operational

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator aligns the work package to `docs/backend-spec.md`, `docs/roadmap.md`, and `docs/backend-delivery-workflow.md`
2. Planner defines the implementation breakdown, ownership boundaries, testing scope, and acceptance checklist for the active provider-operationalization slice
3. Media Ingest implements the provider/runtime support required by the chosen slice
4. Data Catalog participates only if the planned slice requires durable backend support outside existing ingest boundaries
5. Reviewer validates operator workflow correctness, scope discipline, and test/build coverage before merge
6. User review remains authoritative for planning direction; rejected backend structure must not be represented as accepted

Scope for this round:
- Continue the remaining provider-operationalization work packages from `docs/backend-delivery-workflow.md` on top of the accepted backend foundation
- Implement one narrow provider-operationalization slice at a time rather than broad platform-wide changes in a single pass
- Current operationalization slice: `Workstream 1 / Slice 3: Durable Worker Execution`
- This slice is mapped to the remaining `Redis-backed or equivalent operational worker execution` deliverable under Workstream 1 in `docs/backend-delivery-workflow.md`
- Current refinement status: Workstream 4 / Slice 5 is accepted and closed; this slice moves the provider pipeline closer to sustained unattended operation
- Owned surfaces:
  - Planner: architecture, roadmap alignment, round-specific handoff docs
  - Media Ingest: `lib/server/provider/`, `lib/server/ingest/`, job execution, worker/runtime support for the selected operationalization slice
  - Data Catalog: only where the selected slice requires durable state or backend support outside existing ingest boundaries
  - UI Shell: not expected unless a later planner handoff explicitly requires a minimal operator surface
  - Reviewer: acceptance and findings docs only
- No public route redesign
- No player work
- No broad auth/session product expansion
- No broad admin suite expansion unless the planned slice explicitly requires it

Acceptance criteria:
- The chosen operationalization slice measurably improves unattended backend provider execution
- The slice remains narrow, testable, and grounded in tracked backend docs rather than ad hoc changes
- New support remains inside accepted backend boundaries and does not leak into public route logic
- The implementation includes the necessary tests and remains buildable after this slice
- No public route redesign, player work, or broader out-of-scope platform drift is introduced

Current user-requested improvement to implement:
1. Continue using the fixed backend workflow without ad hoc phases
2. Push the remaining backend multi-round tasks into `task.md`
3. Continue auto-executing the tracked backend work packages until a real blocker occurs

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
- The repo still lacks provider operationalization exit-gate slices, later control-plane/governance completion slices, and final launch-readiness work

## Remaining Backend Auto Queue

The Coordinator should continue through the remaining backend work packages in tracked order, without introducing ad hoc phases, until the backend reaches an operator-ready state or a real blocker occurs.

Current queued path after the active slice:

1. `Workstream 4 / Slice 5: End-to-End Backend Validation Path`
2. Remaining provider operationalization slices needed to reach the Workstream 1 exit gate:
   - sustained worker execution
   - resumability, throttling, retry, and checkpoint hardening
3. Remaining operator-control slices needed to reach the Workstream 2 exit gate:
   - operator mutation flows for source/catalog lifecycle where still missing
4. Remaining governance slices needed to reach the Workstream 3 exit gate:
   - publish scheduling and visibility control
5. Remaining hardening slices needed to reach the Workstream 4 exit gate:
   - provider failure visibility and alert-ready signaling
   - recovery readiness, backup/restore guardrails, and final launch validation

Each queued item still requires:

1. task alignment in this file
2. planner handoff
3. specialist implementation in owned scope
4. reviewer acceptance
5. coordinator merge, versioning if warranted, and push
