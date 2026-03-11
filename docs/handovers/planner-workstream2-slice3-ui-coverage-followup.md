# Planner Follow-up: Workstream 2 / Slice 3 - UI Coverage Follow-up

## Task Summary

Reviewer confirmed that reorder, replace, and unpublish are real backend-backed admin workflows, but held acceptance because deterministic UI coverage is still missing for the rendered operator mutation entry points on `/admin/catalog/[publicId]`. This follow-up is strictly limited to UI coverage and narrow result-state wiring for the existing slice.

Required execution order:

1. `planner`
2. `ui-shell`
3. `reviewer`

`data-catalog` does not participate in this follow-up unless Reviewer discovers that the existing accepted backend contract cannot support deterministic UI coverage, which should be treated as a blocker rather than a reason to reopen backend scope.

## Strict Scope

In scope:

- deterministic UI coverage for the rendered reorder, replace, and unpublish entry points on `/admin/catalog/[publicId]`
- deterministic coverage for the narrow result-state wiring already supported by the accepted backend contract
- reuse of existing repo UI test and helper patterns

Out of scope:

- backend contract redesign
- backend mutation redesign
- public route changes
- player changes
- admin redesign
- new lifecycle workflow scope
- new test platform rollout

## Required UI Coverage

The deterministic coverage must prove that the actual rendered operator mutation entry points and result states are wired correctly.

Required cases:

- rendered mutation entry points:
  - `/admin/catalog/[publicId]` renders the reorder entry point when applicable
  - `/admin/catalog/[publicId]` renders the replace entry point when applicable
  - `/admin/catalog/[publicId]` renders the unpublish entry point when applicable
- narrow result-state wiring:
  - the page reflects the accepted mutation result state wiring for reorder actions
  - the page reflects the accepted mutation result state wiring for replace actions
  - the page reflects the accepted mutation result state wiring for unpublish actions
- stable admin rendering:
  - tests stay attached to the current admin detail surface rather than inventing a new layout or broad scenario matrix

Not required in this follow-up:

- re-proving backend mutation correctness already accepted by Reviewer
- broad browser automation
- admin UX redesign

## Ownership

### UI Shell

Owns this follow-up.

Responsibilities:

- add deterministic UI coverage for the actual mutation entry points on `/admin/catalog/[publicId]`
- add deterministic UI coverage for the narrow accepted result-state wiring
- reuse existing repo UI test and helper patterns
- keep any UI changes minimal and limited to testability or stable rendering support if absolutely necessary

### Reviewer

Owns the re-check.

Responsibilities:

- verify that deterministic UI coverage now exists for the rendered mutation entry points
- verify that narrow result-state wiring is covered
- verify that backend scope stayed closed
- verify that no admin redesign or broader workflow drift was introduced

## Reviewer Re-check Scope

Reviewer should re-check only:

- deterministic UI coverage for rendered reorder, replace, and unpublish entry points on `/admin/catalog/[publicId]`
- deterministic UI coverage for the accepted narrow result-state wiring
- no reopening of backend mutation scope
- no unnecessary admin redesign or test-platform expansion

Reviewer should not reopen:

- accepted backend reorder semantics
- accepted backend replace semantics
- accepted backend unpublish semantics
- accepted backend mutation contracts

## Acceptance Gate

This follow-up is accepted only if all of the following are true:

- `/admin/catalog/[publicId]` now has deterministic UI coverage for the rendered reorder / replace / unpublish entry points
- the narrow accepted result-state wiring is covered deterministically
- the coverage uses existing repo test and helper patterns
- the follow-up does not reopen backend scope or introduce public/player/admin redesign drift
