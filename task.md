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

### Episode Navigation And Selector Round 2

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Detail Player implements the selector-entry and popup-behavior corrections inside the watch/player surface
3. Reviewer validates hover-trigger behavior, popup stability, compact episode layout, and keyboard interaction before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Episode-navigation UX corrections for the newly added selector-entry and popup behavior
- Owned surfaces:
  - Detail Player: `app/media/`, `app/watch/`, `components/player/`, `components/detail/`
  - Planner/Reviewer: docs and acceptance only
- No unrelated browse redesign, auth flow, admin tooling, or broader player redesign beyond these episode-navigation rules

Acceptance criteria:
- The episode-entry control must remain hidden until the user hovers the `下一集` area and should slide out from the right side of the next-episode button instead of staying always visible
- The episode-entry control must show an icon plus the current episode number, without the literal text `选集`
- Opening the episode popup or navigating it from the keyboard must not cause the page or player viewport to shift unexpectedly
- The episode popup must render a denser numeric-only episode grid/list rather than oversized title buttons
- Existing `N` / `E` shortcuts, hover tooltips, canonical routing, and next-episode behavior must not regress

Current user-requested improvement to implement:
1. Make the episode-entry control slide out from the right of `下一集` on hover instead of staying always visible.
2. Show only an icon plus the current episode number on that control, without the text `选集`.
3. Eliminate page movement when opening the episode popup or changing popup selection from the keyboard.
4. Shrink the popup episode items to numeric-only dense buttons laid out horizontally or in a compact grid.

Current baseline:
- The current `N` next-episode behavior and expanded episode counts are already in place from Round 1.
- The remaining issues are visible interaction defects around when the `E` selector entry appears, what it displays, popup stability, and popup density.
