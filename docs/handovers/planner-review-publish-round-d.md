# Planner Handoff: Review And Publish Workflow Round D

## Task summary

Round D establishes the first explicit operator gate between pre-review candidate state and canonical catalog state.

This round should add two connected but distinct backend workflows:

- a review queue for normalized candidates and match/duplicate signals
- a publish gate that is the only allowed path for writing canonical catalog state in this round

Round D builds on the accepted prior rounds:

- Round B: provider adapters and staging persistence
- Round C: normalized candidates and dedup/match suggestions

Round D is where operator-facing control begins, but it is **not** yet where the public site rewires to the backend.

## Execution order

1. `planner`
- publish this handoff

2. `data-catalog`
- implement review-queue state, review decisions, publish service boundaries, canonical-write guardrails, and audit persistence

3. `ui-shell`
- implement any required operator/admin review surface within owned UI files only

4. `reviewer`
- validate review/publish gating, canonical-write discipline, operator/public separation, and non-goal discipline before merge

## In scope

- explicit review-queue state
- explicit review decisions
  - approve
  - reject
  - merge
  - replace
  - unpublish when required by the round design
- publish service boundaries
- canonical catalog writes through publish boundaries only
- review/publish audit records
- minimal operator/admin review surface if needed to exercise the workflow

## Explicit non-goals

- no public browse rewiring
- no public search rewiring
- no public detail/watch rewiring
- no player redesign
- no direct provider adapter redesign
- no source health workflows yet
- no end-user-facing public catalog restoration

## Review queue scope

The review queue exists to surface pre-review candidate state to operators in a controlled workflow.

Round D review queue responsibilities:

- hold normalized candidates that are awaiting operator action
- expose linked staging provenance
- expose match/duplicate suggestions from Round C
- expose enough metadata and source-fragment summary for an operator to decide next action
- represent review status explicitly

The review queue should support these states or equivalent concepts:

- pending review
- in review
- approved for publish
- rejected
- merged into existing canonical target
- superseded or replaced

The review queue should not:

- serve public browse/search/watch reads
- silently mutate canonical catalog state just because a candidate exists
- skip provenance back to staging and provider records

## Publish scope

Publish in Round D means:

- an explicit service boundary that converts approved review state into canonical catalog writes
- the only supported path for creating or updating canonical catalog records in this round

Publish should be able to handle:

- create-new canonical title from approved candidate
- merge candidate into an existing canonical title when explicitly approved
- attach normalized season/episode/source candidate data to canonical catalog state only through publish logic
- reject without canonical writes

Publish should also create audit evidence:

- who performed the action
- what candidate was acted on
- what canonical target was created or changed
- when the action occurred
- what action type occurred

Publish should not:

- be embedded inside normalization logic
- be embedded inside route-local shortcuts
- be triggered directly by public-site requests

## What can write canonical catalog state in Round D

Allowed canonical-write path in this round:

- review/publish service boundaries owned by `data-catalog`
- optionally invoked by operator/admin UI actions, but only through those service boundaries

Allowed canonical-write actions:

- create or update canonical catalog records from an explicit approved review decision
- record publish/unpublish audit outcomes
- record merge/replace outcomes tied to review decisions

Not allowed to write canonical catalog state in this round:

- staging ingest flows
- adapter contracts
- normalization/dedup orchestration
- route-local admin shortcuts
- public browse/search/detail/watch routes
- UI components directly

This rule should be visible in both code structure and reviewer acceptance.

## Ownership split

## Data Catalog owns

Round D `data-catalog` should own:

- `prisma/`
- `lib/db/`
- `lib/server/review/`
- `lib/server/catalog/` only where canonical publish service boundaries must touch catalog models
- related shared backend contracts required for review/publish persistence and service calls

Round D responsibilities for `data-catalog`:

- extend schema for review queue, review decisions, publish state, and audit records
- implement repository boundaries for:
  - review queue reads/writes
  - review decisions
  - publish actions
  - audit records
- implement service boundaries that are the only allowed canonical-write path
- preserve the separation between pre-review candidate state and published canonical state

`data-catalog` must **not**:

- rewire public browse/search/watch to consume published backend state yet
- bury canonical writes inside normalization or staging code
- make UI files the source of publish business rules

## UI Shell owns

Round D `ui-shell` should own:

- `app/`
- `components/`
- `styles/`

But only for operator/admin review surfaces that the handoff requires.

Round D responsibilities for `ui-shell`:

- provide a clearly non-public operator/admin review interface if needed
- render queue items, candidate details, review actions, and publish action affordances
- keep operator UI separate from public site routes and public layout assumptions

