# Planner Handoff: Backend Monolith Foundation Round A

## Task summary

Round A turns the backend-first architecture from planning intent into a concrete repository foundation.

This round does **not** build provider adapters, staging business logic, review queues, or publish flows yet. It only establishes the monolith module map and the shared backend conventions that later rounds will build on.

The foundation must align to:

- [docs/backend-spec.md](/Users/livefree/projects/media-website-v2/docs/backend-spec.md)
- [docs/architecture.md](/Users/livefree/projects/media-website-v2/docs/architecture.md)
- [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md)
- [task.md](/Users/livefree/projects/media-website-v2/task.md)

Core architectural intent for this round:

- one deployable monolith
- clear server-only module boundaries
- no provider or staging logic leaking into public route files
- repo structure that matches the future flow:
  - provider
  - ingest
  - normalize
  - review
  - catalog
  - source
  - health
  - search
  - admin

## Execution order

1. `planner`
- publish this handoff

2. `data-catalog`
- implement the backend monolith foundation only within backend-phase ownership

3. `reviewer`
- validate module boundaries, backend conventions, ownership drift, and scope discipline before merge

## Ownership boundaries for this round

### Data Catalog owned scope

For Round A, Data Catalog may work in these backend-phase surfaces:

- `prisma/`
- `types/` only when backend shared contracts or module-facing types are needed
- `lib/db/`
- `lib/server/`
- narrowly related backend foundation files required to wire those boundaries
- brief `docs/dev-log.md` entry for its own work

### Planner owned scope

- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/handovers/`
- `docs/dev-log.md`

### Reviewer scope

- review docs and acceptance findings only
- no takeover of `prisma/`, `lib/db/`, `lib/server/`, or public runtime implementation files

## In scope

- backend module skeleton under server-only boundaries
- DB and repository boundary conventions
- shared backend config conventions
- shared backend logging conventions
- shared backend error conventions
- monolith-safe export patterns so later rounds can add real logic without restructuring again

## Out of scope

- provider-specific adapters
- real ingest jobs
- raw payload persistence logic
- normalization/match implementations
- review queue behavior
- publish/unpublish business logic
- public catalog reintroduction
- admin UI
- player or public route redesign

## Data Catalog implementation breakdown

## 1. Create the backend module map

Establish server-only module directories that mirror the backend spec:

- `lib/server/provider/`
- `lib/server/ingest/`
- `lib/server/normalize/`
- `lib/server/review/`
- `lib/server/catalog/`
- `lib/server/source/`
- `lib/server/health/`
- `lib/server/search/`
- `lib/server/admin/`
- `lib/db/`

Round A expectation:

- each module should exist as an intentional boundary
- each module should expose minimal foundation entrypoints or placeholder barrels where appropriate
- placeholder files should describe or encode responsibility boundaries, not fake completed business logic

## 2. Add shared backend foundation conventions

Create shared backend support boundaries for:

- config / environment access
- structured logging
- backend error types or error mapping
- repository and transaction access

Recommended foundation areas:

- `lib/server/config/`
- `lib/server/logging/`
- `lib/server/errors/`
- `lib/db/client.ts`
- `lib/db/repositories/`
- `lib/db/transactions/`

Round A expectation:

- public routes and UI components should not import raw environment variables or ad hoc DB access directly once these boundaries exist
- later rounds should be able to plug business logic into these modules without rearranging the repo again

## 3. Define repository boundary expectations

Round A should make repository intent explicit:

- route handlers and pages should not become the primary DB access layer
- backend modules should call repositories rather than inline Prisma queries everywhere
- transaction boundaries should have one home under `lib/db/`, not be reinvented per feature

At this stage, it is enough to establish:

- repository directory layout
- naming conventions
- shared transaction entrypoints
- clear comments or types showing intended usage

It is not necessary to implement real catalog or ingest repositories yet.

## 4. Keep modules server-only

The foundation must clearly read as backend-only:

- avoid client-component imports
- avoid tying module paths to current public route composition
- do not put provider ingestion logic into `app/`
- do not let public browse/detail/watch routes become backend orchestration hosts

## 5. Avoid premature business logic

Round A should stop at scaffolding and conventions.

Do not use this round to:

- hardcode one provider adapter
- design a temporary shortcut around staging
- wire direct public reads back into seed data and call that backend completion
- hide unfinished business logic behind placeholder names that imply the module already works end to end

## 6. Preserve the withdrawn runtime catalog state

The runtime catalog is still intentionally withdrawn.

Round A must not:

- restore public content feeds
- reintroduce runtime source lists
- create new public-page dependencies on half-built backend scaffolding

## Recommended file and module outcomes

The exact filenames can vary, but Round A should leave the repo with an obvious backend layout similar to:

```text
lib/
  db/
    client.ts
    repositories/
    transactions/
  server/
    admin/
    catalog/
    config/
    errors/
    health/
    ingest/
    logging/
    normalize/
    provider/
    review/
    search/
    source/
