# Planner Handoff: Workstream 1 / Slice 2 - Scheduled Refresh And Probe Jobs

## Task summary

This slice is the next fixed work package under Workstream 1: make provider intake operational.

The goal is narrow:

- turn provider refresh and source probe behavior into durable backend jobs
- make those jobs executable through provider/ingest boundaries
- prove the behavior with offline-safe tests

This slice is not the full operations platform. It is the first durable scheduled job layer on top of the accepted real provider execution path.

## Implementation scope

This slice covers:

- scheduled refresh jobs
- scheduled source probe jobs
- durable job state
- executable refresh/probe job paths through provider/ingest boundaries
- offline-safe tests for job execution logic

The slice should prove:

1. refresh jobs can execute against the real-provider path through durable job state
2. source probe jobs can execute through a durable job path rather than direct helper calls
3. job state is explicit, inspectable, and reusable across retries or reruns
4. repair/health workflow remains separated from public route logic

## Explicit non-goals

- no public route redesign
- no admin redesign
- no player work
- no auth/session work
- no auto-publish behavior
- no broad job platform or queue productization beyond this narrow slice
- no new provider family expansion unless strictly required to support refresh/probe behavior for the accepted real-provider path
- no observability overhaul beyond what is needed to keep job state durable and testable

## Ownership split

## Media Ingest owns

This slice is primarily owned by `media-ingest`.

Responsibilities:

- implement scheduled refresh job execution paths in provider/ingest boundaries
- implement scheduled source probe job execution paths in provider/ingest boundaries
- add scheduler-safe or runner-safe entrypoints for those jobs
- keep refresh/probe orchestration inside provider/ingest modules
- add offline-safe tests for job execution logic

Owned surfaces:

- `lib/server/provider/`
- `lib/server/ingest/`
- `scripts/`
- `package.json` only for safe script entries if required

`media-ingest` must **not**:

- move refresh/probe execution into route-local code
- redesign public runtime behavior
- introduce auto-publish behavior
- broaden into admin or player work

## Data Catalog owns only if needed

`data-catalog` participates only if durable job execution reveals a concrete backend support gap.

Allowed narrow participation:

- missing persistence support for durable job state
- missing `lib/db/` repository or shared backend contract needed by refresh/probe job execution
- narrow Prisma/schema support needed to store or query durable job state honestly

`data-catalog` must **not**:

- broaden this slice into general schema cleanup
- redesign source-health models beyond the concrete gap needed for durable jobs
- change published runtime contracts unless a narrowly required support fix is unavoidable

## Reviewer owns

Reviewer owns:

- findings and acceptance docs only
- validation of execution-path correctness, test coverage, durable job state discipline, and ownership boundaries

## Durable job state rule

Refresh and probe workflows in this slice must not exist only as transient helper calls or ephemeral script state.

Durable job state in this slice should cover:

- job type
  - refresh
  - probe
- target scope
  - provider, source group, or bounded source set as appropriate
- lifecycle state
  - queued
  - running
  - succeeded
  - failed
  - retryable if modeled
- timestamps
- attempt count
- bounded execution parameters
- failure summary where applicable

Exact field names can vary, but the job path must be inspectable and rerunnable through explicit state rather than hidden local control flow.

## Mandatory test requirements

Tests are mandatory for this slice.

Required testing approach:

- fixture-based and/or mock-based
- runnable without live network in CI
- deterministic

Minimum required test coverage:

### 1. Refresh job execution

- verify a scheduled refresh job can execute through provider/ingest boundaries
- verify job state transitions for a bounded refresh case
- verify provider interactions are mocked or fixture-backed

### 2. Source probe job execution

- verify a scheduled source probe job can execute through provider/ingest or source-health boundaries as wired by the slice
- verify job state transitions for a bounded probe case

### 3. Durable state behavior

- verify job state is persisted or represented through durable backend boundaries rather than transient in-memory-only flow
- verify rerun or retry-related behavior for at least one failure or retryable case if such semantics exist in the slice