`ui-shell` must **not**:

- own review/publish business rules
- write canonical catalog state directly
- bypass review/publish service boundaries
- mix operator controls into public browse/search/detail/watch surfaces

## Shared contract rule

If logic determines whether a candidate can be approved, rejected, merged, or published, it belongs with `data-catalog`.

If UI renders queue items, candidate metadata, action buttons, or operator workflow shells, it belongs with `ui-shell`.

If a boundary is ambiguous, prefer:

- `data-catalog` for state, decisions, and canonical writes
- `ui-shell` for operator-facing presentation only

## Recommended review/publish persistence concepts

Round D does not require final table names, but it should leave explicit persistence for:

### ReviewQueueEntry

Represents one candidate awaiting or undergoing operator action.

Useful fields:

- normalized candidate ref
- current review status
- assigned reviewer if used
- queued at
- started/reviewed at
- latest decision summary

### ReviewDecision

Represents an explicit operator decision.

Useful fields:

- queue entry ref
- decision type
  - approve
  - reject
  - merge
  - replace
  - unpublish if applicable
- actor identity
- rationale / notes
- target canonical record if merge/replace applies
- created at

### PublishOperation

Represents the backend operation that writes canonical state.

Useful fields:

- review decision ref
- operation type
- canonical target refs
- status
- started/completed timestamps
- failure summary if needed

### PublishAuditRecord

Represents durable audit evidence for review and publish actions.

Useful fields:

- actor
- action type
- candidate ref
- canonical target ref
- diff summary or action summary
- timestamp

These records should be explicit and queryable.

## Data Catalog implementation checklist

### 1. Add review-queue persistence

- extend schema for queue entries and decision state
- make queue status explicit and queryable
- keep queue records linked back to normalized candidates and staging provenance

### 2. Add publish service boundaries

- create service boundaries that are the only supported canonical-write path in this round
- keep them separate from route handlers and UI code

### 3. Add canonical-write guardrails

- ensure staging and normalization layers cannot write canonical catalog state directly
- ensure review decisions must exist before publish operations can run

### 4. Add audit persistence

- persist who did what, to which candidate, and what canonical target changed
- make audit state survive beyond transient logs

### 5. Keep public runtime untouched

- do not rewire public browse/search/detail/watch routes yet
- keep the runtime catalog withdrawn

## UI Shell implementation checklist

### 1. Keep operator UI separated from public routes

- if operator review UI is introduced, keep it clearly under admin/operator scope
- do not blend review controls into public-facing routes

### 2. Render review information only

- show queue items, candidate detail summaries, duplicate/match context, and action controls
- route actions through backend service boundaries rather than embedding business logic in components

### 3. Do not own publish rules

- UI may expose action affordances
- UI must not decide what writes canonical state or what constitutes a valid publish transition

## Reviewer acceptance checklist

## 1. Review queue is explicit

- confirm the repo has explicit state for review queue entries and review decisions
- confirm queue items link back to normalized candidate state rather than skipping straight to canonical catalog records

## 2. Publish boundary is explicit

- confirm canonical catalog writes introduced in this round occur only through review/publish service boundaries
- confirm there is no route-local, UI-local, or normalization-layer shortcut into canonical writes

## 3. Canonical-write discipline is preserved

- confirm staging and normalization layers remain pre-review only
- confirm review approval is a visible prerequisite for publish operations

## 4. Operator/public separation is preserved

- if operator/admin UI exists, confirm it is clearly separate from public site routes
- confirm no public browse/search/detail/watch rewiring occurred in this round

## 5. Ownership discipline is preserved

- confirm `data-catalog` owns schema, repositories, review/publish state, and publish services
- confirm `ui-shell` owns only operator/admin presentation surfaces
- confirm no spill into player/detail/search runtime ownership

## 6. Auditability exists

- confirm publish and review actions create durable audit state
- confirm audit data is not only implied by logs or commit history

## 7. Buildability and module-boundary sanity

- confirm the project remains buildable if build tooling is available
- confirm Round D fits into the existing module map without reorganizing prior accepted boundaries

## Acceptance gate

Round D passes only if:

- review queue and review-decision state are explicit
- publish is an explicit backend boundary
- canonical catalog writes happen only through review/publish service boundaries
- operator/admin UI, if added, remains clearly separate from public routes
- no public browse/search/watch rewiring happens yet
- the project remains buildable

Round D fails if:

- canonical writes occur from staging, normalization, route-local, or UI-local shortcuts
- review queue state is implicit or transient only
- operator controls are mixed into public routes
- the round quietly rewires public browse/search/watch before Round E
