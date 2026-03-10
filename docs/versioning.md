# Versioning

Current version: `0.8.0`

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

That makes `0.8.0` an appropriate current milestone: the prototype now has real public list pages, canonical list-backed watch entry flows, and visible list-aware playback context, while still remaining short of a launch-ready platform.

## Rules

- Use Semantic Versioning with a pre-1.0 interpretation.
- Stay on `0.x.y` until the product is genuinely launch-ready.
- Bump `PATCH` for bug fixes, small UX refinements, docs/process updates, tooling changes, and other non-milestone work.
- Bump `MINOR` for meaningful user-visible capability additions, new platform slices, significant playback/runtime milestones, ingestion milestones, or breaking changes before `1.0.0`.
- Reserve `1.0.0` for the first launch-ready release.

## Practical Mapping

- `0.8.x`
  Current baseline with real public list pages, canonical list-backed watch flows, and list-aware playback context on top of the existing prototype platform.
- `0.9.0`
  A later pre-launch milestone such as stronger database-backed catalog integration, authenticated user state, or admin/content operations becoming real product surfaces.
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
