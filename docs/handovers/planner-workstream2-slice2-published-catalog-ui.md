# Planner Handoff: Workstream 2 / Slice 2 - Published Catalog Management UI

## Task Summary

This slice establishes the first narrow operator-facing published catalog management surface on top of the accepted review/publish and published-catalog backend foundation. The goal is to let operators inspect published catalog records and perform only the minimal management actions required for workflow completeness, without redesigning public routes or broadening into a larger admin suite.

Required execution order:

1. `planner`
2. `data-catalog`
3. `ui-shell`
4. `reviewer`

## Implementation Scope

This slice is limited to published catalog management.

In scope:

- admin published catalog listing backed by published backend reads
- admin published catalog inspection/detail backed by published backend reads
- minimal operator-facing published catalog actions only if needed for workflow completeness
- narrow backend support for operator catalog listing, inspection, and limited management
- deterministic tests for backend support and admin UI wiring

Expected operator outcomes:

- inspect a published catalog list without database access
- open a published title and inspect its published metadata and structure
- inspect published episodic structure where applicable
- inspect enough published-source summary state to manage the record safely if that state is already exposed through accepted backend boundaries
- perform only the smallest set of operator actions needed to keep published-catalog workflow usable

## Explicit Non-Goals

Out of scope for this slice:

- public route redesign
- player or watch-page changes
- auth or session expansion
- auto-publish behavior
- broad moderation workflow expansion
- source inventory or repair queue redesign
- provider ingest, staging, normalization, or review-queue redesign
- full admin-suite expansion beyond published catalog management
- route-local or seed-helper management logic

## Ownership Split

### Data Catalog

Owns backend support required for operator published catalog management inside accepted backend boundaries.

Allowed scope:

- published catalog admin read models and service functions
- published catalog listing and inspection queries
- minimal backend action handlers if a concrete management action is required for workflow completeness
- schema changes only if narrowly required to support published-catalog operator reads or constrained actions
- backend modules under existing `lib/db/`, `lib/server/catalog/`, `lib/server/review/`, and `lib/server/admin/` boundaries

Must not:

- redesign public browse/search/detail/watch contracts
- leak staging, rejected, or review-only state into operator published-catalog contracts unless clearly admin-only and necessary for safe published inspection
- broaden into unrelated moderation or admin workflows

### UI Shell

Owns the operator-facing admin UI for published catalog management.

Allowed scope:

- admin published catalog listing surface
- admin published catalog detail/inspection surface
- minimal action controls that call backend-supported operator actions
- shared admin presentation components and styles needed for this slice only

Must not:

- move business logic into route-local UI code
- bypass backend service functions with ad hoc data shaping
- redesign public-facing surfaces

### Reviewer

Owns acceptance validation for backend-backed operator workflow correctness, scope discipline, and test coverage.

## Backend/UI Boundary Rule

Published catalog management must be served through accepted backend boundaries. This slice must not reconstruct management state from withdrawn seed helpers, public runtime helpers, or route-local logic. Admin UI should consume operator-facing contracts from backend service functions only.

## Test Requirements

Mandatory:

- offline-safe backend tests for any new published-catalog admin read or action support
- deterministic UI-level verification for admin published-catalog list and inspection surfaces
- test coverage for any minimal operator action added in this slice
- build and test path remain healthy

Tests should prove:

- published catalog listing reads published state only
- published catalog inspection reads published state only
- any included management action stays within published/admin scope
- no staging, review, or rejected state leaks into operator published-catalog surfaces unless intentionally exposed as admin-only published-context metadata

## Acceptance Checklist

This slice is accepted only if all of the following are true:

- operators can open an admin published-catalog surface and inspect published records without direct database access
- published catalog list and detail surfaces are backed by backend catalog/admin boundaries rather than seed helpers or route-local management logic
- any included operator action is minimal, clearly scoped, and backend-backed
- the slice does not redesign public browse/search/detail/watch behavior
- no player work, auth expansion, or broad admin-suite drift is introduced
- tests covering the backend and admin UI slice are present and runnable without live external dependencies

## Implementation Checklist Per Owning Agent

### Data Catalog Checklist

- define or refine the operator-facing published-catalog list contract
- define or refine the operator-facing published-catalog inspection contract
- add only the backend service functions needed for admin listing/detail behavior
- add a minimal backend action path only if a concrete workflow gap blocks operator completeness
- keep published-management reads and actions isolated from staging, normalization, and review-pipeline internals
- add deterministic tests for all backend support introduced in this slice

### UI Shell Checklist

- build the admin published-catalog listing surface
- build the admin published-catalog inspection/detail surface
- render only the published-management fields supported by backend contracts
- wire minimal operator actions only where backend support exists and the slice explicitly requires them
- keep the surface clearly administrative and separate from public runtime presentation
- add or update deterministic UI coverage as appropriate for the chosen test surface

### Reviewer Checklist

- verify the required execution order was respected
- verify operator-facing published-catalog list and inspection surfaces are present and backend-backed
- verify any included management action is minimal and constrained to this slice
- verify no public-route redesign, player work, auth expansion, or broader admin drift was introduced
- verify tests are present for both backend support and admin UI behavior
- fail the slice if published-catalog management still depends on seed helpers, withdrawn runtime helpers, or route-local management logic
