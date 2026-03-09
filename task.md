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

### Player Refinement Round 8

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
- The red played segment and buffered segment must remain visually clipped to the progress rail and must not spill into the left control cluster or time display area
- The progress rail must keep the Round 7 thumb/track center-line alignment while restoring a correct positioning context for the custom fill layers
- The fix must address the positioning-context bug introduced by the Round 7 structural change, not by hiding overflow on a larger unrelated container
- Runtime sign-off must include close-up browser verification that the left control area no longer shows a large red fill block
- This focused round must not introduce unrelated changes to volume, speed, fullscreen, tooltip, or other accepted Round 6 and Round 7 behavior

Current user-requested improvement to implement:
1. Fix the progress played/buffered layer containment bug so the custom fill stays inside the rail instead of expanding over the left control area and time display.

Round 7 outcome:
- Round 7 corrected the thumb/track center-line alignment by moving the custom rail and native input into shared geometry.
- That structural change introduced a new regression: the absolutely positioned played/buffered fill layers lost the correct rail-local positioning context and now expand into the left control region.
