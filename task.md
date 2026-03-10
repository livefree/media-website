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

### Player Title Overlay Round 1

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Detail Player implements the playback-title and immersive-top-overlay behavior inside the watch/player surface
3. Reviewer validates the watch-page title replacement and immersive top-overlay behavior before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Watch-page player title copy and immersive-mode top overlay behavior
- Owned surfaces:
  - Detail Player: `app/media/`, `app/watch/`, `components/player/`, `components/detail/`
  - Planner/Reviewer: docs and acceptance only
- No browse-card changes, route-model changes, data-contract changes, or broader player redesign beyond title display and immersive overlay behavior

Acceptance criteria:
- The watch-page section heading must change from `在线播放` to `视频名称 + 【集数】`
- For movies or non-episodic playback, the heading must still show a clean media-title-only form without a broken episode suffix
- In theater mode and fullscreen mode, the top edge of the page/screen must also show `视频名称 + 【集数】`
- That immersive top title must auto-hide together with the player chrome/cursor behavior and reappear on interaction
- Existing control-bar auto-hide behavior, playback controls, and routing must not regress

Current user-requested improvement to implement:
1. Replace `在线播放` with `视频名称 + 【集数】`.
2. In fullscreen mode and theater mode, also show `视频名称 + 【集数】` at the top edge of the page or screen.
3. The immersive top title must auto-hide the same way the player controls and cursor auto-hide.

Current baseline:
- The watch page currently renders a generic `在线播放` heading above the player.
- The immersive player chrome already manages bottom control visibility, but does not yet expose a matching top title overlay in theater/fullscreen modes.
