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

### Player Refinement Round 4

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Reviewer audits the current regressions, prepares the runtime QA inventory, and confirms the acceptance checklist
3. Detail Player implements only within owned files
4. Reviewer validates the result in-browser before merge
5. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Route: `/media/[slug]`
- Owned surfaces: `app/media/`, `components/player/`, `components/detail/`
- No changes to unrelated UI shell, search, or data architecture unless explicitly approved

Acceptance criteria:
- Volume and speed sliders must not change playback progress
- Volume control must appear only on hover, slide out from the right side of the volume control, and must not block the volume button
- Volume hover and mute state must expose correct tooltip text and shortcut guidance
- Speed panel must be smaller, semi-transparent, anchored to the lower-right area of the player, and auto-close on outside click or other player actions
- Theater/fullscreen iconography must be revised against the provided reference asset
- Theater/fullscreen modes must remove unrelated labels and visible borders, with non-video area rendered black
- Clicking the video surface must toggle play/pause
- Resume playback must restore from a saved breakpoint when reopening the same media/episode
- Watched episodes must render in a dimmed state when not active
- Episode/source switching inside the detail route must preserve scroll position instead of jumping to the top
- Controls must hide when inactive and reappear on hover or active interaction with a black control-bar background
- Runtime sign-off must include interactive browser verification for sliders, overlays, control visibility, and layout against the supplied reference assets
- A refinement candidate is not acceptable if the user cannot observe the requested behavior changes in the actual UI

Current user-reported regressions to fix:
1. Moving the volume and speed sliders still affects playback progress and can reset playback to the beginning
2. The volume slider geometry is still wrong: it should slide smoothly out from the right of the volume button, push the time label to the right while expanding, and show only the slider without a panel background
3. The control bar background must return to black and auto-hide when inactive so it no longer blocks the video
4. The speed panel is still not anchored to the lower-right corner and is not using the requested semi-transparent treatment

Round 3 outcome:
- The Round 3 detail-player candidate was rejected by user review because the requested UI/runtime changes were not observable in the product.
- Round 4 must treat those four regressions as still open.
