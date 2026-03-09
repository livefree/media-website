# Roadmap

## Current baseline

Completed baseline:
- browse routes exist for `/`, `/movie`, `/series`, `/anime`
- `/search` exists with UI-level query behavior
- `/media/[slug]` exists with detail and player shell composition
- shared mock catalog data and TypeScript contracts exist
- a draft Prisma schema exists

This baseline is sufficient for a demo. It is **not** sufficient for launch.

The roadmap below begins after the current UI-demo baseline.

## Phase 1: Platform foundation

Goals:
- establish the server-side architecture needed to move beyond mock-only behavior
- create the boundary between public app code and backend/application services
- define environment, config, and server-only module patterns

Scope:
- add server-side module boundaries for API, DB, auth, and runtime concerns
- define environment variable strategy and secret handling expectations
- add shared server validation, error handling, and response conventions
- define staging vs production deployment assumptions

Exit criteria:
- the repo has agreed module boundaries for app, API, DB, auth, admin, playback, and ops
- environment/config strategy is documented and reflected in the codebase structure
- downstream agents can build server capabilities without inventing architecture ad hoc

## Phase 2: Data and database integration

Goals:
- convert the current schema and mock-data planning work into a live persistence layer

Scope:
- wire Prisma into a real database workflow
- create DB client and repository/data-access layer
- migrate mock media contracts toward persistent catalog reads
- define ingestion or seed path for catalog data
- persist users, lists, progress, and feedback-related data models where required

Exit criteria:
- the application can read core catalog data from a real database
- schema migration workflow exists and is repeatable
- mock-only reads are no longer the only source for core catalog flows

## Phase 3: API layer

Goals:
- introduce server APIs for public app and internal workflows

Scope:
- catalog APIs
- search/filter APIs
- detail/playback metadata APIs
- progress/list/feedback APIs
- internal/admin-facing mutation APIs where needed

Exit criteria:
- key app flows no longer depend on page-local data access only
- API contracts exist for catalog, search, detail, and stateful user actions
- server-side validation and consistent error handling are in place

## Phase 4: Auth and user system

Goals:
- add identity, session, and user-owned state

Scope:
- signup/login/logout/session persistence
- account and preference model
- role-aware authorization
- protected actions for progress, lists, and admin access

Exit criteria:
- authenticated users can sign in and keep session state
- user-owned data is no longer anonymous-only
- admin or operator roles can be separated from public users

## Phase 5: Playback and runtime

Goals:
- turn the current player shell into a production-capable playback/runtime layer

Scope:
- source resolution and provider abstraction
- episode/source switching backed by persistent data
- progress tracking and resume behavior
- download-resource handling and invalid-resource feedback
- playback/runtime analytics and abuse controls

Exit criteria:
- playback metadata is served from real runtime-aware data
- progress updates persist correctly for authenticated users
- resource and playback flows are durable enough for real usage

## Phase 6: Admin and content operations

Goals:
- enable operators to manage the catalog and resource lifecycle without code edits

Scope:
- admin UI or internal tools for titles, metadata, and release state
- source/download resource management
- moderation/report queue for invalid resources and content issues
- publishing and content-update workflows

Exit criteria:
- operators can update content and resources through managed workflows
- content/resource maintenance no longer requires direct repository edits
- moderation/report handling path exists

## Phase 7: Observability, deployment, and security

Goals:
- make the platform operable, debuggable, and defensible in production

Scope:
- deployment workflow for staging and production
- structured logging, metrics, tracing, and error reporting
- secret management and environment isolation
- migration safety, backups, and rollback expectations
- auth hardening, input validation, and abuse/rate-limit protections

Exit criteria:
- the platform can be deployed and monitored outside local development
- failures are visible through logs and monitoring
- security and operational basics are in place for live traffic

## Phase 8: Launch hardening

Goals:
- verify the product is actually ready to launch

Scope:
- end-to-end QA across browse, search, detail, auth, playback, and admin flows
- performance and reliability testing for core routes
- analytics sanity checks
- content quality review and operational runbooks
- launch checklist and rollback plan

Exit criteria:
- launch-critical flows pass end-to-end validation
- known risks are documented and accepted or fixed
- operational owners have a clear launch and rollback procedure

## Immediate priority order

1. Platform foundation
2. Data and database integration
3. API layer
4. Auth and user system
5. Playback and runtime
6. Admin and content operations
7. Observability, deployment, and security
8. Launch hardening

## What should not happen next

- Do not continue treating mock data as the long-term runtime source
- Do not add launch-only features directly into route components without server/data boundaries
- Do not assume playback, auth, or admin work can be deferred until the end; they are core platform phases now
