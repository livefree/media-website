# Planner Handoff: Workstream 3 / Slice 2 - Publish Scheduling And Visibility Control

## Task Summary

`Workstream 2` is now closed. The next fixed backend queue item is the remaining governance slice for `Workstream 3`: bounded publish scheduling and visibility control. The goal of this slice is not to redesign the review/publish system. The goal is to add the smallest operator-safe workflow that lets editors control *when* approved content becomes publicly visible and *whether* published content stays publicly visible, without reopening direct database edits or public-route logic.

Required execution order:

1. `planner`
2. `data-catalog`
3. `ui-shell`
4. `reviewer`

`media-ingest`, `search-filter`, and `detail-player` are out of scope unless this slice exposes an already-accepted backend contract gap that cannot be solved inside the governance/admin boundary. If that happens, return it to Coordinator as a blocker instead of widening the slice.

## Strict Scope

In scope:

- bounded publish scheduling for approved review items or publishable catalog entries
- explicit visibility control states for operator-managed catalog exposure
- audit-friendly operator actions for schedule, unschedule, publish-now, hide, and restore actions
- admin/operator surfaces required to inspect and apply those bounded scheduling and visibility actions
- deterministic backend and UI coverage proving the new governance controls exist and stay inside the accepted admin/review/catalog boundaries

Out of scope:

- public browse/search/watch runtime redesign
- automatic publish policy engines
- notification systems
- broader moderation redesign
- auth/RBAC redesign
- provider ingest changes
- source-health or player behavior changes
- bulk workflow tooling

## Slice Intent

This slice should close the remaining governance gap from `Workstream 3` by introducing one narrow model:

1. a published title can be marked with a visibility state that is not equivalent to deletion
2. a publish action can be scheduled for a future timestamp rather than only executed immediately
3. operators can cancel or override that schedule through tracked admin actions
4. public-serving boundaries continue to expose only currently visible published content

The slice should prefer simple, explicit states over flexible-but-unbounded policy systems.

## Ownership Boundaries

### Data Catalog

Owns:

- schema evolution for bounded publish-schedule and visibility state
- repository changes for persisted schedule / visibility actions
- `lib/server/review/`, `lib/server/catalog/`, and `lib/server/admin/` service boundaries needed for this slice
- backend tests proving schedule and visibility rules stay inside accepted publish/admin boundaries

Must not:

- rework public route composition
- redesign unrelated moderation flows
- expand into generalized workflow engines

### UI Shell

Owns:

- the minimal admin/review/catalog UI required to expose publish scheduling and visibility control
- deterministic UI coverage for the new controls and visible result-state wiring
- narrow admin-only presentation updates required by this slice

Must not:

- redesign the broader admin suite
- introduce public-facing UI changes
- move business rules out of the accepted backend contracts

### Reviewer

Owns:

- validating that scheduling and visibility behavior is bounded, test-backed, and auditable
- confirming that public-route logic was not reopened
- confirming operator surfaces are deterministic and aligned to the handoff

## Proposed Implementation Breakdown

### 1. Data model and service boundary

Add the minimum persisted state needed for:

- `visibility`
  - for example: `visible`, `hidden`, `scheduled`
- `publishAt`
  - nullable timestamp for scheduled publication
- audited operator actions
  - schedule
  - clear schedule
  - publish now
  - hide
  - restore visibility

The persisted shape should stay close to the existing review/publish model rather than creating a second publishing subsystem.

### 2. Admin/operator action boundary

Expose one narrow backend/admin contract that allows:

- reading current visibility and publish schedule state
- scheduling a publish time
- removing a pending publish time
- forcing immediate publication
- hiding an already-published item
- restoring a hidden published item

The contract should remain operator-facing and auditable. Avoid route-local mutations or direct DB wiring in admin pages.

### 3. Admin surface

Expose the controls on the smallest existing operator surface that already owns publication state. Preferred targets:

- the admin review detail surface when the item is still in review/publish flow
- the admin catalog detail surface when the item is already published

UI should show:

- current visibility state
- scheduled publish timestamp when present
- the operator actions that are valid for the current state
- visible success/error/flash result-state wiring for those actions

Avoid creating a new standalone admin area if existing review/catalog detail pages can host the controls cleanly.

## Testing Scope

### Required backend coverage

Data Catalog should add deterministic tests for:

1. scheduling a future publish timestamp
2. preventing schedule state from bypassing explicit publish/admin boundaries
3. clearing a pending schedule
4. hiding a published item without deleting it
5. restoring a hidden published item
6. preserving auditability for schedule and visibility actions
7. ensuring public-serving reads continue to exclude not-yet-visible content

### Required UI coverage

UI Shell should add deterministic coverage for:

1. visible scheduling controls on the chosen admin detail surface
2. visible current visibility/schedule state on the chosen admin detail surface
3. visible publish-now / hide / restore controls where applicable
4. visible flash/error/result-state wiring for the new actions

Helper-only tests are not sufficient if new rendered controls are introduced.

### Required integration check

At minimum:

- targeted test command(s) for the new backend/UI coverage
- `npm run build`

## Reviewer Checklist

Reviewer should confirm:

1. this slice adds bounded publish scheduling, not a broad workflow engine
2. visibility control is explicit and auditable
3. operators no longer need direct DB edits for these governance actions
4. public-route logic remains closed behind published/visible backend reads
5. new tests cover the behavior that the UI actually exposes
6. no unrelated provider, player, or public-route scope was reopened

## Acceptance Gate

This slice is accepted only if all of the following are true:

- operators can schedule publication for a future time through tracked backend/admin boundaries
- operators can clear or override a scheduled publication through tracked backend/admin boundaries
- operators can hide and restore published visibility without direct DB edits
- public-serving logic continues to exclude not-yet-visible or hidden content
- the slice includes deterministic backend tests and deterministic UI coverage where controls are rendered
- `npm run build` passes
- the implementation stays inside the narrow governance scope defined above
