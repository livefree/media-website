# Versioning

Current version: `0.10.0`

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

That makes `0.10.0` an appropriate current milestone: the platform now has explicit source inventory, health state, probe and repair-oriented backend flow, and health-aware watch-page source resolution on top of published catalog serving, while it still remains pre-launch because auth/session flows, broader operator surfaces, production observability, and full runtime hardening are not finished.

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
  Current baseline with explicit source inventory, source health state, repair queue, and health-aware watch-source resolution layered onto the published-catalog backend.
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
