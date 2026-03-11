# Planner Handoff: Workstream 2 / Slice 3 - Source And Catalog Lifecycle Mutations

## Task Summary

This slice completes the remaining narrow operator mutation flows needed for the Workstream 2 exit gate. The goal is to let operators perform the minimum published catalog and source lifecycle changes that still require direct database edits today, especially replace, reorder, and unpublish actions, while keeping the slice admin-only, backend-backed, and tightly scoped.

Required execution order:

1. `planner`
2. `data-catalog`
3. `ui-shell`
4. `reviewer`

## Scope

This slice is limited to narrow lifecycle mutations for already published catalog and source records.

In scope:

- published source reorder actions where ordering affects operator-controlled source preference
- published source replace actions where a broken, degraded, or superseded source must be replaced by another existing or newly designated published source record
- published catalog unpublish actions for titles or other clearly scoped published records where removal from public serving must be operator-controlled
- only the smallest backend-backed admin surface additions needed to inspect and apply those lifecycle mutations
- deterministic tests for backend mutation boundaries and admin UI wiring

Expected operator outcomes:

- reorder published sources without direct DB edits
- replace a published source through a narrow operator workflow rather than ad hoc data patching
- unpublish a published title or equivalent published record through a controlled backend path
- inspect enough lifecycle state to understand what is being reordered, replaced, or unpublished before acting

## Explicit Non-Goals

Out of scope for this slice:

- public route redesign
- player or watch-page changes
- auth or session expansion
- broad admin-suite expansion
- moderation workflow redesign
- review queue redesign
- provider ingest, normalization, or publish pipeline redesign
- source-health platform redesign beyond the mutation hooks required here
- bulk mutation tooling
- generalized content editing beyond replace, reorder, and unpublish

## Ownership

### Data Catalog

Primary backend owner for this slice.

Allowed scope:

- `lib/db/`
- `lib/server/catalog/`
- `lib/server/source/`
- `lib/server/admin/`
- schema support only if narrowly required for lifecycle mutation state or auditability

Responsibilities:

- define the narrow mutation contracts for reorder, replace, and unpublish
- ensure lifecycle mutations execute through accepted backend boundaries rather than route-local logic
- preserve public-serving safety by making sure mutation effects flow through published catalog and source boundaries only
- add only the minimal mutation-state and audit support needed for safe operator workflows

Must not:

- redesign public browse/search/detail/watch contracts
- broaden into full content editing or moderation tooling
- reopen review/publish or provider-ingest architecture

### UI Shell

Owns the operator-facing admin surface changes needed to expose the accepted lifecycle mutations.

Allowed scope:

- minimal controls and mutation affordances in existing admin source or catalog surfaces
- narrow admin confirmation flows or state presentation needed to support lifecycle actions
- deterministic UI coverage for the new lifecycle mutation entry points and result states

Must not:

- redesign the admin suite
- introduce route-local business rules for lifecycle mutations
- broaden into unrelated operator workflows

### Reviewer

Owns acceptance validation for workflow correctness, scope discipline, backend/UI test coverage, and build health.

## Backend/UI Boundary Rule

Lifecycle mutations must be enforced server-side through accepted admin, catalog, and source boundaries. UI may expose action entry points, confirmations, and result states, but it must not implement mutation rules, reorder semantics, replacement semantics, or unpublish effects in route-local logic.

## Mutation-Safety Rule

This slice should prefer narrow, auditable, explicit lifecycle actions over flexible editing. Each action should clearly state:

- what published record is being mutated
- what new lifecycle state or ordering is intended
- what published-serving effect will result

The slice should not introduce loosely scoped "edit anything" controls.

## Test Requirements

Mandatory:

- offline-safe backend tests for reorder mutation behavior
- offline-safe backend tests for replace mutation behavior
- offline-safe backend tests for unpublish mutation behavior
- deterministic UI-level verification for the admin entry points that trigger these mutations
- build and test path remain healthy

Tests should prove:

- reorder changes the intended published ordering only
- replace changes the intended published source relationship only
- unpublish removes the intended published record from public-serving state through backend boundaries
- mutation paths remain admin-only and do not leak into public route logic
- UI is wired to real backend mutation contracts rather than mock-only state

## Acceptance Checklist

This slice is accepted only if all of the following are true:

- operators can reorder published sources through a real backend-backed admin workflow
- operators can replace a published source through a real backend-backed admin workflow
- operators can unpublish a published title or equivalent published record through a real backend-backed admin workflow
- lifecycle mutation surfaces are narrow and admin-only
- no public route redesign, player work, auth expansion, or broad admin-suite drift is introduced
- tests for backend mutation behavior and UI wiring are present and passing

## Implementation Checklist Per Owning Agent

### Data Catalog Checklist

- define the reorder contract for published sources
- define the replace contract for published sources
- define the unpublish contract for published catalog records in scope
- ensure lifecycle mutations remain auditable and bounded
- ensure public-serving state changes flow through accepted published backend boundaries only
- add deterministic tests for each lifecycle mutation path introduced by this slice

### UI Shell Checklist

- expose reorder controls only where backend support exists
- expose replace controls only where backend support exists
- expose unpublish controls only where backend support exists
- keep controls within existing admin source and catalog surfaces wherever possible
- render clear narrow confirmation and result states without redesigning the admin suite
- add deterministic UI coverage for mutation entry points and state changes

### Reviewer Checklist

- verify the required execution order was respected
- verify reorder, replace, and unpublish flows are real backend-backed admin workflows
- verify lifecycle mutations remain narrow and auditable
- verify no public-route changes, player work, auth expansion, or broad admin drift were introduced
- verify backend mutation tests and UI coverage are present
- fail the slice if lifecycle mutations still require direct DB edits or if the implementation broadens into a general editing suite