```

Acceptable Round A outputs:

- empty or near-empty barrels plus responsibility comments
- shared type or interface stubs for service entrypoints
- server-only helper boundaries
- minimal wiring that proves the shape compiles

Unacceptable Round A outputs:

- route-local provider logic
- direct provider parsing code in public runtime files
- partial staging or publish behavior hidden in unrelated modules
- a fake adapter implementation that bypasses the planned module boundaries

## Reviewer acceptance checklist

## 1. Module map exists and matches the spec

- confirm the repo contains distinct server-only boundaries for:
  - provider
  - ingest
  - normalize
  - review
  - catalog
  - source
  - health
  - search
  - admin
  - db
- confirm the resulting layout matches the intent described in `docs/backend-spec.md`

## 2. Shared backend conventions exist

- confirm there is a clear shared home for:
  - config
  - logging
  - backend errors
  - DB client/repository/transaction boundaries
- confirm those conventions are not scattered as one-off helpers across unrelated directories

## 3. Scope discipline is preserved

- confirm Round A does not smuggle in provider-specific adapter logic
- confirm Round A does not implement staging-to-publish business flows yet
- confirm Round A does not reintroduce public runtime catalog behavior

## 4. Ownership boundaries are respected

- confirm Data Catalog stayed within backend-phase ownership for this round
- confirm no planner- or reviewer-owned docs were rewritten beyond the expected dev-log entry
- confirm no unrelated player, search, or public UI implementation files were modified

## 5. Public route leakage check

- inspect `app/` and public runtime surfaces for backend leakage
- confirm raw provider or staging logic did not land in public route files
- confirm backend scaffolding did not turn pages or components into temporary backend service containers

## 6. Buildability and integration sanity

- confirm the project still builds or typechecks successfully if those commands are available in the workspace
- confirm the new module skeleton does not introduce circular imports or obvious path confusion

## 7. Foundation quality judgment

- confirm the resulting structure gives later rounds an obvious home for:
  - Round B provider adapters and staging
  - Round C normalization
  - Round D review/publish
  - Round E canonical catalog serving
  - Round F source management and healthcheck

Round A should be rejected if the skeleton is so vague or misplaced that later rounds would still need to reorganize core backend boundaries.

## Acceptance gate

Round A passes only if:

- the backend monolith module map is concrete in the repo
- shared backend conventions exist for config, logging, errors, and DB/repository boundaries
- the structure aligns to the tracked backend spec and roadmap
- no provider-specific logic or staging/publish business logic is prematurely implemented
- no backend leakage lands in public route files
- the project remains buildable

Round A fails if:

- backend boundaries remain implicit or undocumented in code layout
- provider/staging logic starts landing in route files
- the change restores public runtime behavior prematurely
- the skeleton is so incomplete that Round B would still need to redesign the monolith foundation first
