# Planner Handoff: Workstream 4 / Slice 8 - Final Launch Validation

## Task Summary

`Workstream 4 / Slice 7` is now accepted. The next fixed backend queue item is `Workstream 4 / Slice 8`: producing deterministic final launch-validation evidence for the accepted backend scope so operators can confirm the system is launchable without relying on ad hoc scripts or direct database inspection.

This slice is not the final backend readiness sweep. The readiness sweep remains a follow-up documentation and acceptance pass after this slice is implemented and reviewed. Slice 8 should provide the bounded runtime evidence that the readiness sweep will reconcile.

Exact agent execution order:

1. `planner`
2. `media-ingest`
3. `data-catalog`
4. `ui-shell` only if the accepted backend result requires new operator-visible launch-validation presentation
5. `reviewer`

`search-filter` and `detail-player` are out of scope. `ui-shell` is optional, not required by default.

## Strict Scope

In scope:

- one bounded final launch-validation model that summarizes whether the accepted backend chain is ready, degraded, or blocked for launch
- deterministic validation evidence sourced from tracked ingest, catalog, health, admin, and hardening boundaries already accepted in Workstreams 1-4
- explicit failure or gap reasons that identify which accepted backend area is preventing launch validation from passing
- narrow backend or admin read contracts that let operators inspect final launch-validation evidence without direct DB inspection
- deterministic backend tests and deterministic rendered UI coverage only if new operator-visible launch-validation presentation is introduced

Out of scope:

- the final backend readiness sweep and roadmap reconciliation itself
- new public-route behavior or public-route redesign
- player or detail runtime work
- broad admin-suite expansion beyond a bounded launch-validation view if one is needed
- new provider-lane product expansion beyond the accepted operational lane
- external alerting, deployment orchestration, or infrastructure automation
- broad auth, RBAC, or moderation redesign

## Slice Intent

This slice should close the gap between:

1. accepted point hardening slices that prove individual controls exist
2. one bounded operator-facing launch-validation result that proves those controls connect into a launchable backend posture

The target model is:

- final launch validation is expressed through an explicit finite state such as `ready`, `degraded`, or `blocked`
- the state is derived from accepted backend evidence instead of route-local heuristics or manual DB inspection
- operators can see which required launch domains passed and which failed
- the slice stays narrow by validating accepted scope, not by creating a new generic observability or release-management platform

Slice 8 should reuse existing accepted evidence where possible. It should not duplicate the Workstream 4 / Slice 5 golden-path harness, but it may consume that deterministic validation output or equivalent bounded backend signals as one input to the final launch-validation state.

## Non-Goals

This slice must not:

- reopen completed Workstreams 1-3 or Workstream 4 / Slices 1-7 for redesign
- introduce a second broad E2E framework
- require direct database inspection as part of normal operator validation
- become a deployment checklist product, release dashboard suite, or infrastructure control plane
- replace the separate final readiness sweep that follows this slice

## Ownership Boundaries

### Media Ingest

Owns:

- ingest-side launch-validation inputs tied to the accepted provider lane, scheduled execution lane, queue telemetry, and recovery or probe evidence already established in Workstream 1 and Workstream 4
- any bounded execution or evidence-shaping needed so final launch validation can read deterministic ingest-side status without inspecting raw tables directly
- offline-safe ingest or execution tests proving the launch-validation input remains deterministic

Must not:

- broaden into additional provider coverage
- redesign worker architecture
- add unrelated operator UI

### Data Catalog

Owns:

- the canonical final launch-validation read model, repository support, admin or health service contracts, and bounded reason classification needed to summarize launch state
- any schema or persistence support required to represent launch-validation evidence through tracked backend boundaries
- deterministic backend tests proving the final launch-validation state remains explicit, auditable, and connected to accepted backend evidence

Must not:

- redesign public catalog serving
- add unrelated governance or moderation features
- turn this slice into a generic release-management platform

### UI Shell

Status: optional

Owns only if needed:

- the minimal operator-facing admin presentation required to show final launch-validation state and its blocked or degraded reasons
- deterministic rendered UI coverage for any newly introduced launch-validation page, panel, or visible state

Must not:

- redesign the broader admin suite
- add public-facing UI
- move launch-validation rules into the route layer

### Reviewer

Owns:

- validating that Slice 8 stays a bounded launch-validation step rather than a broad readiness-program rewrite
- confirming the launch-validation state is deterministic, sourced from accepted backend evidence, and usable without direct DB inspection
- confirming any UI additions are thin presentation over backend truth

## Required Validation Domains

