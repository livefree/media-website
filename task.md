# Project Task

Recreate the front-end structure of a modern streaming-style media catalog website.

Pages required:

/
/movie
/series
/anime
/search
/media/[slug]

Shared components:

Navbar
SearchBox
FilterBar
MediaCard
MediaGrid
Pagination
PlayerShell

## Current Active Task

### Free Video Source Integration Planning Round 1

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Coordinator records the current engineering review and improvement backlog
2. Data Catalog removes the current local demo-video dependency from runtime catalog data
3. Planner designs the lawful free-video ingestion, packaging, moderation, and playback architecture
4. Reviewer validates that demo-video runtime references are cleared and that the plan covers the required platform workflow
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Remove local demo-video runtime dependency and produce a production-oriented plan for lawful free-video source integration
- Owned surfaces:
  - Coordinator: docs and task framing
  - Data Catalog: `data/`, `lib/media*`, `types/` only as needed to remove demo-backed runtime mapping
  - Planner/Reviewer: docs and acceptance only
  - Planner/Reviewer: docs and acceptance only
- No illicit scraping workflow, no bypass of access controls, and no broad playback redesign in this round
- This round assumes only authorized free-to-publish sources such as public-domain, Creative Commons, direct creator uploads, or licensed free catalogs

Acceptance criteria:
- The current site must no longer depend on local `/demo/...` media paths for runtime playback
- The engineering findings and improvement backlog must be recorded on disk
- A detailed design doc must exist for a mature, lawful free-video onboarding workflow covering:
  - source intake and rights verification
  - metadata normalization and editorial review
  - ingest/transcode/package/storage/CDN flow
  - playback URL strategy and resource health checks
  - moderation, takedown/reporting, and operations
- The plan must be explicit that only authorized free-video sources are in scope
- Existing site structure and public URL model must remain intact in this planning round

Current user-requested improvement to implement:
1. Record the current code/engineering issues and recommended improvements.
2. Clear the current website demo videos before the next real integration phase.
3. Design a mature, real-world workflow for onboarding and publishing free video resources over the network.
4. Prepare the platform for future implementation without relying on local demo assets.

Current baseline:
- The current runtime catalog still maps media playback by type to local `/demo/...` files.
- The platform already has public watch URLs, a functional player, Prisma scaffolding, and ingest scripts, but it does not yet have a production-grade lawful video onboarding pipeline.
