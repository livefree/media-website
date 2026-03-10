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

### Player Control Position And Episodic Autoplay Round 1

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Detail Player implements the control-position and episodic-autoplay behavior changes inside the watch/player surface
3. Reviewer validates bottom-anchored control positioning and the autoplay exception flows before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Player control positioning in theater/fullscreen modes and narrowly scoped autoplay exceptions for episodic navigation
- Owned surfaces:
  - Detail Player: `app/media/`, `app/watch/`, `components/player/`, `components/detail/`
  - Planner/Reviewer: docs and acceptance only
- No unrelated browse redesign, auth flow, admin tooling, or broader player redesign beyond these episode-navigation rules

Acceptance criteria:
- In theater mode and fullscreen mode, the player control bar must anchor to the bottom of the page or screen rather than staying in the same relative spot over the video frame
- Default watch-page entry must still remain non-autoplay
- Automatic transition to the next episode after the current episode ends must auto-play the newly entered episode
- Using the `下一集` button or choosing a new episode from the selector popup/menu must enter the next episode with autoplay enabled
- Existing canonical watch/list behavior, shortcuts, and selector routing must not regress

Current user-requested improvement to implement:
1. In theater mode and fullscreen mode, move the player control bar to the bottom of the page or screen.
2. Keep default watch-page entry paused, but auto-play when:
   - the current episode ends and advances to the next one
   - the user clicks the `下一集` button
   - the user selects a new episode from the selector UI

Current baseline:
- The player already preserves non-autoplay startup on direct entry, and episodic navigation plus next-episode routing already exist.
- The remaining issues are mode-specific control positioning and distinguishing autoplay-exception episode transitions from ordinary watch-page entry.
