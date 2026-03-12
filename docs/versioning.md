# Versioning

Current version: `0.27.0`

## Rationale

The project is beyond an initial demo shell:

- browse, category, search, and detail routes exist
- the player is interactive and has been through multiple runtime refinement rounds
- local ingest, Prisma schema, and minimal API scaffolding exist
- the repository has a defined multi-agent workflow with planning, review, and integration rules

The project is not yet launch-ready:

- core catalog flows are not fully database-backed
- the API layer is still partial
- auth, admin, production playback/runtime hardening, and ops/deployment are incomplete

That makes `0.27.0` an appropriate current milestone: the platform now completes the remaining Workstream 3 governance slice as well, with future publish scheduling, schedule clearing/rescheduling, and published visibility hide/restore all expressed through bounded review/catalog/admin workflows and deterministic rendered admin coverage, while final production hardening and launch-readiness work still remain unfinished.

## Rules

- Use Semantic Versioning with a pre-1.0 interpretation.
- Stay on `0.x.y` until the product is genuinely launch-ready.
- Bump `PATCH` for bug fixes, small UX refinements, docs/process updates, tooling changes, and other non-milestone work.
- Bump `MINOR` for meaningful user-visible capability additions, new platform slices, significant playback/runtime milestones, ingestion milestones, or breaking changes before `1.0.0`.
- Reserve `1.0.0` for the first launch-ready release.

## Practical Mapping

- `0.8.x`
  Baseline with public list pages, broader public-list discovery, canonical list-backed watch flows, stronger list-aware playback/queue context, and demo/runtime cleanup ahead of backend-first catalog work.
- `0.9.x`
  Baseline with published-catalog-backed public browse/search/detail/watch/list serving in place, before source inventory and health/repair workflow became first-class runtime concerns.
- `0.10.x`
  Baseline with explicit source inventory, source health state, repair queue, and health-aware watch-source resolution layered onto the published-catalog backend.
- `0.11.x`
  Current baseline with the first accepted real provider execution path (`jszyapi` JSON ingest) and offline-testable provider/ingest execution on top of the existing backend foundation.
- `0.12.x`
  Current baseline with scheduled refresh/probe jobs and durable ingest-job state layered onto the accepted real-provider path.
- `0.13.x`
  Current baseline with the first operator-facing source inventory and repair queue UI layered onto the accepted provider execution and source-health backend foundation.
- `0.14.x`
  Current baseline with operator-facing published catalog listing and inspection layered onto the accepted review/publish and published-catalog backend foundation.
- `0.15.x`
  Current baseline with operator-facing moderation/report handling and manual title/source submission workflows layered onto the accepted admin/review/source backend foundation.
- `0.16.x`
  Current baseline with structured ingest-job telemetry, stable failure classification, and stronger operator-visible failure context across ingest, scheduled refresh, and source-probe flows.
- `0.17.x`
  Current baseline with explicit server-side admin/operator access boundaries, role checks, and safe deny behavior across existing privileged backend and admin route surfaces.
- `0.18.x`
  Current baseline with privileged queue-failure monitoring, triage-friendly ingest telemetry, and deterministic UI coverage for the narrow operator-facing queue failure surface.
- `0.19.x`
  Current baseline with deterministic migration preflight checks, privileged migration safety visibility, and fail-closed published-catalog rollout guardrails.
- `0.20.x`
  Current baseline with one deterministic offline-safe backend golden path covering ingest staging through publish, published read, and watch/health contract validation.
- `0.21.x`
  Current baseline with durable in-repo worker execution, queue claim/lease safety, and offline-tested unattended provider job processing layered onto the accepted backend foundation.
- `0.22.x`
  Current baseline with restart-safe continuation, durable checkpoint advancement, and idempotent recovery for provider page jobs layered onto the unattended worker path.
- `0.23.x`
  Current baseline with bounded retry semantics, provider-aware throttling, and durable backoff timing for queued provider page jobs.
- `0.24.x`
  Current baseline with deterministic one-provider backfill/incremental sync orchestration and durable promotion order across restarts.
- `0.25.x`
  Current baseline with the Workstream 1 provider-intake exit gate met for one provider lane: unattended sync scheduling, durable orchestration, resumability, and bounded retry/throttle execution.
- `0.26.x`
  Current baseline with the Workstream 2 operator control-plane exit gate closed: source inventory, repair queue, published catalog inspection, and source/catalog lifecycle mutations are all now exposed through bounded admin workflows with deterministic rendered-surface coverage.
- `0.27.x`
  Current baseline with the Workstream 3 governance exit gate closed: moderation/manual-submission workflows plus publish scheduling and visibility control are now executable through bounded admin and review/catalog workflows without direct database edits.
- `1.0.0`
  First production-ready launch baseline.

## Update Procedure

When the version changes, update:

1. `package.json`
2. `package-lock.json`
3. `README.md`
4. `docs/versioning.md`
5. `docs/dev-log.md`

The Coordinator owns this decision and should apply it during integration, not leave it implicit.
