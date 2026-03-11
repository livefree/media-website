# Planner Handoff: Workstream 4 / Slice 5 - End-to-End Backend Validation Path

## Task Summary

This slice adds one deterministic cross-boundary validation path through the accepted backend foundation. The goal is to prove that one fixture-driven media item can move through the critical backend chain without relying on a broad browser E2E platform or ad hoc manual verification.

Required execution order for this slice:

1. `planner`
2. `media-ingest`
3. `data-catalog`
4. `reviewer`

`search-filter`, `detail-player`, and `ui-shell` do not participate in this slice unless Reviewer finds a blocker that cannot be resolved through backend contract-level validation, which should be treated as an exception rather than planned scope.

## In-Scope Validation Chain

This slice covers one narrow golden path:

1. provider fixture intake
2. ingest staging persistence
3. normalization and candidate shaping
4. review or publish gate transition
5. published catalog read
6. watch-facing contract check
7. health-aware source contract check

This is intentionally one deterministic chain, not a matrix of all content types or all failure modes.

## Watch And Healthcheck Representation

Watch and healthcheck should be represented by contract-level checks, not browser playback automation.

That means:

- watch is validated by the published read or watch-resolution contract returning the expected title, episode or source identity, and selected source metadata
- healthcheck is validated by the accepted source-health contract influencing the published or watch-facing source result as expected

This slice does not require browser playback, player interaction, or public UI assertions.

## Implementation Scope

In scope:

- one offline-safe validation harness driven by deterministic fixtures
- one cross-boundary golden path that touches ingest, normalize, review/publish, published read, and watch/health-facing backend contracts
- fixture and assertion structure that makes boundary-to-boundary regression visible
- narrow contract assertions at each step rather than broad UI assertions
- build and test validation for the harness and affected backend modules

Expected outcomes:

- the repo has one deterministic backend validation path that proves the accepted pipeline still connects end to end
- regressions at boundary handoffs become easier to detect before launch
- watch and health-aware source resolution are represented through stable server contracts instead of manual spot-checking

## Explicit Non-Goals

Out of scope for this slice:

- broad full-stack browser E2E suite
- public UI redesign
- player or watch UI behavior changes
- search UI validation
- new product behavior
- multi-provider matrix validation
- broad failure-mode matrix expansion
- new admin surface work
- ops platform expansion

## Ownership Split

### Media Ingest

Primary owner for the ingest-side part of the golden path.

Allowed scope:

- `lib/server/provider/`
- `lib/server/ingest/`
- fixture-driven ingest entry points
- deterministic orchestration support for the single validation chain

Responsibilities:

- provide the fixture-driven provider and ingest entry path for the validation chain
- ensure the validation harness can drive staging persistence deterministically
- keep the slice limited to one golden path and offline-safe fixtures

Must not:

- broaden into provider redesign
- expand into a general E2E platform
- introduce browser or public-route concerns

### Data Catalog

Owns the downstream cross-boundary assertions after ingest staging.

Allowed scope:

- `lib/db/`
- `lib/server/catalog/`
- `lib/server/health/`
- `lib/server/admin/` only if needed for review or publish transition helpers
- narrow shared validation helpers for normalization, review/publish, published read, and watch/health contracts

Responsibilities:

- define the normalized, review/publish, published-read, watch-facing, and health-aware contract assertions for the single validation chain
- ensure the validation path proves the published backend foundation connects cleanly after ingest
- keep watch and health represented through server contracts, not UI behavior

Must not:

- broaden into public route redesign
- add unrelated admin or UI scope
- turn the slice into a large contract-test matrix

### Reviewer

Owns acceptance validation for scope discipline, offline-safe determinism, build health, and whether the chosen chain really crosses the intended backend boundaries.

## Test Requirements

Mandatory:

- offline-safe fixture-backed validation for the entire in-scope chain
- deterministic assertions at each boundary in the chain
- tests proving published catalog read and watch or health contract checks reflect the expected post-publish state
- build and test path remain healthy

Tests should prove:

- one fixture item can move from provider fixture to staged ingest output
- staged output can move through normalization and review or publish transition
- published catalog reads return the expected canonical record
- watch-facing contract resolution returns the expected published or health-aware source result
- the validation path remains offline-safe and deterministic

## Reviewer Acceptance Checklist

This slice is accepted only if all of the following are true:

- the repo now has one deterministic backend validation path that crosses the intended accepted boundaries
- the chosen chain is offline-safe, fixture-driven, and reproducible
- watch and healthcheck are represented through contract-level validation rather than browser UI automation
- no broad browser E2E platform, public UI redesign, or new product behavior was introduced
- build and test validation are present and passing

## Implementation Checklist Per Owning Agent

### Media Ingest Checklist

- choose one stable provider fixture for the golden path
- wire one deterministic ingest entry path for that fixture
- keep the ingest portion offline-safe and reproducible
- add deterministic assertions for staged output handoff into downstream steps

### Data Catalog Checklist

- define the downstream assertions for normalize, review or publish, published read, watch contract, and health-aware source contract
- keep the path limited to one golden-path item and one deterministic expected outcome
- represent watch and health through backend contract checks only
- add deterministic tests for the downstream chain and boundary expectations

### Reviewer Checklist

- verify the required execution order was respected
- verify the chosen validation path really crosses ingest, normalize, review/publish, published read, and watch or health-facing contracts
- verify the slice stayed offline-safe and deterministic
- verify no browser E2E platform, public UI redesign, or unrelated product behavior was introduced
- verify build and test validation are present
- fail the slice if the chain stops short of the intended backend boundaries or if it broadens into a larger platform-testing effort
