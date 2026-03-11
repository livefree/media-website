# Planner Follow-up: Workstream 4 / Slice 3 - UI Coverage Follow-up

## Task Summary

Reviewer did not accept Workstream 4 / Slice 3 because the privileged `/admin/queue-failures` surface lacks deterministic UI coverage. Backend telemetry, backend read models, backend access control, and backend tests are already considered strong for this slice. This follow-up is strictly limited to adding deterministic UI coverage for the existing privileged page.

Required execution order for this follow-up:

1. `planner`
2. `ui-shell`
3. `reviewer`

`data-catalog` and `media-ingest` do not participate in this follow-up unless a reviewer finds that the UI tests cannot be written against the already accepted backend contract, which should be treated as a blocker rather than a reason to reopen backend scope.

## Strict Scope

In scope:

- deterministic UI coverage for the existing privileged `/admin/queue-failures` surface
- reuse of the repo's existing UI test or route test patterns
- only the minimum test fixtures or test helpers needed to cover the already accepted page behavior

Out of scope:

- backend contract redesign
- backend read-model changes
- public route changes
- player changes
- admin redesign
- new observability features
- new test platform or broad testing framework rollout

## Required UI Coverage

The deterministic UI coverage must prove the existing privileged surface can render the accepted backend contract correctly.

Required cases:

- populated state:
  - `/admin/queue-failures` renders failed and retrying jobs from the existing privileged contract
  - the page shows the structured triage fields already required by Slice 3, including status, job kind, attempt count, failure classification, and relevant time context
- empty state:
  - `/admin/queue-failures` renders a stable empty or no-failures state when the privileged contract returns no actionable jobs
- privileged-page shape:
  - the existing page-level structure renders without requiring ad hoc runtime inspection
  - tests stay anchored to the current accepted surface rather than inventing a new layout

Not required in this follow-up:

- re-proving backend access-control semantics already covered by backend tests
- re-testing telemetry persistence logic
- broad end-to-end browser automation if the repo already has a deterministic component or route-level test pattern that can cover this page

## Ownership

### UI Shell

Owns this follow-up.

Responsibilities:

- add deterministic UI coverage for the existing privileged `/admin/queue-failures` page
- use the repo's existing admin/UI testing pattern rather than introducing a large new test platform
- keep any fixture or mock data aligned to the already accepted backend contract
- avoid changing the page design except for the smallest testability adjustments if absolutely necessary

### Reviewer

Owns the re-check.

Responsibilities:

- verify the new deterministic UI coverage exists and covers the required populated and empty states
- verify the follow-up did not reopen backend scope
- verify no public-route, player, or admin redesign drift was introduced

## Reviewer Re-check Scope

Reviewer should re-check only:

- deterministic UI coverage for `/admin/queue-failures`
- alignment between the test fixtures and the already accepted privileged backend contract
- no reopening of backend telemetry, backend read-model, or backend access-boundary scope
- no unnecessary UI redesign or testing-platform expansion

Reviewer should not reopen:

- accepted backend telemetry semantics
- accepted backend failure-monitoring contract design
- accepted backend access-control behavior

## Acceptance Gate

This follow-up is accepted only if all of the following are true:

- `/admin/queue-failures` now has deterministic UI coverage
- the coverage proves the existing privileged page renders populated and empty states correctly
- the coverage uses existing repo test/tooling patterns
- the follow-up does not reopen backend scope or introduce public/player/admin redesign drift
