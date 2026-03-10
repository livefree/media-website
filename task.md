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

### Demo Media Backfill Round 1

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Data Catalog maps the local demo-video assets into the existing catalog so empty or placeholder playback pages gain usable content
3. UI Shell provides fallback poster-card artwork and any public-facing presentation needed for missing media images
4. Detail Player removes the visible source-selection UI and keeps the simplified demo-backed playback flow working
5. Reviewer validates demo playback coverage, artwork fallback rendering, and the absence of the source-selection UI before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Local demo-media backfill, artwork fallback for testing, and simplifying the watch-page control surface for demo-backed playback
- Owned surfaces:
  - Data Catalog: `data/`, `types/`, `lib/media*`, and planning/schema artifacts only if required for demo-media mapping
  - UI Shell: `app/`, `components/`, `styles/`, and shared presentation assets for fallback poster cards
  - Detail Player: `app/media/`, `app/watch/`, `components/player/`, `components/detail/`
  - Planner/Reviewer: docs and acceptance only
- No unrelated browse redesign, auth flow, admin tooling, or new playback features beyond what is required for demo-backed testing

Acceptance criteria:
- Previously empty or placeholder playback pages must have usable local demo video mapped by media type for testing
- The visible playback source-selection UI must be removed from the watch page
- Media entries without working poster art must show consistent fallback poster-card artwork based on media type
- The demo-video mapping and poster fallback must not regress existing canonical watch routing or list-aware behavior
- Reviewer sign-off must confirm the demo-backed watch flow works end-to-end for affected titles and that fallback artwork renders where expected

Current user-requested improvement to implement:
1. Use the local demo videos in `reference-assets/` as playback content for previously empty media pages.
2. Remove the visible “视频源” / source-selection UI from the playback page.
3. Generate consistent fallback poster-card artwork for media entries that do not currently have working images.

Current baseline:
- The project now has stable canonical watch/list flows, but many catalog entries still rely on empty or placeholder playback content for actual testing.
- The watch page still exposes a source-selection surface that is not useful for a simplified demo-backed setup.
- Several titles still point at missing or non-working poster URLs instead of local fallback artwork.
