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

### Immersive Chrome Auto-Hide Round 1

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Detail Player implements the immersive inactive-timer behavior inside the watch/player surface
3. Reviewer validates the immersive 3-second auto-hide behavior before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Immersive-mode auto-hide timing for controls, top title, and cursor
- Owned surfaces:
  - Detail Player: `app/media/`, `app/watch/`, `components/player/`, `components/detail/`
  - Planner/Reviewer: docs and acceptance only
- No browse-card changes, route-model changes, data-contract changes, or broader player redesign beyond immersive auto-hide timing and synchronization

Acceptance criteria:
- In theater mode, after 3 seconds of inactivity, the control bar, immersive top title, and mouse cursor must all auto-hide
- In fullscreen mode, after 3 seconds of inactivity, the control bar, immersive top title, and mouse cursor must all auto-hide
- Interaction in immersive modes must reveal those elements again
- Non-immersive playback must not regress
- Existing playback controls, title display, and routing must not regress

Current user-requested improvement to implement:
1. Check theater/fullscreen modes for cases where the controller, title, or mouse pointer do not auto-hide.
2. Ensure those components auto-hide after 3 seconds of inactivity.
3. Keep them synchronized so immersive chrome behaves consistently.

Current baseline:
- The player already contains auto-hide state and timeout logic for immersive chrome.
- The remaining work is to verify and tighten the inactive 3-second behavior so the bottom controls, top title overlay, and cursor all hide reliably in theater and fullscreen.
