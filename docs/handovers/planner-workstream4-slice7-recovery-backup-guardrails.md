# Planner Handoff: Workstream 4 / Slice 7 - Recovery Readiness And Backup-Restore Guardrails

## Task Summary

`Workstream 4 / Slice 6` is now accepted. The next fixed backend queue item is `Workstream 4 / Slice 7`: converting recovery readiness, backup freshness, and restore rehearsal state into a bounded operator workflow. The goal of this slice is not to build a full infrastructure backup platform. The goal is to add the smallest tracked backend/admin model that lets operators answer:

1. whether recovery artifacts exist and are fresh enough
2. whether the last restore rehearsal succeeded
3. whether the platform is currently in a recovery-ready state without direct database inspection

Required execution order:

1. `planner`
2. `data-catalog`
3. `ui-shell` only if the accepted backend result requires visible operator/admin presentation changes
4. `reviewer`

`media-ingest`, `search-filter`, and `detail-player` are out of scope unless a later blocker shows that an existing durable job boundary must be reused for this slice. The default assumption for Slice 7 is that this is primarily a backend/admin-readiness slice.

## Strict Scope

In scope:

- bounded persistence for backup snapshots, backup freshness, restore rehearsals, and recovery-readiness summaries
- explicit recovery-readiness state visible through accepted backend/admin boundaries
- narrow operator/admin visibility for backup freshness and last restore result if backend support alone is not sufficient
- deterministic backend tests and deterministic UI coverage if new operator-visible states are introduced

Out of scope:

- full backup infrastructure orchestration
- cloud-storage or vendor-specific backup integrations
- broad metrics/monitoring redesign
- auth/RBAC redesign
- public-route behavior changes
- provider adapter or ingest-lane redesign
- final launch-validation work that belongs to Slice 8

## Slice Intent

This slice should close the gap between:

1. migration safety and rollout guardrails that are already accepted
2. explicit operator confidence that the system can be recovered after failure

The target model is:

- the system tracks the most recent backup artifact or backup checkpoint summary
- the system tracks the most recent restore rehearsal outcome
- the operator can see whether recovery readiness is healthy, degraded, or blocked
- the operator can see why recovery readiness is not green
- all of this stays inside bounded backend/admin contracts rather than ad hoc docs or raw database inspection

The slice should prefer an explicit, finite readiness model over flexible policy engines.

## Ownership Boundaries

### Data Catalog

Owns:

- schema/repository/service support for backup metadata, restore rehearsal metadata, and recovery-readiness summaries
- `lib/server/admin/`, `lib/server/health/`, `lib/server/catalog/`, or adjacent backend boundaries required to expose a bounded recovery-readiness contract
- deterministic backend tests proving the readiness model is stable, auditable, and independent of direct DB inspection

Must not:

- redesign public-serving logic
- introduce provider-business-logic changes
- turn this slice into a generic infra automation platform

### UI Shell

Owns only if needed:

- the minimal operator-facing admin surface changes required to show recovery-readiness state, backup freshness, or restore-rehearsal outcome
- deterministic UI coverage for any newly rendered readiness indicators or operator actions

Must not:

- redesign the broader admin suite
- introduce public-facing UI changes
- move recovery rules into route-local helpers

### Reviewer

Owns:

- validating that the slice remains a bounded recovery-readiness step rather than a generic backup product
- confirming the readiness model is explicit, test-backed, and kept inside accepted backend/admin boundaries
- confirming that any UI additions are deterministic and mirror backend state instead of inventing route-local policy

## Proposed Implementation Breakdown

### 1. Recovery-readiness model

Add the minimum durable state needed to distinguish:

- recovery ready
- recovery degraded
- recovery blocked

The state should be derived from explicit bounded signals such as:

- backup freshness age
- backup artifact presence or absence
- last restore rehearsal result
- restore rehearsal age
- missing or stale recovery prerequisites

Keep the readiness model explicit and finite.

### 2. Backup and restore backend boundary

Expose one narrow backend/admin contract that allows operators to read:

- the most recent backup freshness summary
- the most recent restore rehearsal result
- the current recovery-readiness state
- the specific reason recovery readiness is degraded or blocked

Optional bounded operator actions are allowed only if they stay narrow, such as:

- recording a restore rehearsal outcome
- acknowledging a stale-readiness warning

Do not build a full backup scheduler or storage-management system in this slice.

### 3. Operator surface

Prefer extending an existing admin safety or operations surface instead of creating a broad new admin area.

If UI changes are required, the operator page should show:

- current recovery-readiness state
- backup freshness or last successful backup time
- last restore rehearsal result and when it happened
- clear reason text when the system is degraded or blocked

If the backend result is fully consumable through an already accepted admin page without new rendering, `ui-shell` may be skipped.

## Testing Scope

### Required backend coverage

`data-catalog` should add deterministic tests for:

1. classifying recovery-ready vs degraded vs blocked states
2. preserving backup freshness and restore-rehearsal context in the read model
3. ensuring stale backup and failed restore rehearsals do not collapse into the same operator reason unless explicitly intended
4. exposing the bounded readiness state through admin/backend read contracts
5. any optional bounded operator mutation staying auditable if introduced

### Required UI coverage

Only if new operator-visible controls or indicators are added:

1. visible readiness state on the rendered admin surface
2. visible backup freshness / restore result context
3. visible degraded/blocked reason text
4. visible result-state wiring for any new bounded operator action

Helper-only tests are insufficient if new rendered controls or indicators are introduced.

### Required integration check

At minimum:

- targeted backend test command(s)
- targeted UI render/helper test command(s) if UI changes are added
- `npm run build`

## Reviewer Checklist

Reviewer should confirm:

1. this slice adds bounded recovery-readiness visibility, not a full backup platform
2. readiness state and failure reasons are explicit and deterministic
3. operators can distinguish healthy, degraded, and blocked recovery posture without direct DB inspection
4. new logic stays inside accepted backend/admin boundaries
5. any UI additions are deterministic and aligned with the backend state
6. no unrelated provider, player, public-route, or auth scope was reopened

## Acceptance Gate

This slice is accepted only if all of the following are true:

- recovery readiness is now represented through tracked backend/admin boundaries with an explicit finite state
- operators can distinguish fresh/healthy recovery posture from degraded or blocked recovery posture without direct DB inspection
- backup freshness and restore-rehearsal context are visible through bounded backend/admin contracts
- deterministic backend tests cover the new recovery-readiness behavior
- deterministic UI coverage exists if new rendered operator indicators or actions are introduced
- `npm run build` passes
- the implementation stays inside the narrow hardening scope defined above
