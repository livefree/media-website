# Planner Handoff: Workstream 1 / Slice 1 - Real Provider Execution Path

## Task summary

This slice is the first fixed work package under Workstream 1: make provider intake operational.

The goal is narrow:

- implement one concrete real provider adapter for a target provider named in `backend.md`
- make one ingest path executable through the existing provider/ingest boundaries
- prove that path with runnable tests that do not require live network in CI

This slice is not the full provider program. It is the first non-ad-hoc executable provider path that validates the current backend architecture against a real external shape.

## Target provider choice

Recommended first provider:

- `jszyapi` base VOD JSON endpoint
- reference example: `https://jszyapi.com/api.php/provide/vod/at/json`

## Why this is the right first slice

1. It is explicitly named in `reference-assets/backend.md`.
2. It is a real provider family the project already targets, not a placeholder.
3. The JSON shape is easier to fixture and validate than XML for the first execution slice.
4. The base VOD feed is the best first checkpoint because it exercises:
   - provider fetch
   - page-level ingestion
   - raw payload capture
   - staging-safe candidate shaping
5. It is still narrow enough to avoid prematurely taking on the full matrix of:
   - multiple source-line providers
   - XML and JSON variants
   - every provider-specific edge case

This slice should prove the architecture with one real concrete path before broadening to additional providers such as `jsyun` or `jsm3u8`.

## Required execution order

1. `planner`
- publish this handoff

2. `media-ingest`
- implement the concrete provider adapter and executable ingest path

3. `data-catalog`
- only participate if real provider execution reveals a missing persistence or backend support gap

4. `reviewer`
- validate adapter discipline, execution-path correctness, testing coverage, and ownership boundaries

## Implementation scope

This slice covers:

- one concrete `jszyapi` JSON provider adapter
- provider fetch through the existing provider/ingest boundaries
- one executable ingest path for at least one page or bounded fetch window
- fixture-based or mock-based tests for adapter parsing and ingest-path behavior
- persistence integration only as needed to exercise the staging path

The executable path should prove:

1. provider request parameters can be assembled correctly
2. response payload can be parsed into staging-safe output
3. raw payload and parsed staging output remain separate
4. ingest execution goes through provider/ingest modules rather than route-local code

## Explicit non-goals

- no public route redesign
- no admin redesign
- no player work
- no auth/session work
- no auto-publish behavior
- no full multi-provider strategy in this slice
- no XML support unless it is required incidentally for local parsing utilities
- no normalization or review workflow expansion beyond what already exists
- no broad Data Catalog schema rewrite unless a concrete support gap is discovered during execution

## Ownership split

## Media Ingest owns

This slice is primarily owned by `media-ingest`.

Round responsibilities:

- implement the concrete `jszyapi` adapter under provider/ingest boundaries
- wire one executable ingest path through those boundaries
- define provider-specific request/response handling
- keep raw payload and staging-safe output separated
- add tests using fixtures/mocks so CI does not require live network

Owned surfaces:

- `lib/server/provider/`
- `lib/server/ingest/`
- `scripts/`
- `package.json` only for safe provider-ingest script entries if required

`media-ingest` must **not**:

- bypass the existing provider/ingest module map
- add route-local fetch logic
- auto-publish data
- redesign public runtime serving

## Data Catalog owns only if needed

`data-catalog` participates only if the concrete provider execution path reveals a real backend support gap.

Allowed narrow participation:

- missing persistence helpers for raw payload or staged candidate writes
- missing shared backend contract needed by the executable ingest path
- narrow Prisma or `lib/db/` support needed to keep the path real and non-fake

`data-catalog` must **not**:

- broaden this slice into general schema cleanup
- redesign the staging model
- expand published catalog serving
- add work unrelated to the single provider execution path

## Reviewer owns

Reviewer owns:

- findings and acceptance docs only
- validation of execution-path correctness, test coverage, adapter discipline, and scope control

## Contract discipline for this slice

The adapter must stay inside provider/ingest boundaries.

That means:

- provider request formation belongs in provider modules
- provider response parsing belongs in provider modules
- ingest orchestration belongs in ingest modules
- public routes must not import or execute this path directly

The path should terminate at staging-safe output or staging persistence.

It must not:

- normalize into canonical catalog records
- write published catalog state
- trigger review/publish automatically

## Test requirements

