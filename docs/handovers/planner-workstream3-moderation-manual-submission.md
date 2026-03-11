# Planner Handoff: Workstream 3 - Moderation And Manual Submission Workflows

## Task Summary

This workstream adds the first narrow operator-facing moderation and manual submission workflows on top of the accepted review/publish, published-catalog, and source-management backend foundation. The goal is to let operators process broken-source or closely related reports and create manual title or source submissions through product-backed workflows instead of direct database edits.

Required execution order:

1. `planner`
2. `data-catalog`
3. `ui-shell`
4. `reviewer`

## Implementation Scope

This slice is intentionally narrow and limited to moderation/report handling plus manual submission intake.

In scope:

- admin moderation queue or equivalent report-handling surface
- report detail or inspection flow for broken-source and closely related operator reports
- narrow operator actions needed to triage a report through a backend-backed workflow
- admin manual submission flow for title intake and source intake
- inspection of submitted manual entries and their current workflow status
- backend support for moderation and manual submission state, validation, and auditability
- deterministic tests for backend workflow support and operator UI wiring

Expected operator outcomes:

- inspect submitted broken-source or closely related reports without direct database access
- triage a report through a narrow set of backend-backed moderation actions
- submit a manual title candidate through an operator-facing form or equivalent admin surface
- submit a manual source candidate through an operator-facing form or equivalent admin surface
- inspect the state of submitted moderation items and manual submissions

## Explicit Non-Goals

Out of scope for this slice:

- public route redesign
- player or watch-page changes
- auth or session expansion
- broad admin-suite expansion beyond moderation and manual submission
- auto-publish behavior
- broad moderation policy tooling
- provider-ingest redesign
- source inventory or repair queue redesign
- full editorial scheduling or visibility-control suite
- route-local or seed-helper workflow logic

## Ownership Split

### Data Catalog

Owns backend support required for moderation and manual submission workflows inside accepted backend boundaries.

Allowed scope:

- schema changes only if narrowly required for moderation reports, manual submissions, or their workflow state
- backend repositories, contracts, and service functions under `lib/db/`, `lib/server/review/`, `lib/server/source/`, and `lib/server/admin/`
- moderation queue and moderation detail read models
- narrow moderation action handlers for triage, dismissal, escalation, resolution, or repair-linkage where required for workflow completeness
- manual title submission and manual source submission create/read flows
- audit-friendly persistence for operator actions in this slice

Must not:

- redesign public browse/search/detail/watch contracts
- bypass review/publish or published-catalog boundaries with direct public writes
- expand into a full moderation platform or broad admin-control-plane redesign
- couple manual submission directly to automatic publish

### UI Shell

Owns operator-facing admin surfaces for moderation and manual submission.

Allowed scope:

- moderation list or queue page/section
- moderation detail or inspection page/section
- manual title submission surface
- manual source submission surface
- minimal list/detail/status presentation for submitted items
- only the narrow controls required to invoke backend-backed moderation or submission actions

Must not:

- implement moderation business rules in route-local UI code
- bypass backend service functions
- redesign public-facing routes or player surfaces

### Reviewer

Owns acceptance validation for workflow correctness, scope discipline, test coverage, and build health.

## Backend/UI Boundary Rule

Moderation and manual submission must run through accepted backend modules. UI must consume backend service contracts for report queues, report details, submission creation, and submission state. This slice must not reintroduce ad hoc route-local workflow logic or rely on withdrawn seed/runtime helpers.

## Test Requirements

Mandatory:

- offline-safe backend tests for any new moderation-report persistence, moderation actions, and manual submission workflows
- deterministic UI-level verification for moderation surfaces and manual submission surfaces
- validation coverage for rejected or invalid manual submission inputs
- audit/state-transition coverage for any moderation action introduced in this slice
- build and test path remain healthy

Tests should prove:

- reports can be listed and inspected through backend-backed moderation contracts
- manual title/source submissions can be created and later inspected through backend-backed contracts
- workflow state changes are narrow, auditable, and remain inside moderation/manual-submission scope
- moderation and manual submission do not leak directly into public runtime serving

## Acceptance Checklist

This workstream is accepted only if all of the following are true:

- broken-source or closely related reports can be processed through an operator-facing workflow without direct database edits
- manual title and manual source submission workflows exist in operator-facing form without bypassing backend boundaries
- moderation and manual submission surfaces are backed by backend review/source/admin boundaries rather than seed helpers or ad hoc route-local logic
- actions are narrow, auditable, and clearly scoped to this workflow slice
- no public route redesign, player work, auth expansion, or broader admin/control-plane drift is introduced
- the implementation includes the necessary tests and remains buildable after this slice

## Implementation Checklist Per Owning Agent

### Data Catalog Checklist

- define the moderation report contract for list and detail surfaces
- define the allowed report statuses and narrow triage action contract for this slice
- implement only the backend workflow state needed for report handling completeness
- define the manual title submission contract and persistence path
- define the manual source submission contract and persistence path
- ensure manual submissions enter reviewable/operator-managed state rather than published runtime state
- add audit-friendly persistence for moderation and manual submission actions where needed
- add deterministic tests for all new backend support introduced in this slice

### UI Shell Checklist

- build the moderation queue or list surface
- build the moderation detail or inspection surface
- expose only the narrow moderation controls backed by backend contracts
- build the manual title submission surface
- build the manual source submission surface
- show submission state clearly enough for operator follow-up
- keep the admin surfaces clearly separate from public runtime presentation
- add or update deterministic UI coverage as appropriate for the chosen test surface

### Reviewer Checklist

- verify the required execution order was respected
- verify moderation and manual submission surfaces exist and are backend-backed
- verify broken-source or related reports can be triaged through product workflow rather than direct DB edits
- verify manual title and manual source submissions do not bypass backend workflow boundaries
- verify no public-route redesign, player work, auth expansion, or broad admin drift was introduced
- verify tests are present for both backend workflow support and admin UI behavior
- fail the slice if moderation or manual submission still depends on route-local logic, seed helpers, or direct-catalog writes outside accepted backend boundaries
