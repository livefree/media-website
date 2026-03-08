# Architecture

## Current implemented state

The repository is no longer just a static front-end structure mock. The current baseline already includes:

- Next.js App Router application shell
- public browse routes for:
  - `/`
  - `/movie`
  - `/series`
  - `/anime`
  - `/search`
  - `/media/[slug]`
- shared browse UI primitives in `components/`
- detail and player shell components in `components/detail/` and `components/player/`
- mock catalog and platform data in `data/`
- shared TypeScript contracts in `types/`
- browse, search, and catalog helpers in `lib/`
- a draft Prisma schema in `prisma/schema.prisma`
- local buildable Next.js runtime via `package.json`, `next.config.mjs`, and TypeScript config

What the current state represents:
- a front-end demo baseline with shared mock data
- URL-backed browse and search behavior
- detail-page and player-shell composition
- early data modeling for a future streaming platform

What the current state does **not** represent:
- a real backend
- production database integration
- authenticated users or sessions
- secure playback/runtime services
- admin or content-operations tooling
- observability, deployment, or launch readiness

## Production target state

The production target is a launchable streaming platform with:

- a public web application for browse, search, detail, and playback
- persistent catalog, playback, and user data
- API services for catalog, search, auth, progress, and admin actions
- authenticated user accounts with role-aware access control
- resilient playback and resource-delivery flows
- admin workflows for content ingestion, metadata curation, resource updates, and moderation
- operational coverage for deployment, monitoring, error reporting, backups, and security

In other words, the current repository is the presentation and schema baseline. The production target adds the server, data, identity, operations, and content-management layers required to ship and sustain the product.

## Current vs target

### Current demo baseline

- Mock-backed routes and components are present
- Search/filter behavior exists at the UI layer
- Detail/player page structure exists at the UI layer
- Prisma schema exists only as a planning and modeling artifact
- No app-owned API routes are present
- No database client or server-side data access layer is present
- No auth/session system is present
- No admin surface is present
- No production deployment or observability layer is present

### Production target

- Real catalog and user data stored in a production database
- App/API boundaries that separate UI from persistence and business logic
- Authenticated user system with protected actions and admin roles
- Playback/runtime services that manage sources, progress, and resource health
- Content-ops/admin workflows for publishing and maintaining the catalog
- Operational hardening for reliability, security, and launch readiness

## Missing backend and application capabilities

The following capabilities are still missing for launch:

### Platform foundation

- environment configuration strategy
- server-only module boundaries
- database client and migration workflow
- shared validation and error-handling conventions
- API response contracts

### Data and persistence

- live database integration
- seed/import pipeline for catalog ingestion
- normalized read/write model for titles, seasons, episodes, and resources
- durable storage for users, lists, history, progress, and feedback events

### API layer

- catalog read APIs
- search/filter APIs
- detail and playback metadata APIs
- progress, list, and feedback APIs
- admin and moderation APIs

### Auth and user system

- signup, login, logout, and session persistence
- protected routes and server-side authorization
- user profile, preferences, and watch-state ownership
- role model for end users vs admins/operators

### Playback and runtime

- source resolution and playback-provider abstraction
- progress persistence and resume behavior
- episode/source switching backed by persistent data
- download/resource health checks and invalid-resource reporting flows
- playback analytics and rate limiting

### Admin and content operations

- content ingestion and metadata editing workflows
- source and download-resource management tools
- moderation/report queues
- release/publish workflow for titles and episodes

### Observability, deployment, and security

- environment isolation for dev/staging/prod
- logging, metrics, tracing, and error reporting
- database backup and migration safety
- secret management
- input validation, auth hardening, and abuse controls

## Proposed production module boundaries

The current repo organization is suitable for the demo, but a launchable platform needs clearer backend and operational boundaries.

### Public application

Purpose:
- render browse, search, detail, and playback experiences

Suggested boundaries:
- `app/` for routes and route composition
- `components/` for shared UI
- `styles/` for shared presentation

### Backend/API

Purpose:
- expose server-side read/write capabilities to the app and admin tools

Suggested boundaries:
- `app/api/` for route handlers
- `lib/server/` for server-only orchestration
- `lib/http/` for response helpers, validation wrappers, and auth guards

### Data and persistence

Purpose:
- own database schema, client access, ingestion, and persistence contracts

Suggested boundaries:
- `prisma/` for schema and migrations
- `lib/db/` for client, repositories, and transactions
- `data/` for transitional seed data only until ingestion/admin flows replace static fixtures
- `types/` for app-facing contracts

### Auth and identity

Purpose:
- own sessions, users, roles, and protected actions

Suggested boundaries:
- `lib/auth/` for providers, sessions, and guards
- `app/(auth)/` or equivalent auth route group for login/signup/account flows

### Admin and content operations

Purpose:
- let operators manage titles, metadata, resources, reports, and publishing status

Suggested boundaries:
- `app/admin/`
- `components/admin/`
- `lib/admin/`

### Playback and resource runtime

Purpose:
- own source resolution, episode playback metadata, progress persistence, and resource health

Suggested boundaries:
- `lib/playback/`
- `lib/resources/`
- `lib/progress/`
- optional background jobs for validation and cleanup

### Ops and observability

Purpose:
- own deployment readiness, runtime visibility, and security controls

Suggested boundaries:
- `lib/ops/` for logging, metrics, feature flags, and runtime config
- platform configuration files for CI/CD, env management, and deployment

## Proposed service responsibilities

### Catalog service

- title lookup
- category slices
- search indexing inputs
- detail-page metadata reads

### Search service

- filter normalization
- ranking and pagination
- query analytics

### User service

- accounts
- preferences
- history
- lists
- watch progress ownership

### Playback service

- source selection
- episode state
- progress updates
- playback/runtime events

### Resource service

- download resources
- provider grouping
- validity reports
- resource refresh workflows

### Admin service

- metadata edits
- publishing controls
- resource updates
- moderation/report handling

## Delivery transition

The current implementation sequence for the demo is complete enough to serve as the production baseline:

1. Planner
2. Data Catalog
3. UI Shell
4. Search Filter
5. Detail Player
6. Reviewer

Productionization now starts **after** that baseline. The next roadmap should assume:

- browse, search, and detail demo routes exist
- shared mock contracts exist
- Prisma modeling exists
- backend and ops layers still need to be built

## Immediate planning implications

- Do not describe the current system as if APIs, auth, or live persistence already exist
- Treat the current app as a strong UI and schema prototype
- The next major engineering move is platform foundation and data integration, not another browse-shell iteration
