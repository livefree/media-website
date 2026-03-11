# Planner Handoff: Workstream 2 / Slice 1 - Admin Source Inventory And Repair Queue UI

## Task summary

This slice is the first fixed work package under Workstream 2: build the operator control plane.

The goal is narrow:

- expose the existing source inventory backend state to operators
- expose the existing repair queue backend state to operators
- support only the minimum operator-facing source or repair actions needed for workflow completeness

This slice does not try to build the full admin suite. It only turns the accepted backend source/repair state into usable operator surfaces.

## Implementation scope

This slice covers:

- admin source inventory surface
- admin repair queue surface
- operator-facing source or repair actions only if they are strictly needed to make the surfaces operationally meaningful

Allowed minimal operator actions may include:

- filtering source inventory
- filtering repair queue entries
- viewing source state, ordering, and provider labels
- viewing repair status and failure summaries
- narrow actions such as:
  - mark acknowledged
  - mark resolved
  - reorder if already supported by backend boundaries
  - disable/replace routing hooks only if they already exist and are required to make the UI non-read-only in a meaningful way

If an action is not already backed by narrow backend state or a clear backend boundary, do not broaden the slice to invent a larger admin workflow.

## Explicit non-goals

- no public route redesign
- no player work
- no auth/session expansion
- no broad moderation/admin suite
- no review queue redesign
- no manual title creation workflow
- no publish scheduling work
- no broad source-management platform redesign beyond source inventory and repair queue operator visibility

## Ownership split

## Data Catalog owns

This slice is backend-supported by `data-catalog`.

Responsibilities:

- expose backend read boundaries for source inventory and repair queue surfaces
- add only the narrow repository, service, or contract support needed by the operator UI
- add narrowly required mutation support only if a minimal operator action is necessary for slice completeness

Owned surfaces:

- `prisma/` only if narrowly required
- `lib/db/`
- `lib/server/source/`
- `lib/server/health/`
- `lib/server/admin/`
- related shared backend support for operator source and repair workflows

`data-catalog` must **not**:

- broaden into a full admin/control-plane redesign
- redesign public runtime serving
- introduce unrelated review/publish, moderation, or player work

## UI Shell owns

This slice is primarily presented by `ui-shell`.

Responsibilities:

- implement admin source inventory pages/surfaces
- implement admin repair queue pages/surfaces
- render operator filters, tables/cards, status presentation, and narrow actions if required by the slice
- keep the surfaces clearly admin/operator-facing rather than public-facing

Owned surfaces:

- `app/`
- `components/`
- `styles/`

`ui-shell` must **not**:

- define business rules for source/repair state
- bypass backend boundaries with seed helpers or mock-only control flow
- broaden into unrelated admin sections

## Reviewer owns

Reviewer owns:

- findings and acceptance docs only
- validation of operator workflow correctness, scope discipline, and test/build coverage

## Backend/UI boundary rule

For this slice:

- `data-catalog` defines what source inventory and repair queue data/actions are available
- `ui-shell` defines how operators inspect and act on that data

If a rule determines whether a source may be reordered, acknowledged, resolved, disabled, or otherwise changed, it belongs to backend boundaries.

If a screen renders the inventory, filters, queue, and buttons, it belongs to UI Shell.

## Test requirements

Tests are required for this slice.

Expected test scope:

### Data Catalog/backend support tests

- repository/service tests for source inventory query behavior if new boundaries are added
- repository/service tests for repair queue query behavior if new boundaries are added
- mutation tests only for narrowly added operator actions, if such actions are introduced

These tests should be deterministic and not depend on live network.

### UI Shell tests

- component or route-level tests for source inventory rendering
- component or route-level tests for repair queue rendering
- tests for filter behavior or action wiring where added

If the repo does not yet have a UI test harness for these surfaces, this slice should at minimum require build-safe component coverage or route-level integration tests appropriate to the current toolchain.

### Reviewer validation

- reviewer must still validate the operator flow end to end against the implemented surfaces

## Acceptance checklist

### 1. Operators can inspect source inventory

- there is a real admin/operator-facing source inventory surface
- it reads through backend source/admin boundaries rather than seed helpers or ad hoc route-local logic

### 2. Operators can inspect repair queue state

- there is a real admin/operator-facing repair queue surface
- it is connected to durable backend repair state, not static placeholder content

### 3. Minimal workflow completeness exists

- if the slice introduces actions, they are the minimum needed to keep the surfaces operationally meaningful
- actions must be backed by real backend boundaries, not UI-only state tricks

### 4. Scope discipline is preserved

- no public route redesign
- no player work
- no auth/session expansion
- no broad moderation/admin suite expansion

### 5. Tests exist

- backend support changes, if any, are covered by tests
- UI surfaces have appropriate rendering/integration coverage for the current toolchain
- the project remains buildable

## Data Catalog implementation checklist

### 1. Expose source inventory backend reads

- provide or refine admin-facing source inventory query boundaries
- include only the public-safe/operator-safe data needed by the surface

### 2. Expose repair queue backend reads

- provide or refine admin-facing repair queue query boundaries
- expose durable repair state, not transient logs only

### 3. Add only narrow action support if required

- if the UI needs a minimal action for slice completeness, add only that action
- keep action support narrow and clearly bounded

### 4. Avoid broadening scope

- do not turn this into a full operator control-plane redesign
- do not spill into public-serving, player, or moderation redesign

## UI Shell implementation checklist

### 1. Build the admin source inventory surface

- render a clear operator-facing inventory view
- include useful status, ordering, provider/source labels, and filtering as needed

### 2. Build the admin repair queue surface

- render a clear operator-facing repair queue view
- include status, problem summaries, timestamps, and filters as needed

### 3. Keep the experience admin-focused

- surfaces must clearly read as operator/admin tools
- do not reuse public-site layout assumptions if that blurs role boundaries

### 4. Add only narrow actions

- if actions are needed, keep them minimal and backend-backed
- do not expand into a broad admin action matrix

## Reviewer implementation checklist

### 1. Validate real operator surfaces

- confirm source inventory and repair queue surfaces actually exist
- confirm they are not static placeholders

### 2. Validate backend wiring

- confirm surfaces use backend source/admin/health boundaries
- confirm they do not fall back to seed helpers or mock-only route-local state

### 3. Validate scope control

- confirm there is no public route redesign, player work, auth/session expansion, or broad admin-suite drift

### 4. Validate tests/build

- confirm relevant backend/UI coverage exists for the slice
- confirm the project remains buildable

## Acceptance gate

This slice passes only if:

- operators can inspect source inventory through a real admin surface
- operators can inspect repair queue state through a real admin surface
- any added actions are narrowly scoped and backend-backed
- tests exist for the added backend/UI behavior
- no public route redesign, player work, auth/session expansion, or broad admin drift is introduced

This slice fails if:

- the surfaces are only placeholders
- the UI is not wired to real backend state
- the slice expands into a broader admin suite than planned
- actions are implemented as UI-only state with no real backend support