The final launch-validation model should cover, at minimum, whether the accepted backend scope has valid evidence for:

1. provider ingest execution and durable scheduled operation for the accepted provider lane
2. review or publish flow and canonical published catalog serving
3. health-aware source state and operator-visible failure or recovery guardrails
4. privileged admin access boundaries for existing operator surfaces
5. migration-safety and recovery-readiness guardrails already accepted in earlier hardening slices

The model does not need to invent new product behavior for these domains. It needs to classify whether each domain has acceptable launch evidence and surface explicit reasons when a domain is degraded or blocked.

## Proposed Implementation Breakdown

### 1. Launch-validation state model

Add the minimum bounded model needed to classify final launch state into:

- `ready`
- `degraded`
- `blocked`

The state should be derived from explicit domain results, not freeform notes. Reasons should also be explicit and finite, for example:

- ingest lane not validated
- catalog publish path not validated
- health or failure readiness degraded
- admin access validation missing
- migration or recovery guardrail failing

The exact reason names may differ, but they must remain finite and operator-readable.

### 2. Launch-validation evidence aggregation

Expose one narrow backend boundary that allows operators and reviewer acceptance to read:

- the current final launch-validation state
- per-domain pass, degraded, or blocked results
- the primary blocking or degraded reasons
- enough supporting context to confirm the result came from accepted tracked backend evidence

Prefer aggregation over duplication:

- consume accepted backend service outputs where available
- reuse existing deterministic test or classification boundaries where possible
- avoid creating route-local logic that reinterprets raw database state independently

### 3. Operator visibility

If existing accepted admin surfaces are not sufficient to expose the final launch-validation result, add one bounded operator-facing presentation surface.

If UI is added, it should show:

- current launch-validation state
- per-domain validation outcome
- explicit blocked or degraded reasons
- the supporting accepted evidence at a summary level

If the backend result is already consumable through accepted operator surfaces and tests, `ui-shell` may be skipped.

## Required Tests

The following command set is required for acceptance:

```bash
npm run test:provider-ingest
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/catalog/e2e-validation.test.ts lib/server/admin/service.test.ts lib/db/final-launch-validation.test.ts
npm run build
```

If UI Shell is used, this additional rendered coverage command is also required:

```bash
node --test components/admin/AdminLaunchValidationPage.render.test.ts
```

If implementation reuses an existing render surface rather than a new page, the UI command should target the exact affected rendered test file instead, but rendered coverage is still mandatory for any new visible launch-validation state.

## Acceptance Checklist

This slice is accepted only if all of the following are true:

1. final launch validation is represented through tracked ingest, backend, health, and admin boundaries rather than manual DB inspection or ad hoc scripts alone
2. the launch-validation result is explicit and finite, with bounded `ready`, `degraded`, or `blocked` behavior
3. operators can identify which required launch domain is failing and why
4. the implementation reuses accepted backend evidence instead of reopening completed slices for redesign
5. deterministic backend coverage exists for launch-validation classification and read-contract behavior
6. `npm run test:provider-ingest` passes
7. `lib/server/catalog/e2e-validation.test.ts`, `lib/server/admin/service.test.ts`, and `lib/db/final-launch-validation.test.ts` pass through the required Node test command
8. deterministic rendered UI coverage exists if new operator-visible launch-validation presentation is introduced
9. `npm run build` passes
10. no public-route redesign, player work, broad admin expansion, or readiness-sweep documentation work was folded into this slice

## Reviewer Checklist

Reviewer should confirm:

1. the exact agent execution order was respected
2. `ui-shell` was skipped unless a new bounded operator presentation was genuinely required
3. final launch validation is grounded in accepted backend evidence, not hand-written route logic or manual operator interpretation
4. per-domain results and primary reasons are explicit and deterministic
5. the slice remains narrower than the final backend readiness sweep and does not try to replace that follow-up step
6. the required test commands and `npm run build` passed

## Downstream Agent Instructions

For `media-ingest`:

- expose only the ingest-side evidence needed for final launch validation
- do not broaden provider scope or worker scope
- keep all validation inputs deterministic and offline-safe

For `data-catalog`:

- own the final launch-validation contract and bounded state model
- keep classification rules finite and auditable
- prefer existing backend services and repositories over new parallel validation logic

For `ui-shell` if invoked:

- add only minimal operator presentation for launch-validation state
- keep logic in backend contracts, not in route-local helpers

For `reviewer`:

- fail the slice if it broadens into a release-management platform, a new E2E framework, or an undocumented readiness sweep
