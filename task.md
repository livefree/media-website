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

### Player Refinement Round 6

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

Current user-requested improvements to implement:
1. Remove the volume meter from the volume button because it duplicates the slider’s purpose.
2. Reduce the volume slider thumb size so it matches the progress rail thumb diameter.
3. Fix the remaining alignment issue between the progress track and its draggable thumb.
4. In fullscreen mode, vertically center the video correctly within the viewport.
5. Move the speed popup so it aligns with the player’s right edge rather than the speed button’s right edge.
6. Fix the play/pause tooltip so it is not clipped on the left side of the player and remains fully readable.

Round 5 outcome:
- The major Round 5 interaction and control-bar refinement goals were resolved in the accepted baseline.
- Round 6 is a focused polish pass on control geometry, popup alignment, fullscreen centering, and tooltip placement.
