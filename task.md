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

### Episode Navigation And Selector Round 1

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Data Catalog expands series/anime episode coverage for realistic selector and next-episode testing
3. Detail Player implements the episode-selector and next-episode interaction changes inside the watch/player surface
4. Reviewer validates next-episode behavior, selector popup behavior, keyboard interaction, and expanded episode coverage before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Episode navigation UX, selector interaction, and expanding episodic test data for series/anime playback
- Owned surfaces:
  - Data Catalog: `data/`, `types/`, `lib/media*`
  - Detail Player: `app/media/`, `app/watch/`, `components/player/`, `components/detail/`
  - Planner/Reviewer: docs and acceptance only
- No unrelated browse redesign, auth flow, admin tooling, or broader player redesign beyond these episode-navigation rules

Acceptance criteria:
- Series and anime entries used for testing must expose 10-50 episodes each through the existing data model
- The main in-player episode buttons must render as numeric labels (`1`, `2`, `3`, ...) rather than verbose titles
- Hovering an episode button must reveal the episode title when one exists
- The player must expose a visible `下一集` button when a next episode exists, with the same tooltip/shortcut treatment as other controls
- A right-edge `选集 (E)` trigger must reveal an episode popup anchored like the speed panel, with the current episode highlighted and keyboard navigation via arrow keys plus `Enter`
- Existing canonical watch/list behavior and next-episode routing must not regress

Current user-requested improvement to implement:
1. Keep or add a `下一集` button for videos that have a next episode.
2. Convert the current episode selector to numeric buttons only, while showing episode titles on hover.
3. Expand all current `series` and `anime` entries to 10-50 episodes each for testing, still using demo video playback.
4. Add a right-side `选集 (E)` trigger that opens a compact episode popup at the lower-left of the player, with current-episode highlighting and mouse/keyboard selection support.

Current baseline:
- The player already contains a next-episode action with `N`, but it must now be treated as part of the unified episode-navigation acceptance surface.
- The current episode selector still renders full episode titles as inline buttons rather than a numeric-first compact selector system.
- Current series/anime episode counts are too small for realistic selector and popup testing.