Tests are mandatory for this slice.

Required testing approach:

- fixture-based and/or mock-based
- runnable without live network in CI
- deterministic

Minimum required test coverage:

### 1. Provider response parsing

- parse at least one representative `jszyapi` JSON payload fixture
- verify staging-safe output shape
- verify raw provider fields do not leak directly into downstream public contracts

### 2. Request/path execution

- verify the adapter or ingest path constructs the expected provider request parameters for a bounded fetch case
- verify pagination or page-based execution behavior for at least one page input

### 3. Raw payload separation

- verify raw payload capture stays distinct from parsed staging-safe output

### 4. Failure-path handling

- verify provider error, malformed payload, or empty-page handling is surfaced predictably
- avoid network dependence in these tests

### 5. Ingest-boundary execution

- verify the executable path runs through provider/ingest modules rather than a route-local shortcut

If a live manual test is helpful, it may be added as a non-CI verification step, but CI acceptance must not depend on network availability.

## Acceptance checklist

### 1. Concrete provider exists

- at least one real adapter exists for a target provider named in `backend.md`
- the provider is not a fake demo adapter

### 2. Executable ingest path exists

- the provider path can actually run through provider/ingest boundaries for a bounded fetch case
- the slice is not only interface definitions without an executable flow

### 3. Tests are real and offline-safe

- tests exist
- tests run without live network in CI
- fixtures or mocks cover the critical path

### 4. Raw payload and staging-safe output remain separated

- raw provider payload handling is distinct from parsed ingest output
- published catalog logic is not mixed into this path

### 5. Scope discipline is preserved

- no public route redesign
- no admin redesign
- no player work
- no auto-publish behavior
- no ad hoc route-local provider execution

### 6. Narrow Data Catalog participation only if required

- if `data-catalog` changed files, the change must be traceable to a concrete provider execution support gap
- if no such gap existed, `data-catalog` should not be used in this slice

### 7. Build and test health

- the project remains buildable
- relevant provider-path tests pass

## Media Ingest implementation checklist

### 1. Choose the concrete adapter target

- implement the base `jszyapi` JSON VOD adapter first
- keep the slice limited to one concrete target/provider shape

### 2. Make the provider path executable

- wire the adapter into the ingest path through the accepted provider/ingest boundaries
- support at least one bounded fetch scenario such as one page or one checkpointed fetch window

### 3. Keep payload handling disciplined

- capture raw payload separately
- convert to staging-safe output separately
- avoid contaminating public/runtime contracts

### 4. Add mandatory tests

- create fixtures for representative `jszyapi` JSON payloads
- add parsing and execution-path tests
- keep CI network-independent

### 5. Keep scope narrow

- do not broaden into XML, additional providers, or provider scheduling unless strictly required by the executable path

## Data Catalog implementation checklist

Only if concrete execution reveals a support gap:

### 1. Add the minimum missing backend support

- add only the smallest missing persistence or contract support needed to run the real provider path honestly

### 2. Do not broaden scope

- avoid opportunistic schema or repository expansion unrelated to the slice

### 3. Preserve staging discipline

- any support added must still stop at staging/raw-payload boundaries
- do not cross into publish or public-serving concerns

## Reviewer implementation checklist

### 1. Validate provider reality

- confirm the adapter targets a real provider from `backend.md`

### 2. Validate executable path

- confirm the path is runnable through provider/ingest boundaries
- confirm it is more than interface scaffolding

### 3. Validate offline-safe test coverage

- confirm tests exist and do not require live network in CI
- confirm fixtures/mocks cover the important execution cases

### 4. Validate scope control

- confirm there is no route-local shortcut
- confirm there is no auto-publish
- confirm there is no spill into public runtime, player, or admin redesign

### 5. Validate ownership discipline

- confirm `media-ingest` owns the main implementation
- confirm `data-catalog` only appears if a concrete gap required it

## Acceptance gate

This slice passes only if:

- one real provider adapter from `backend.md` exists
- the provider path is executable through provider/ingest boundaries
- mandatory offline-safe tests exist and pass
- raw payload and staging-safe output stay separated
- no ad hoc or route-local execution path appears
- no auto-publish behavior is introduced

This slice fails if:

- the adapter is still effectively a stub
- tests depend on live network
- the path bypasses provider/ingest boundaries
- the slice broadens into unrelated backend or frontend work
