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

### Immersive Input Layering Round 1

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Detail Player implements the immersive input-layer and idle-manager refinement inside the watch/player surface
3. Reviewer validates cursor semantics and immersive auto-hide behavior before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Immersive-mode input layering, cursor semantics, and idle-manager behavior
- Owned surfaces:
  - Detail Player: `app/media/`, `app/watch/`, `components/player/`, `components/detail/`
  - Planner/Reviewer: docs and acceptance only
- No browse-card changes, route-model changes, data-contract changes, or broader player redesign beyond immersive input layering and synchronized idle behavior

Acceptance criteria:
- On the video image area, the cursor should remain arrow/default rather than hand
- Only actual interactive controls such as buttons and progress/slider controls should present hand-style pointer affordance
- In theater mode, after 3 seconds of inactivity, the control bar, immersive top title, and mouse cursor must all auto-hide reliably
- In fullscreen mode, after 3 seconds of inactivity, the control bar, immersive top title, and mouse cursor must all auto-hide reliably
- Idle hide must not require clicking a blank control-bar area first
- Interaction in immersive modes must reveal the chrome again
- Existing playback controls, title display, and routing must not regress

Current user-requested improvement to implement:
1. Analyze why the player behaves differently from YouTube-style web players in cursor semantics and hide behavior.
2. Ensure the video image area uses default cursor semantics, while only real controls show hand/pointer affordance.
3. Fix theater/fullscreen auto-hide so the chrome disappears after 3 seconds of inactivity without needing a blank-area click first.
4. Improve the internal layering/idle design toward a YouTube-style separation of passive video layer, gesture layer, control layer, and a single immersive idle manager.

Current baseline:
- The player already contains immersive auto-hide state and timeout logic, but the video surface still presents pointer-style affordance and the immersive hide path remains sensitive to where the cursor last rests.
- The remaining work is to separate passive video-surface semantics from real controls and make immersive idle behavior robust even when the pointer was last over the control strip.