### 4. Failure-path handling

- verify failed refresh or failed probe execution records durable failure state predictably
- keep CI independent of live network failures

### 5. Scope discipline

- verify no public routes, player code, or admin surfaces are required to execute or validate the jobs

Live/manual verification may be added as supplemental validation, but CI acceptance must not depend on live network access.

## Acceptance checklist

### 1. Scheduled refresh job path exists

- a durable refresh job execution path exists through provider/ingest boundaries
- it is not only a direct helper call or an ad hoc script with no durable state

### 2. Scheduled probe job path exists

- a durable source probe execution path exists
- it feeds source-health/repair workflow boundaries without going through public routes

### 3. Durable job state is explicit

- job state is explicit and testable
- job lifecycle is not hidden in transient script-local logic

### 4. Tests are real and offline-safe

- tests exist
- tests run without live network in CI
- fixtures/mocks cover refresh and probe behavior

### 5. Scope discipline is preserved

- no public route redesign
- no admin redesign
- no player work
- no auto-publish behavior
- no route-local job execution shortcuts

### 6. Narrow Data Catalog participation only if required

- if `data-catalog` changed files, the change must be traceable to a concrete durable-job support gap
- if no such gap existed, `data-catalog` should not be used in this slice

### 7. Build and test health

- the project remains buildable
- relevant refresh/probe job tests pass

## Media Ingest implementation checklist

### 1. Add refresh job execution path

- wire refresh execution through accepted provider/ingest boundaries
- ensure the job can run with bounded parameters suitable for tests and controlled execution

### 2. Add probe job execution path

- wire source probe execution through accepted backend boundaries
- keep it separate from route-local source resolution logic

### 3. Use durable job state

- create or use explicit durable job state for both refresh and probe execution
- do not hide scheduling or job progress inside script-local only control flow

### 4. Add mandatory tests

- add fixture/mock-based tests for:
  - refresh job success path
  - probe job success path
  - at least one failure-path state transition

### 5. Keep scope narrow

- do not broaden into queue platform redesign, provider expansion, public runtime changes, or auto-publish logic

## Data Catalog implementation checklist

Only if concrete execution reveals a support gap:

### 1. Add the minimum missing durable-state support

- add only the smallest missing Prisma, repository, or shared-contract support needed for durable refresh/probe job state

### 2. Preserve backend boundary discipline

- keep support narrowly attached to job durability
- do not broaden into unrelated catalog, review, or public-serving work

### 3. Preserve separation from public runtime

- durable job support must not leak into public route or published-catalog serving logic

## Reviewer implementation checklist

### 1. Validate executable job paths

- confirm refresh and probe jobs are real execution paths through provider/ingest boundaries
- confirm they are more than scaffolding or direct helper wrappers

### 2. Validate durable job state

- confirm state is explicit, durable, and inspectable
- confirm the implementation does not rely only on transient script-local state

### 3. Validate offline-safe tests

- confirm tests exist and do not require live network
- confirm fixtures/mocks cover both refresh and probe paths

### 4. Validate scope control

- confirm no public route redesign, admin redesign, player work, or auto-publish behavior was introduced

### 5. Validate ownership discipline

- confirm `media-ingest` owns the main implementation
- confirm `data-catalog` appears only if a concrete durable-job support gap required it

## Acceptance gate

This slice passes only if:

- scheduled refresh jobs exist through provider/ingest boundaries
- scheduled source probe jobs exist through provider/ingest boundaries
- durable job state is explicit and testable
- mandatory offline-safe tests exist and pass
- repair/health workflow remains separated from public runtime routes
- no ad hoc or route-local execution path appears
- no auto-publish behavior is introduced

This slice fails if:

- refresh/probe behavior still exists only as direct helper calls
- tests depend on live network
- durable state is missing or too transient to support real operations
- the slice broadens into unrelated backend or frontend work
