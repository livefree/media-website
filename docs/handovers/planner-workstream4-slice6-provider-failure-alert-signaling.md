# Planner Handoff: Workstream 4 / Slice 6 - Provider Failure Visibility And Alert-Ready Signaling

## Task Summary

`Workstreams 1-3` are now closed. The next fixed backend queue item is the first remaining hardening slice in `Workstream 4`: converting provider/job failure visibility from a useful operator page into an alert-ready operational workflow. The goal of this slice is not to build a full alerting platform. The goal is to add the smallest bounded failure-severity and signaling model that lets operators distinguish routine retries from actionable degradation, while keeping the existing queue-failure monitoring surface inside accepted admin boundaries.

Required execution order:

1. `planner`
2. `media-ingest`
3. `data-catalog`
4. `ui-shell` only if operator-visible alert state or escalation presentation must change
5. `reviewer`

`search-filter` and `detail-player` are out of scope. `ui-shell` should be skipped unless the backend handoff requires visible operator-state changes beyond the already accepted queue-failure page.

## Strict Scope

In scope:

- bounded provider/job failure severity modeling
- alert-ready escalation rules for repeated or terminal failures
- durable operator-visible signaling for failure state that now requires attention
- narrow operator acknowledgment state if needed to avoid repeat blind spots
- deterministic backend tests and, if UI changes are introduced, deterministic UI coverage for the new operator-visible alert state

Out of scope:

- external pager/email/slack integrations
- broad monitoring/metrics stack redesign
- new public-route behavior
- auth or RBAC redesign
- provider adapter redesign
- repair workflow redesign
- launch-validation or backup/restore work that belongs to later hardening slices

## Slice Intent

This slice should close the gap between:

1. raw queue-failure visibility that already exists for operators
2. a bounded, actionable signal that identifies failures requiring human intervention

The target model is:

- retrying or transient failures remain visible but not escalated
- repeated, terminal, or aging failures can move into an alert-ready state
- operators can see why a failure crossed that threshold
- the system keeps this logic inside ingest/health/admin boundaries rather than route-local heuristics

The slice should prefer explicit severity and escalation rules over flexible-but-unbounded policy engines.

## Ownership Boundaries

### Media Ingest

Owns:

- provider/job failure shaping needed to classify queue failures into durable severity/escalation inputs
- ingest-side threshold or state transitions tied to provider execution outcomes
- offline-safe ingest/job tests proving the new failure states are emitted deterministically

Must not:

- redesign admin surfaces
- build generalized alert delivery systems
- reopen unrelated provider execution work

### Data Catalog

Owns:

- persistence and repository support for alert-ready failure visibility
- `lib/server/health/` and `lib/server/admin/` service contracts needed to expose the new state
- backend tests proving operator-visible failure escalation stays bounded and auditable

Must not:

- redesign public-serving logic
- expand into broader observability platform work
- reopen unrelated moderation or catalog-governance scope

### UI Shell

Owns only if needed:

- the minimal operator-facing queue-failure/admin surface updates required to show the new alert-ready state
- deterministic UI coverage for any newly rendered severity/escalation indicators or acknowledgment controls

Must not:

- redesign the broader admin suite
- introduce public-facing UI changes
- move business rules into the route layer

### Reviewer

Owns:

- validating that the slice remains a bounded hardening step rather than a monitoring-platform rewrite
- confirming the new failure signaling is actionable, test-backed, and kept inside accepted ingest/health/admin boundaries
- confirming that any UI additions are deterministic and reflect the backend model rather than route-local inference

## Proposed Implementation Breakdown

### 1. Failure severity model

Add the minimum durable state needed to distinguish:

- transient retrying failure
- degraded attention-needed failure
- terminal/operator-action-required failure

The rules should be derived from already accepted ingest telemetry such as:

- retry exhaustion
- repeated failure count
- elapsed age since first/last failure
- mismatch or probe failure severity

Keep the severity model explicit and finite.

### 2. Alert-ready signaling boundary

Expose one narrow backend/admin contract that allows operators to:

- read the current failure severity and why it escalated
- identify whether a failure is merely retrying or now requires intervention
- see the specific provider/job/source context needed to act
- optionally acknowledge or clear the alert-ready state only if that can be done without reopening repair workflow scope

Avoid creating a separate alerting subsystem.

### 3. Operator surface

Prefer extending the existing queue-failure operator surface instead of creating a new admin area.

If UI changes are required, the operator page should show:

- current severity or alert state
- clear escalation reason
- enough context to connect the alert to a provider/job/source
- visible result-state wiring for any new operator action introduced by this slice

If the backend result is fully consumable through the existing accepted UI, `ui-shell` may be skipped and reviewer can accept on backend/test coverage alone.

## Testing Scope

### Required backend coverage

`media-ingest` and `data-catalog` should add deterministic tests for:

1. classifying transient vs alert-ready failures
2. preserving provider/job/source context on escalated failures
3. keeping repeated retries from silently looking equivalent to terminal failures
4. exposing alert-ready state through health/admin read contracts
5. any acknowledgment/reset path staying bounded and auditable if introduced

### Required UI coverage

Only if new operator-visible controls or indicators are added:

1. visible severity / alert state on the rendered queue-failure surface
2. visible escalation reason and operator context
3. visible result-state wiring for any new operator action

Helper-only tests are insufficient if new rendered controls or indicators are introduced.

### Required integration check

At minimum:

- targeted backend test command(s)
- targeted UI render/helper test command(s) if UI changes are added
- `npm run build`

## Reviewer Checklist

Reviewer should confirm:

1. this slice adds bounded alert-ready failure visibility, not a monitoring-platform rewrite
2. failure severity/escalation is explicit and deterministic
3. operators can distinguish transient retry noise from actionable provider/job failure
4. new logic stays inside ingest/health/admin boundaries
5. any UI additions are deterministic and aligned with the backend state
6. no unrelated provider, player, public-route, or auth scope was reopened

## Acceptance Gate

This slice is accepted only if all of the following are true:

- provider/job failures can now be classified into an operator-actionable alert-ready state through tracked ingest/backend/admin boundaries
- operators can distinguish retrying noise from actionable failure without direct DB inspection
- escalation reason and operator context are visible through bounded backend/admin contracts
- deterministic backend tests cover the new failure-severity and alert-ready signaling behavior
- deterministic UI coverage exists if new rendered operator indicators or actions are introduced
- `npm run build` passes
- the implementation stays inside the narrow hardening scope defined above
